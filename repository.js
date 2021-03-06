Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._randomTemplates = {};
    this._zoneRandomTemplates = {};
    this._ratingTemplates = {};
};

Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;

    // Apply any options
    var disableRandomCreation = options && options['disableRandomCreation'];
    if (!disableRandomCreation) {
        this._randomTemplates[name] = template;
        if (template.foundIn !== undefined && template.foundIn.length > 0) {
            for (var i=0; i<template.foundIn.length; i++) {
                var itemNames = this._zoneRandomTemplates[template.foundIn[i]];
                if (itemNames == undefined) itemNames = [];
                itemNames.push(name);
                this._zoneRandomTemplates[template.foundIn[i]] = itemNames;
            }
        }
        if (template.rating !== undefined) {
            var thingNames = this._ratingTemplates[template.rating];
            if (thingNames == undefined) thingNames = [];
            thingNames.push(name);
            this._ratingTemplates[template.rating] = thingNames;
        }
    }
};

// Create an object based on a template.
Game.Repository.prototype.create = function(name, extraProperties) {
    if (!this._templates[name]) {
        throw new Error("No template named '" + name + "' in repository '" +
            this._name + "'");
    }
    this._templates[name]['templateName'] = name;
    // Copy the template
    var template = Object.create(this._templates[name]);
    // Apply any extra properties
    if (extraProperties) {
        for (var key in extraProperties) {
            template[key] = extraProperties[key];
        }
    }

    // Create the object, passing the template as an argument
    return new this._ctor(template);
};

// Create an object based on a random template, optionally only from zone
Game.Repository.prototype.createRandom = function(rating) {
    // Pick a random key and create an object based off of it.
    if (rating !== undefined) {
	return this.create(ROT.RNG.getItem(this._ratingTemplates[rating]));
    } else {
	return this.create(ROT.RNG.getItem(Object.keys(this._randomTemplates)));
    }
};

Game.Repository.prototype.getTemplate = function(name) {
    return this._templates[name];
};
