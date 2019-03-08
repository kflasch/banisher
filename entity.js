Game.Entity = function Entity(properties) {
    properties = properties || {};

    Game.DynamicGlyph.call(this, properties);
    this._templateName = properties['templateName'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._sightRadius = properties['sightRadius'] || 0;
    this._rating = properties['rating'] || 1;

    this._zone = null;
    this._alive = true;
};

extendObj(Game.Entity, Game.DynamicGlyph);

Game.Entity.prototype.setPosition = function(x, y, zone) {
    var oldX = this._x;
    var oldY = this._y;

    this._x = x;
    this._y = y;
    zone.updateEntityPosition(this, oldX, oldY);
};

// todo: combine player with entities, zone arg?
Game.Entity.prototype.tryMove = function(x, y, zone) {
    var tile = zone.getTile(x, y);
    var isPlayer = this.hasMixin(Game.EntityMixins.PlayerActor);
    var descMsg = null;
    var target = zone.getEntityAt(x, y);
    if (target) {
        if (this.hasMixin('Attacker')) {
            this.attack(target);
            // if attacking a non-Attacker, make it one
            if (!target.hasMixin('Attacker'))
                target.addMixin('Attacker');
            if (target.hasMixin('TaskActor') && !target._tasks.includes('hunt'))
                target._tasks.unshift('hunt');
            return true;
        }
    } else if (tile._passable) {
        this.setPosition(x, y, zone);

        var items = zone.getItemsAt(x, y);
        if (items) {
            if (items.length === 1) {
                descMsg = "You see a " + items[0].getName() + ".";
            } else {
                descMsg = "You see several objects here.";
            }
        } else {
             //descMsg = 'You pass through ' + tile._desc + '.';
        }
    } else if (isPlayer) {
        if (tile == Game.Tile.nullTile) {
             descMsg = "You cannot pass this way.";
        } else {
             descMsg = (tile._desc || 'Something') + ' is in the way.';
            descMsg = ROT.Util.capitalize(descMsg);
        }
    }
    if (isPlayer && descMsg)
        Game.UI.addMessage(descMsg);
};

Game.Entity.prototype.tryDoor = function(x, y, zone) {
    var tile = zone.getTile(x, y);
    var isPlayer = this.hasMixin(Game.EntityMixins.PlayerActor);
    var ent = zone.getEntityAt(x, y);
    // gross checks but loading saved game breaks checking in a better way
    if (ent) {
        Game.UI.addMessage('A ' + ent._name + ' is in the way!');        
    } else if (tile._desc === 'a closed door') {
        zone.setTile(x, y, Game.Tile.openDoor);
        Game.UI.addMessage('You open the door.');
    } else if (tile._desc === 'an open door') {
        zone.setTile(x, y, Game.Tile.closedDoor);
        Game.UI.addMessage('You close the door.');
    }
};

// TODO: clean this function up
Game.Entity.prototype.changeZone = function() {
    var tile = this._zone.getTile(this._x, this._y);
    var key = this._x + ',' + this._y;
    var zoneVal = this._zone._connections[key];    
    if (typeof zoneVal != 'undefined') {
        // check win condition
        if (zoneVal === -1) {
            if (this.hasItem('star ruby')) {            
                Game.wonGame();
            } else {
                Game.UI.addMessage('You cannot leave without the Star Ruby!');
            }
            return undefined;
        }
        if (this._zone._entities[key] == this) {
            delete this._zone._entities[key];
        } else {
            console.log("Error: cannot remove entity from current zone.");
            return undefined;
        }
        if (Number.isInteger(zoneVal)) {
            var entranceKey = Game.world._zones[zoneVal].getConnectionForZone(this._zone._id);
            this._x = Number(entranceKey.split(',')[0]);
            this._y = Number(entranceKey.split(',')[1]);
            Game.world._zones[zoneVal].updateEntityPosition(this);
            this._zone = Game.world._zones[zoneVal];
            if (this._zone._isMultiLevel)
                Game.UI.addMessage("You enter the " + this._zone._name.toLowerCase()
                                   + ", depth " + this._zone._depth + ".");
            else
                Game.UI.addMessage("You enter the " + this._zone._name.toLowerCase() + ".");
            return zoneVal;
        } else {
            var newZoneID = Game.world.generateNewZone(zoneVal, this._zone._id);
            this._zone._connections[key] = newZoneID;
//            console.log(newZoneID);
//            console.log(Game.world._zones[newZoneID]);
            var entranceKeyNew = Game.world._zones[newZoneID].getConnectionForZone(this._zone._id);
            var oldX = this._x;
            var oldY = this._y;
            this._x = Number(entranceKeyNew.split(',')[0]);
            this._y = Number(entranceKeyNew.split(',')[1]);
            Game.world._zones[newZoneID].updateEntityPosition(this, oldX, oldY);
            this._zone = Game.world._zones[newZoneID];
            if (this._zone._isMultiLevel)
                Game.UI.addMessage("You enter the " + this._zone._name.toLowerCase()
                                   + ", depth " + this._zone._depth + ".");
            else
                Game.UI.addMessage("You enter the " + this._zone._name.toLowerCase() + ".");
            return newZoneID;
        }
    } else {
        Game.UI.addMessage("You can't go there.");
        return undefined;
    }
};

Game.Entity.prototype.kill = function(message, zone) {
    if (!this._alive) {
        console.log("tried to kill already dead entity " + this._name);
        return;
    }

    this._alive = false;

    if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
        // player died
        if (message == null)
            message = "You have died!";
        Game.UI.addMessage(message);
    } else {
        zone.removeEntity(this);
    }
};

