Game.World = function() {

    this._name = 'Banisher World';
    this._zones = [];
    
};

Game.World.prototype._init = function(player) {
    var zone = new Game.Zone.Cavern(this._getNewTiles(), -1, 1);
    this._zones.push(zone);
    zone._id = 0;

    // start on the stairs back up
    var upPos = zone.getConnectionForZone(-1);
    Game.player._x = Number(upPos.split(',')[0]);
    Game.player._y = Number(upPos.split(',')[1]);     
    zone.addEntity(Game.player);

};

Game.World.prototype._getNewTiles = function() {
    // initialize nested array
    var tiles = [];
    for (var x=0; x < Game.mapWidth; x++) {
        tiles[x] = [];
        for (var y=0; y < Game.mapHeight; y++) {
            tiles[x][y] = Game.Tile.nullTile;
        }
    }
    return tiles;
};

Game.World.prototype.generateNewZone = function(name, fromZoneID) {

    if (!Game.Zone[name]) {
        console.log("No such zone type: " + name);
        return undefined;
    }

    // check if we are going deeper into same zone
    var newZoneDepth = 1;
    if (name === this._zones[fromZoneID]._name) {
        newZoneDepth = this._zones[fromZoneID]._depth + 1;
    }

    var newZone = new Game.Zone[name](this._getNewTiles(), fromZoneID, newZoneDepth);
    var newID = this._zones.push(newZone) - 1;
    newZone._id = newID;
//    newZone.addConnection(x, y, Game.Tile.stairUp, fromZoneID);
    return newID;
};


Game.World.prototype.exportToString = function() {
    function replacer(key, value) {
        if (key === '_zone' || key === '_listeners') {
            return undefined;
        }
        return value;
    };

    return JSON.stringify(this, replacer);
};
