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

Game.ItemMixins.Throwable = {
    name: 'Throwable',
    init: function(template) {
    }
};


// item repo & definitions

Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('book', {
    name: 'book',
    chr: '+',
    fg: 'brown',
    desc: 'A worn leather-bound tome with strange symbols on the cover.',
    foundIn: [],
    mixins: [Game.ItemMixins.Throwable]
});

Game.ItemRepository.define('defensepotion', {
    name: 'potion of defense',
    chr: '!',
    fg: 'blue',
    type: 'defense',
    duration: 10,
    value: 4,
    desc: 'A potion that will temporarily bolster your defense.',
    foundIn: ['Cavern'],
    mixins: [Game.ItemMixins.Drinkable]
});

Game.ItemRepository.define('corpse', {
    name: 'corpse',
    chr: '%'
}, { disableRandomCreation: true });

Game.ItemRepository.define('starruby', {
    name: 'star ruby',
    chr: '*',
    fg: 'rgb(230,30,30)',
    desc: 'A ruby cut into the form of a star. It radiates heat.'
}, { disableRandomCreation : true });