Game.Entity.prototype.isVisibleToPlayer = function() {
    for (var visEntity of Game.visibleEntities) {
        if (this === visEntity)
            return true;
    }
    return false;
};

Game.Entity.prototype.exportToString = function() {    
    function replacer(key, value) {
        if (key === '_zone') {
            return undefined;
        }
        return value;
    };

    return JSON.stringify(this, replacer);
};

Game.Entity.prototype.exportToStringOld = function() {
    var proplist = [];
    for (var key in this) {
        if (typeof key !== 'function' && typeof this[key] !== 'function') {
            if (typeof this[key] === 'object') {
                if (key !== '_zone') 
                    proplist.push('"'+key+'":' + JSON.stringify(this[key]));
            } else {
                proplist.push('"'+key+'":' + '"'+this[key]+'"');
            }
        }        
    }
    return "{" + proplist.toString() + "}";    
};

// mixins

Game.EntityMixins = {};

Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        if (this._acting)
            return;
        this._acting = true;

//        let promise = new Promise(resolve => this._resolve = resolve);
        
        if (!this._alive) {
            Game.lostGame();
        }

        if (this.hasMixin(Game.EntityMixins.Effectable))
            this.elapseEffects();
        if (this.hasMixin(Game.EntityMixins.Banisher))
            this.elapseBanishCooldown();
        
        Game.turns++;
        Game.refresh();
        Game.engine.lock();
        this._acting = false;
//        return promise;
    }
};

