Game.Zone = function Zone(tiles) {

    this._name = "";
    this._id = undefined;
    
    this._tiles = tiles;

    this._width =  tiles.length || Game.mapWidth;
    this._height = tiles[0].length || Game.mapHeight;
    this._depth = 1;
    this._isMultiLevel = false;

    this._fov = this._setupFOV();

    // map of 'x,y' to items, entities, zone connections
    this._items = {};
    this._entities = {};
    this._connections = {};
    
    this._explored = this._setupExplored();

};

Game.Zone.prototype.getTile = function(x, y) {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[x][y] || Game.Tile.nullTile;
    }
};

Game.Zone.prototype.setTile = function(x, y, tile) {
    if (x >= 0 && x < this._width && y >= 0 && y < this._height) {
        this._tiles[x][y] = tile;
    }
};

Game.Zone.prototype.changeTiles = function(fromTile, toTile) {
    for (var x=0; x < this._width; x++) {
        for (var y=0; y < this._height; y++) {
            if (this.getTile(x, y)._desc === fromTile._desc) {
                this.setTile(x, y, toTile);
            }
        }
    }
};

Game.Zone.prototype._setupFOV = function() {
    var thisZone = this;
    return new ROT.FOV.PreciseShadowcasting(function(x, y) {
        return !thisZone.getTile(x, y)._blocksLight;
    }, {topology: 8});
};

Game.Zone.prototype._setupExplored = function() {
    var arr = [];
    for (var x=0; x < this._width; x++) {
        arr[x] = [];
        for (var y=0; y < this._height; y++) {
            arr[x][y] = false;
        }
    }
    return arr;
};

Game.Zone.prototype.setExplored = function(x, y, state) {
    if (this.getTile(x, y) !== Game.Tile.nullTile) {
        this._explored[x][y] = state;
    }
};

Game.Zone.prototype.isExplored = function(x, y) {
    if (this.getTile(x, y) !== Game.Tile.nullTile) {
        return this._explored[x][y];
    } else {
        return false;
    }
};

Game.Zone.prototype.getItemsAt = function(x, y) {
    return this._items[x + ',' + y];
};

Game.Zone.prototype.setItemsAt = function(x, y, items) {
    var key = x + ',' + y;
    if (items.length === 0) {
        // if no items, clear out this key if it exists
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        this._items[key] = items;
    }
};

