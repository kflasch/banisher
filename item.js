Game.Item = function(properties) {
    properties = properties || {};
    
    Game.DynamicGlyph.call(this, properties);
    this._templateName = properties['templateName'] || '';
    this._passable = properties['passable'] || true;
    this._name = properties['name'] || '';
    this._desc = properties['desc'] || '';
    this._foundIn = properties['foundIn'] || [];

    this._x = null;
    this._y = null;
};
extendObj(Game.Item, Game.DynamicGlyph);

Game.Item.prototype.getName = function() {
    return this._name;
};

// item mixins

Game.ItemMixins = {};

Game.ItemMixins.Edible = {
    name: 'Edible',
    init: function(template) {
        this.foodVal = template['foodVal'] || 0;
        this.hpVal = template['hpVal'] || 0;
    },
    eat: function(entity, invIndex) {
        if (entity.hasMixin('Killable')) {
            entity.modifyHP(this, this.hpVal);
        }
        entity.removeItem(invIndex);
    }
};

Game.ItemMixins.Drinkable = {
    name: 'Drinkable',
    init: function(template) {
        this.type = template['type'] || 0;
        this.value = template['value'] || 1;
        this.duration = template['duration'] || 10;
    },
    drink: function(entity, invIndex) {
        if (entity.hasMixin('Effectable')) {
            entity.addEffect(this.type, this.value, this.duration);
        }
        if (entity.hasMixin('PlayerActor'))
            Game.UI.addMessage("You drink the  " + this._name + ".");
        entity.removeItem(invIndex);
    }
};

Game.ItemMixins.Readable = {
    name: 'Readable',
    init: function(template) {
        this.type = template['type'] || 0;
        this.value = template['value'] || 1;
    },
    read: function(entity, invIndex) {
        if (this.type === 'warding') {
            if (entity.hasMixin('Killable')) {
                if (ROT.RNG.getUniform() > 0.8) this.value++;
                entity._defenseValue += this.value;
            }
        } else if (this.type === 'rewriting') {
            
        }
        
        if (entity.hasMixin('PlayerActor'))
            Game.UI.addMessage("As you recite the words from the " + this._name +
                               ", it crumbles to dust.");
        entity.removeItem(invIndex);
    }
};

Game.ItemMixins.Equippable = {
    name: 'Equippable',
    init: function(template) {
        this._attackVal = template['attackVal'] || 0;
        this._defenseVal = template['defenseVal'] || 0;
        this._wieldable = template['wieldable'] || false;
        this._wearable = template['wearable'] || false;        
    },
    getAttackValue: function() {
        return this._attackVal;
    },
    getDefenseValue: function() {
        return this._defenseVal;
    }
};

// item repo & definitions

Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('bookofwarding', {
    name: 'book of warding',
    chr: '+',
    fg: 'teal',
    type: 'warding',
    value: 1,
    desc: 'A worn leather-bound tome with strange symbols on the cover. It contains incantations to used to protect oneself.',
    foundIn: ['Cavern'],
    mixins: [Game.ItemMixins.Readable]
});

// Game.ItemRepository.define('bookofrewriting', {
//     name: 'book of rewriting',
//     chr: '+',
//     fg: 'green',
//     type: 'rewriting',
//     value: 1,
//     desc: 'A glowing green book with a metal latch. It describes a ritual to alter your surroundings.',
//     foundIn: ['Cavern'],
//     mixins: [Game.ItemMixins.Readable]
// });

Game.ItemRepository.define('refreshpotion', {
    name: 'potion of refreshment',
    chr: '!',
    fg: 'blue',
    type: 'refresh',
    duration: -1,
    value: 1,
    desc: 'A potion that will refresh you, setting your cooldown back to 0.',
    foundIn: ['Cavern'],
    mixins: [Game.ItemMixins.Drinkable]
});

Game.ItemRepository.define('farsightpotion', {
    name: 'potion of farsight',
    chr: '!',
    fg: 'yellow',
    type: 'farsight',
    duration: 30,
    value: 10,
    desc: 'A potion that will imbue you with increased sight.',
    foundIn: ['Cavern'],
    mixins: [Game.ItemMixins.Drinkable]
});

Game.ItemRepository.define('corpse', {
    name: 'corpse',
    chr: '%'
}, { disableRandomCreation: true });

Game.ItemRepository.define('star ruby', {
    name: 'star ruby',
    chr: '*',
    fg: 'rgb(230,30,30)',
    desc: 'A ruby cut into the form of a star. It radiates heat.'
}, { disableRandomCreation : true });