Game.EntityMixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function(template) {
//        this._items = template['items'] || new Array(10);
        if (template['items']) {
            this._items = new Array(template['items'].length);
            for (var i=0; i<template['items'].length; i++) {
                this._items[i]=Game.ItemRepository.create(template['items'][i]);
            }
        } else {
            this._items = new Array(10);
        }
    },
    getItems: function() {
        return this._items;
    },
    getItem: function(i) {
        return this._items[i];
    },
    addItem: function(item) {
        //this._items.find(function (a) {
        //    return a === undefined;
        //});
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i) {
        // if item is equippable, make sure it is unequipped before dropping
        if (this._items[i] && this.hasMixin(Game.EntityMixins.Equipper))
            this.unequip(i);
        this._items[i] = null;
    },
    pickupItems: function() {
        var zoneItems = this._zone.getItemsAt(this._x, this._y);

        if (this.addItem(zoneItems[0])) {
            zoneItems.splice([0], 1);
        } else {
            return false;
        }

        this._zone.setItemsAt(this._x, this._y, zoneItems);
        return true;
    },
    pickupItems: function(indices) {
        var zoneItems = this._zone.getItemsAt(this._x, this._y);
        var added = 0;
        for (var i=0; i < indices.length; i++) {
            // need to modify index since splice removes element from zoneItems
            if (this.addItem(zoneItems[indices[i] - added])) {
                zoneItems.splice(indices[i] - added, 1);
                added++;
            } else {
                // can't pick up item
                console.log("can't pick up item");
                break;
            }
        }
        this._zone.setItemsAt(this._x, this._y, zoneItems);
        return added === indices.length;
    },
    dropItems: function(indices) {
        var removed = 0;
        var itemName = "";
        for (var i=0; i < indices.length; i++) {
            if (this._items[indices[i]]) {
                if (this._zone)
                    this._zone.addItem(this._x, this._y, this._items[indices[i]]);
                itemName = this._items[indices[i]].getName();
                this.removeItem(indices[i]);
                removed++;
            }
        }
        if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
            if (removed === 1) {
                Game.UI.addMessage("You dropped a " + itemName + ".");
            } else if (removed > 1) {
                Game.UI.addMessage("You dropped " + removed + " items.");
            } else {
                Game.UI.addMessage("You don't drop anything.");
            }
        } else {
            if (removed === 1) {
                Game.UI.addMessage("The " + this._name + " dropped a " + itemName + ".");
            } else if (removed > 1) {
                Game.UI.addMessage("The " + this._name + " dropped " + removed + " items.");
            }
        }
    },
    dropItem: function(i) {
        if (this._items[i]) {
            var itemName = this._items[i].getName();
            if (this._zone)
                this._zone.addItem(this._x, this._y, this._items[i]);
            this.removeItem(i);
            if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
                Game.UI.addMessage("You dropped a " + itemName + ".");
            }
        }
    },
    getInvSize: function() {
        var count = 0;
        for (var i=0; i < this._items.length; i++) {
            if (this._items[i])
                count++;
        }
        return count;
    },
    hasItem: function(name) {
        for (var i=0; i < this._items.length; i++) {
            if (this._items[i] && this._items[i]._name === name)
                return true;
        }
        return false;
    },
    listeners: {
        onDeath: function(attacker) {
            if (!this.hasMixin(Game.EntityMixins.PlayerActor))
                this.dropItems(Object.keys(this._items));
        }
    }

};

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(template) {
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function() {

        if (this.hasMixin(Game.EntityMixins.Effectable))
            this.elapseEffects();
        if (this.hasMixin(Game.EntityMixins.Caster))
            this.elapseCastCooldown();
        // if (this.hasMixin(Game.EntityMixins.Banisher))
        //     this.elapseBanishCooldown();

        for (var i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function(task) {
        if (task === 'hunt') {
            // entities will only hunt player 
            return this.hasMixin('Sight') && this.canSee(Game.player);
        } else if (task === 'wander') {
            return true;
        } else if (task === 'castAoE') {
            return this.hasMixin('Caster') && this.canCast();
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    castAoE: function() {
        var entities = this._zone.getEntitiesAround(this._x, this._y, 3);
        for (var entity of entities) {
            this.attack(entity);
        }
        this._castCooldown = 8;
    },
    wander: function() {
        var moveOffset = ROT.RNG.getItem(ROT.DIRS[8]);
        this.tryMove(this._x + moveOffset[0], this._y + moveOffset[1], this._zone);
    },
    hunt: function() {
        // TODO: extend this to allow non-players to be hunted
        var target = Game.player;
        // console.log(this._name + ' hunting ' + target._name);
        
        // check adjacent
        var offsetX = Math.abs(target._x - this._x);
        var offsetY = Math.abs(target._y - this._y);
        if ((offsetX + offsetY === 1) ||
            (offsetX === 1 && offsetY === 1)) {
            if (this.hasMixin('Attacker')) {
                this.attack(target);
                return;
            }
        }

        // gen path towards target and move
        var source = this;
        var path = new ROT.Path.AStar(target._x, target._y, function(x, y) {
            // if another (non-target) entity is in the way, can't move there
            var entity = source._zone.getEntityAt(x, y);
            if (entity && entity !== target && entity !== source)
                return false;
            return source._zone.getTile(x, y)._passable;            
        });

        var count = 0;
        path.compute(source._x, source._y, function(x, y) {
            if (count == 1)
                source.tryMove(x, y, source._zone);
            count++;
        });
    }
};

Game.EntityMixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function(template) {
        this._sightRadius = template['sightRadius'] || 5;
    },
    getSightRadius: function() {
        return this._sightRadius;
    },
    canSee: function(entity) {
        // check if entity exists or is in the same zone
        if (!entity || this._zone !== entity._zone) {
            return false;
        }

        var entX = entity._x;
        var entY = entity._y;

        // check if within the bounds of the fov square
        if ((entX - this._x) * (entX - this._x) +
            (entY - this._y) * (entY - this._y) >
            this._sightRadius * this._sightRadius) {
            return false;
        }

        // compute fov and see if entity's coords are within it
        var found = false;
        this._zone._fov.compute(
            this._x, this._y, this._sightRadius,
            function(x, y, radius, visibility) {
                if (x === entX && y === entY)
                    found = true;
            }
        );
        return found;
    }
};


Game.EntityMixins.Killable = {
    name: 'Killable',
    init: function(template) {
        this._maxHP = template['maxHP'] || 1;
        this._hp = template['hp'] || this._maxHP;
        this._defenseValue = template['defenseValue'] || 0;
    },
    // agent is the object that changed hp
    modifyHP: function(agent, delta) {
        // if any wards, protect from attack and decrease wards
        if (this.getDefenseValue() > 0) {
            this._defenseValue--;
            return;
        }            
        this._hp += delta;
        if (this._hp > this._maxHP) {
            this._hp = this._maxHP;
        } else if (this._hp <= 0) {
            this.raiseEvent('onDeath', agent);
            agent.raiseEvent('onKill', this);
            this.kill(null, this._zone);
        }
    },
    getDefenseValue: function() {
        return this._defenseValue;
    }
};

Game.EntityMixins.Banishable = {
    name: 'Banishable',
    init: function(template) {
        this._protected = false || template['hasProtection'];
    },
    attemptRemoval: function(agent) {
        if (!this.isProtected()) {
           this.raiseEvent('onRemoved', agent);
            agent.raiseEvent('onBanished', this);
            this.kill(null, this._zone);

            // each banish, stronger ones appear
            var rating = this._rating+1;
            if (rating > 5) rating = 5;
            var newEntity = Game.EntityRepository.createRandom(rating);
            this._zone.addEntityAwayFrom(newEntity, agent._x, agent._y, 40);
        }
    },
    isProtected: function() {
        return this._protected;
    }
};

Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function(template) {
        // Chance of dropping a corpse (out of 100).
        this._corpseDropRate = template['corpseDropRate'] || 100;
    },
    listeners: {
        onDeath: function(attacker) {
            // Check if we should drop a corpse.
            if (Math.round(Math.random() * 100) <= this._corpseDropRate) {
                this._zone.addItem(this._x, this._y,
                    Game.ItemRepository.create('corpse', {
                        name: this._name + ' corpse',
                        fg: this._foreground
                    }));
            }    
        }
    }
};

Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._armor = null;
        this._handOne = null;
        this._handTwo = null;
    },
    wield: function(i) {
        this._handOne = i;
    },
    unwield: function() {
        this._handOne = null;        
    },
    wear: function(i) {
        this._armor = i;
    },
    takeOff: function() {
        this._armor = null;
    },
    getWeapon: function() {
        if (this._items)
            return this._items[this._handOne];
        else
            return null;
    },
    getArmor: function() {
        if (this._items)
            return this._items[this._armor];
        else
            return null;
    },
    unequip: function(i) {
        if (this._handOne == i) {
            this.unwield();
            if (this.hasMixin('PlayerActor'))
                Game.UI.addMessage("You unequip your " + this._items[i]._name + ".");
            else if (this.isVisibleToPlayer())
                Game.UI.addMessage(this._name + " unequips their " + this._items[i]._name + ".");
        } else if (this._armor == i) {
            this.takeOff();
            if (this.hasMixin('PlayerActor'))
                Game.UI.addMessage("You remove your " + this._items[i]._name + ".");
            else if (this.isVisibleToPlayer())
                Game.UI.addMessage(this._name + " removes their " + this._items[i]._name + ".");
        }
    },
    equip: function(i) {
        if (this._items[i]._wearable) {
            this.wear(i);
            if (this.hasMixin('PlayerActor'))
                Game.UI.addMessage("You wear the " + this._items[i]._name + ".");
            else if (this.isVisibleToPlayer())
                Game.UI.addMessage(this._name + " puts on " + this._items[i]._name + ".");
        } else if (this._items[i]._wieldable) {
            this.wield(i);
            if (this.hasMixin('PlayerActor'))
                Game.UI.addMessage("You wield the " + this._items[i]._name + ".");
            else if (this.isVisibleToPlayer())
                Game.UI.addMessage('The ' + this._name + " wields their " + this._items[i]._name + ".");
        }
    },

    isEquipped: function(i) {
        if (this._armor == i)
            return true;
        if (this._handOne == i)
            return true;
        return false;
    }
};