// can be called as f(key, item) or f(x, y, item)
Game.Zone.prototype.addItem = function(x, y, item) {

    var key;
    if (arguments.length === 2) {
        key = x;
        item = y;
    } else {
        key = x + ',' + y;
    }
         
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Zone.prototype.addItemAtRandomPosition = function(item) {
    var pos = this.getEmptyRandomPosition();
    this.addItem(pos.x, pos.y, item);
};

Game.Zone.prototype.getEmptyRandomPosition = function() {
    var x, y;
    do {
        x = Math.floor(ROT.RNG.getUniform() * this._width);
        y = Math.floor(ROT.RNG.getUniform() * this._height);
    } while (!this.isPlaceable(x,y));
    return {x: x, y: y};
};

Game.Zone.prototype.getEmptyRandomPositionNear = function(nx, ny, dist) {
    var x, y;
    var maxx = nx + dist, maxy = ny + dist;
    var minx = nx - dist, miny = ny - dist;
    var maxCheck = Math.pow((dist + dist + 1), 2), check = 0;
    do {
        //x = Math.floor(ROT.RNG.getUniform() * (maxx - minx + 1)) + min;
        x = ROT.RNG.getUniformInt(minx, maxx);
        y = ROT.RNG.getUniformInt(miny, maxy);
        check++;
    } while (!this.isPlaceable(x, y) && check<=maxCheck);
    if (check >= maxCheck) return null;
    return {x: x, y: y};
};

// true if given pos is passable, has no entities and not certain tiles
Game.Zone.prototype.isPlaceable = function(x, y) {
    var tile = this.getTile(x, y);
    return tile._passable &&
        tile !== Game.Tile.stairUp &&
        tile !== Game.Tile.stairDown &&
        !this.getEntityAt(x, y);
};

Game.Zone.prototype.getEntityAt = function(x, y) {
    return this._entities[x + ',' + y];
};

Game.Zone.prototype.addEntityAtRandomPosition = function(entity) {
    var pos = this.getEmptyRandomPosition();
    entity._x = pos.x;
    entity._y = pos.y;
    this.addEntity(entity);
};

Game.Zone.prototype.addEntity = function(entity) {
    entity._zone = this;

    this.updateEntityPosition(entity);

    if (entity.hasMixin('TaskActor')) {
        Game.scheduler.add(entity, true);
    }

    var isPlayer = entity.hasMixin(Game.EntityMixins.PlayerActor);
    // very sloppy non-player equipping. goes through all their items
    // and equips them if they are equippable, overriding previous
    if (!isPlayer && entity._items) {
        for (var i=0; i<entity._items.length; i++) {
            if (entity._items[i] && entity._items[i].hasMixin('Equippable'))
                entity.equip(i);
        }
    }
};

Game.Zone.prototype.removeEntity = function(entity) {
    var key = entity._x + ',' + entity._y;
    if (this._entities[key] == entity)
        delete this._entities[key];

    if (entity.hasMixin('Actor'))
        Game.scheduler.remove(entity);

    //if (entity.hasMixin('PlayerActor')) {
    //    Game.player = undefined;
    //}

};

Game.Zone.prototype.updateEntityPosition = function(entity, oldX, oldY) {

    // if coords passed in, delete old key 
    if (typeof oldX === 'number') {
        var oldKey = oldX + ',' + oldY;
        if (this._entities[oldKey] == entity) {
            delete this._entities[oldKey];
        }
    }
    
    if (entity._x < 0 || entity._x >= this._width ||
        entity._y < 0 || entity._y >= this._height) {
        throw new Error("Entity's position is out of bounds.");
    }

    var key = entity._x + ',' + entity._y;
    if (this._entities[key]) {
        throw new Error('Tried to add entity to location with another entity.');
    }

    this._entities[key] = entity;
};

Game.Zone.prototype.addConnection = function(x, y, tile, zoneID) {
    this._tiles[x][y] = tile;
    var key = x + ',' + y;
    if (this._connections[key]) {
        throw new Error('Tried to add connection to location with another connnection at ' + key);
    }
    this._connections[key] = zoneID;
};

Game.Zone.prototype.getConnectionForZone = function(zoneID) {
    for (var key in this._connections) {
        if (this._connections[key] == zoneID)
            return key;
    }
    return undefined;
};

Game.Zone.prototype.exportToString = function() {
    function replacer(key, value) {
        if (key === '_zone' || key === '_listeners') {
            return undefined;
        }
        return value;
    };

    return JSON.stringify(this, replacer);
};


Game.Zone.Cavern = function Cavern(tiles, fromZoneID, depth) {
    Game.Zone.call(this, tiles);

    this._name = "Cavern";
    this._isMultiLevel = true;
    this._depth = depth;

    var map = new ROT.Map.Cellular(this._width, this._height, {
        connected: true
    });
    map.randomize(0.5);
    map.create(); map.create(); map.create();
    map.connect(function(x, y, value) {
        if (value === 1) {
            this._tiles[x][y] = Game.Tile.caveWall;
        } else {
            this._tiles[x][y] = Game.Tile.caveFloor;
        }
    }.bind(this));

    var pos = this.getEmptyRandomPosition();
    this._tiles[pos.x][pos.y] = Game.Tile.stairUp;
    this._connections[pos.x+','+pos.y] = fromZoneID;
    
    pos = this.getEmptyRandomPosition();
    this._tiles[pos.x][pos.y] = Game.Tile.stairDown;
    this._connections[pos.x+','+pos.y] = 'Cavern';
};

extendObj(Game.Zone.Cavern, Game.Zone);

Game.Zone.Shrine = function Cavern(tiles, player) {
    Game.Zone.call(this, tiles);

    this._name = "Shrine";

    var map = new ROT.Map.Cellular(this._width, this._height, {
        born: [5],
        survive: [1, 2, 3]});
    map.randomize(0.5);
    map.create(); map.create();
    map.create(function(x, y, value) {
        if (value === 1) {
            this._tiles[x][y] = Game.Tile.caveWall;
        } else {
            this._tiles[x][y] = Game.Tile.caveFloor;
        }
    }.bind(this));
};
extendObj(Game.Zone.Shrine, Game.Zone);
