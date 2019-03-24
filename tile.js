Game.Tile = function(properties) {
    properties = properties || {};

    Game.Glyph.call(this, properties);
    
    this._passable = properties['passable'] || false;
    this._blocksLight = (properties['blocksLight'] !== undefined) ?
        properties['blocksLight'] : true;
    this._desc = properties['desc'] || '';
};

extendObj(Game.Tile, Game.Glyph);

Game.Tile.nullTile = new Game.Tile({
});
Game.Tile.caveFloor = new Game.Tile({
    chr: '.',
    fg: 'rgb(139,69,19)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([139,69,19], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'cavern floor'
});
Game.Tile.caveFloorAlt = new Game.Tile({
    chr: '.',
    fg: 'rgb(170,111,31)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([139,69,19], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'cavern floor'
});
Game.Tile.caveWall = new Game.Tile({
    chr: '#',
    fg: 'rgb(120,90,20)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([184,134,11], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a cavern wall'
});
Game.Tile.caveWallAlt = new Game.Tile({
    chr: '#',
    fg: 'rgb(164,104,11)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([184,134,11], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a cavern wall'
});
Game.Tile.caveWallDark = new Game.Tile({
    chr: '#',
    fg: 'rgb(100,51,22)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([184,134,11], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a cavern wall'
});
Game.Tile.shrineFloor = new Game.Tile({
    chr: '.',
    fg: 'rgb(90,90,90)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([90,90,90], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'stone floor'
});
Game.Tile.shrineFloorAlt = new Game.Tile({
    chr: '.',
    fg: 'rgb(90,90,100)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([90,90,90], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'stone floor'
});
Game.Tile.shrineWall = new Game.Tile({
    chr: '#',
    fg: 'rgb(96,96,96)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([96,96,96], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a stone wall'
});
Game.Tile.shrineWallAlt = new Game.Tile({
    chr: '#',
    fg: 'rgb(96,96,116)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([96,96,96], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a stone wall'
});
Game.Tile.shrineWallBright = new Game.Tile({
    chr: '#',
    fg: 'rgb(96,120,196)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([96,96,96], [95, 95, 95])),
    passable: false,
    blocksLight: true,
    desc: 'a stone wall'
});
Game.Tile.burntFloor = new Game.Tile({
    chr: '.',
    fg: 'rgb(180,20,20)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([200,20,20], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'burnt floor'
});
Game.Tile.stairDown = new Game.Tile({
    chr: '>',
    fg: 'rgb(180,180,180)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([180,180,180], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'descending stairs'
});
Game.Tile.stairUp = new Game.Tile({
    chr: '<',
    fg: 'rgb(180,180,180)',
    dfg: ROT.Color.toHex(ROT.Color.multiply([180,180,180], [95, 95, 95])),
    passable: true,
    blocksLight: false,
    desc: 'ascending stairs'
});