Game.EntityMixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
        this._attackValue = template['attackValue'] || 1;
        this._attackVerbs = template['attackVerbs'] || ['hits'];
    },
    getAttackValue: function() {
        var att = 0;
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            if (this.getWeapon()) {
                att = this.getWeapon().getAttackValue();
            }
        }
        return att + this._attackValue;
    },
    getAttackVerb: function() {
        return getRandomItem(this._attackVerbs);
    },
    attack: function(target) {
        if (target.hasMixin('Killable')) {
            var attVal = this.getAttackValue();
            var defVal = target.getDefenseValue();
            var max = Math.max(0, attVal - defVal);
            var damage = 1 + Math.floor(Math.random() * max);            

            if (this.hasMixin('PlayerActor')) {
                Game.UI.addMessage("You strike the " + target.getName()
                                   + " for " + damage + " damage!");
            } else if (target.hasMixin('PlayerActor')) {
                if (target.getDefenseValue() > 0)
                    Game.UI.addMessage("The " + this.getName() + " " + this.getAttackVerb()
                                   + " you but your magical ward protects you!");
                else
                    Game.UI.addMessage("The " + this.getName() + " " + this.getAttackVerb()
                                   + " you!");                    
            } else {
                // show player entities attacking each other if they are visible
                if (this.isVisibleToPlayer())
                    Game.UI.addMessage("The " + this.getName() + " " + this.getAttackVerb()
                                       + " the " + target.getName() + "!");
            }

            target.modifyHP(this, -damage);
        }
    }
};

Game.EntityMixins.Caster = {
    name: 'Caster',
    groupName: 'Caster',
    init: function(template) {
        this._radius = template['radius'] || 4;
        this._attackVerbs = template['attackVerbs'] || ['casts'];
        this._castCooldown = 0;
    },
    canCast: function() {
        if (this._castCooldown < 1)
            return true;
        else
            return false;
    },
    castSpell: function() {
        if (!this.canCast) return;
    },
    elapseCastCooldown: function() {
        if (this._castCooldown > 0) {
            this._castCooldown--;
        } else {
            this._castCooldown = 0;
        }        
    }
    // getAttackValue: function() {
    //     var att = 0;
    //     if (this.hasMixin(Game.EntityMixins.Equipper)) {
    //         if (this.getWeapon()) {
    //             att = this.getWeapon().getAttackValue();
    //         }
    //     }
    //     return att + this._attackValue;
    // },
    // getAttackVerb: function() {
    //     return getRandomItem(this._attackVerbs);
    // },
    // attack: function(target) {
    //     if (target.hasMixin('Killable')) {
    //         var attVal = this.getAttackValue();
    //         var defVal = target.getDefenseValue();
    //         var max = Math.max(0, attVal - defVal);
    //         var damage = 1 + Math.floor(Math.random() * max);            

    //         if (this.hasMixin('PlayerActor')) {
    //             Game.UI.addMessage("You strike the " + target.getName()
    //                                + " for " + damage + " damage!");
    //         } else if (target.hasMixin('PlayerActor')) {
    //             Game.UI.addMessage("The " + this.getName() + " " + this.getAttackVerb()
    //                                + " you for " + damage + " damage!");
    //         } else {
    //             // show player entities attacking each other if they are visible
    //             if (this.isVisibleToPlayer())
    //                 Game.UI.addMessage("The " + this.getName() + " " + this.getAttackVerb()
    //                                    + " the " + target.getName()
    //                                    + " for " + damage + " damage!");
    //         }

    //         target.modifyHP(this, -damage);
    //     }
    // }
};

Game.EntityMixins.Effectable = {
    name: 'Effectable',
    groupName: 'Effectable',
    init: function(template) {
        this._effects = [];
    },
    addEffect: function(type, value, duration) {
        this._effects.push({type: type,
                            value: value,
                            duration: duration});
        if (type === 'defense')
            this._defenseValue += value;
        else if (type === 'attack')
            this._attackValue += value;
    },
    removeEffect: function(effect, index) {
        this._effects.splice(index, 1);
        if (effect.type === 'defense')
            this._defenseValue -= effect.value;
        else if (effect.type === 'attack')
            this._attackValue -= effect.value;
    },
    elapseEffects: function() {
        // traverse array in reverse because splice re-indexes
        var i = this._effects.length;
        while (i--) {
            if (this._effects[i].duration <= 0) {
                this.removeEffect(this._effects[i], i);
            } else {
                this._effects[i].duration--;
            }
        }
    }
};

Game.EntityMixins.Banisher = {
    name: 'Banisher',
    groupName: 'Banisher',
    init: function(template) {
        this._banishCooldown = 0;
        this._banishesUsed = 0;
    },
    banish: function(entities) {
        if (entities.length < 1) {
            Game.UI.addMessage("There is nothing nearby to banish.");
            return false;
        }
        if (this._banishCooldown > 0) {
            Game.UI.addMessage("You cannot banish anything yet!");
            return false;
        }
        Game.UI.addMessage("You attempt to banish the beings around you...");
        for (var i=0; i<entities.length; i++) {
            entities[i].attemptRemoval(this);
        }
        this._banishesUsed++;        
        this.setBanishCooldown();
        return true;
    },
    setBanishCooldown: function() {
        // cooldown resets immediately if have star ruby
        // otherwise cooldown increases with the more banishes done
        if (this.hasItem('star ruby')) {
            this._banishCooldown = 0;
        } else {
            this._banishCooldown = 5 * this._banishesUsed;
        }
    },
    elapseBanishCooldown: function() {
        if (this._banishCooldown > 0) {
            this._banishCooldown--;
        } else {
            this._banishCooldown = 0;
        }
    }
};

// entities

Game.PlayerTemplate = {
    name: 'player',
    chr: '@',
    fg: '#ffa',
    sightRadius: 6,
    hp: 1,
    maxHP: 1,
    attackValue: 1,
    defenseValue: 1,
    mixins: [Game.EntityMixins.PlayerActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Equipper,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banisher,
             Game.EntityMixins.Attacker,
             Game.EntityMixins.Effectable,
             Game.EntityMixins.InventoryHolder]
};


Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('imp', {
    name: 'imp',
    chr: 'i',
    fg: '#b22222',
    sightRadius: 3,
    maxHP: 2,
    attackValue: 1,
    defenseValue: 1,
    attackVerbs: ['bites', 'claws'],
    tasks: ['wander'],
    foundIn: ['Cavern'],
    rating: 1,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,
             Game.EntityMixins.Attacker,
             Game.EntityMixins.CorpseDropper]
});
Game.EntityRepository.define('vrock', {
    name: 'vrock',
    chr: 'v',
    fg: '#ff8c00',
    sightRadius: 5,
    maxHP: 25,
    attackValue: 10,
    defenseValue: 10,
    attackVerbs: ['rips at', 'screeches at', 'pecks'],
    tasks: ['wander'],
    foundIn: ['Cavern'],
    rating: 2,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,
             Game.EntityMixins.Attacker,
             Game.EntityMixins.CorpseDropper]
});
Game.EntityRepository.define('hezrou', {
    name: 'hezrou',
    chr: 'h',
    fg: '#2f4f4f',
    sightRadius: 6,
    maxHP: 50,
    attackValue: 25,
    defenseValue: 25,
    attackVerbs: ['bites', 'claws'],
    tasks: ['hunt'],
    foundIn: ['Cavern'],
    rating: 3,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,
             Game.EntityMixins.Attacker,
             Game.EntityMixins.CorpseDropper]
});
Game.EntityRepository.define('marilith', {
    name: 'marilith',
    chr: 'm',
    fg: 'purple',
    sightRadius: 8,
    maxHP: 70,
    attackValue: 30,
    defenseValue: 30,
    attackVerbs: ['slices', 'tail whips'],
    tasks: ['hunt'],
    foundIn: ['Cavern'],
    rating: 4,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,
             Game.EntityMixins.Attacker,
             Game.EntityMixins.CorpseDropper]
});
Game.EntityRepository.define('archfiend', {
    name: 'archfiend',
    chr: 'A',
    fg: 'red',
    sightRadius: 10,
    maxHP: 200,
    attackValue: 100,
    defenseValue: 100,
    attackVerbs: ['befouls', 'engulfs', 'curses'],
    tasks: ['castAoE', 'hunt'],
    foundIn: ['Cavern'],
    rating: 5,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,
             Game.EntityMixins.Caster,
             Game.EntityMixins.Attacker]
});
Game.EntityRepository.define('archon', {
    name: 'archon',
    chr: 'A',
    fg: 'white',
    sightRadius: 10,
    maxHP: 200,
    attackValue: 100,
    defenseValue: 100,
    attackVerbs: ['judges', 'smites', 'sings'],
    tasks: ['castAoE', 'hunt'],
    foundIn: ['Cavern'],
    rating: 5,
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Sight,
             Game.EntityMixins.Killable,
             Game.EntityMixins.Banishable,             
             Game.EntityMixins.Caster,
             Game.EntityMixins.Attacker]
});
