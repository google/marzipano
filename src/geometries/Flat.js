/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var inherits = require('../util/inherits');
var hash = require('../util/hash');
var TileSearcher = require('../TileSearcher');
var LruMap = require('../collections/LruMap');
var Level = require('./Level');
var makeLevelList = require('./common').makeLevelList;
var makeSelectableLevelList = require('./common').makeSelectableLevelList;
var clamp = require('../util/clamp');
var mod = require('../util/mod');
var cmp = require('../util/cmp');
var type = require('../util/type');
var vec2 = require('gl-matrix').vec2;
var vec4 = require('gl-matrix').vec4;

// Some renderer implementations require tiles to be padded around with
// repeated pixels to prevent the appearance of visible seams between tiles.
//
// In order to prevent the padding from being visible, the tiles must be
// padded and stacked such that the padding on one of the sides, when present,
// stacks below the neighboring tile on that side.
//
// Padding rules:
// * Pad tiles on the right and on the bottom.
//
// Stacking rules:
// * Within an image, stack smaller zoom levels below larger zoom levels.
// * Within a level, stack tiles bottom to top in ascending Y coordinate order.
// * Within a row, stack tiles bottom to top in ascending X coordinate order.

// Offsets to apply to the (x,y) coordinates of a tile to get its neighbors.
var neighborOffsets = [
  [  0,  1 ], // top
  [  1,  0 ], // right
  [  0, -1 ], // bottom
  [ -1,  0 ]  // left
];


/**
 * @class FlatTile
 * @implements Tile
 * @classdesc
 *
 * A tile in a {@link FlatGeometry}.
 */
function FlatTile(x, y, z, geometry) {
  this.x = x;
  this.y = y;
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}


FlatTile.prototype.rotX = function() {
  return 0;
};


FlatTile.prototype.rotY = function() {
  return 0;
};


FlatTile.prototype.centerX = function() {
  var levelWidth = this._level.width();
  var tileWidth = this._level.tileWidth();
  return (this.x * tileWidth + 0.5 * this.width()) / levelWidth - 0.5;
};


FlatTile.prototype.centerY = function() {
  var levelHeight = this._level.height();
  var tileHeight = this._level.tileHeight();
  return 0.5 - (this.y * tileHeight + 0.5 * this.height()) / levelHeight;
};


FlatTile.prototype.scaleX = function() {
  var levelWidth = this._level.width();
  return this.width() / levelWidth;
};


FlatTile.prototype.scaleY = function() {
  var levelHeight = this._level.height();
  return this.height() / levelHeight;
};


FlatTile.prototype.width = function() {
  var levelWidth = this._level.width();
  var tileWidth = this._level.tileWidth();
  if (this.atRightEdge()) {
    var widthRemainder = mod(levelWidth, tileWidth);
    return widthRemainder || tileWidth;
  } else {
    return tileWidth;
  }
};


FlatTile.prototype.height = function() {
  var levelHeight = this._level.height();
  var tileHeight = this._level.tileHeight();
  if (this.atBottomEdge()) {
    var heightRemainder = mod(levelHeight, tileHeight);
    return heightRemainder || tileHeight;
  } else {
    return tileHeight;
  }
};


FlatTile.prototype.levelWidth = function() {
  return this._level.width();
};


FlatTile.prototype.levelHeight = function() {
  return this._level.height();
};


FlatTile.prototype.atTopLevel = function() {
  return this.z === 0;
};


FlatTile.prototype.atBottomLevel = function() {
  return this.z === this._geometry.levelList.length - 1;
};


FlatTile.prototype.atTopEdge = function() {
  return this.y === 0;
};


FlatTile.prototype.atBottomEdge = function() {
  return this.y === this._level.numVerticalTiles() - 1;
};


FlatTile.prototype.atLeftEdge = function() {
  return this.x === 0;
};


FlatTile.prototype.atRightEdge = function() {
  return this.x === this._level.numHorizontalTiles() - 1;
};


FlatTile.prototype.padTop = function() {
  return false;
};


FlatTile.prototype.padBottom = function() {
  return !this.atBottomEdge();
};


FlatTile.prototype.padLeft = function() {
  return false;
};


FlatTile.prototype.padRight = function() {
  return !this.atRightEdge();
};


FlatTile.prototype.vertices = function(result) {
  if (!result) {
    result = [vec2.create(), vec2.create(), vec2.create(), vec2.create()];
  }

  var left = this.centerX() - this.scaleX() / 2;
  var right = this.centerX() + this.scaleX() / 2;
  var bottom = this.centerY() - this.scaleY() / 2;
  var top = this.centerY() + this.scaleY() / 2;

  vec2.set(result[0], left, top);
  vec2.set(result[1], right, top);
  vec2.set(result[2], right, bottom);
  vec2.set(result[3], left, bottom);

  return result;
};


FlatTile.prototype.parent = function() {


  if (this.atTopLevel()) {
    return null;
  }

  var geometry = this._geometry;

  var z = this.z - 1;
  // TODO: Currently assuming each level is double the size of previous one.
  // Fix to support other multiples.
  var x = Math.floor(this.x / 2);
  var y = Math.floor(this.y / 2);

  return new FlatTile(x, y, z, geometry);

};


FlatTile.prototype.children = function(result) {
  if (this.atBottomLevel()) {
    return null;
  }

  var geometry = this._geometry;
  var z = this.z + 1;

  result = result || [];

  // TODO: Currently assuming each level is double the size of previous one.
  // Fix to support other multiples.
  result.push(new FlatTile(2*this.x  , 2*this.y  , z, geometry));
  result.push(new FlatTile(2*this.x  , 2*this.y+1, z, geometry));
  result.push(new FlatTile(2*this.x+1, 2*this.y  , z, geometry));
  result.push(new FlatTile(2*this.x+1, 2*this.y+1, z, geometry));

  return result;

};


FlatTile.prototype.neighbors = function() {

  var geometry = this._geometry;
  var cache = geometry._neighborsCache;

  // Satisfy from cache when available.
  var cachedResult = cache.get(this);
  if (cachedResult) {
    return cachedResult;
  }

  var x = this.x;
  var y = this.y;
  var z = this.z;
  var level = this._level;

  var numX = level.numHorizontalTiles() - 1;
  var numY = level.numVerticalTiles() - 1;

  var result = [];

  for (var i = 0; i < neighborOffsets.length; i++) {
    var xOffset = neighborOffsets[i][0];
    var yOffset = neighborOffsets[i][1];

    var newX = x + xOffset;
    var newY = y + yOffset;
    var newZ = z;

    if (0 <= newX && newX <= numX && 0 <= newY && newY <= numY) {
      result.push(new FlatTile(newX, newY, newZ, geometry));
    }
  }

  // Store into cache to satisfy future requests.
  cache.set(this, result);

  return result;

};


FlatTile.prototype.hash = function() {
  return FlatTile.hash(this);
};


FlatTile.prototype.equals = function(other) {
  return FlatTile.equals(this, other);
};


FlatTile.prototype.cmp = function(other) {
  return FlatTile.cmp(this, other);
};


FlatTile.prototype.str = function() {
  return FlatTile.str(this);
};


FlatTile.hash = function(tile) {
  return tile != null ? hash(tile.z, tile.x, tile.y) : 0;
};


FlatTile.equals = function(tile1, tile2) {
  return (tile1 != null && tile2 != null &&
          tile1.z === tile2.z &&
          tile1.x === tile2.x &&
          tile1.y === tile2.y);
};


FlatTile.cmp = function(tile1, tile2) {
  return (cmp(tile1.z, tile2.z) ||
          cmp(tile1.y, tile2.y) ||
          cmp(tile1.x, tile2.x));
};


FlatTile.str = function(tile) {
  return 'FlatTile(' + tile.x + ', ' + tile.y + ', ' + tile.z + ')';
};


function FlatLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);

  this._width = levelProperties.width;
  this._height = levelProperties.height;
  this._tileWidth = levelProperties.tileWidth;
  this._tileHeight = levelProperties.tileHeight;
}

inherits(FlatLevel, Level);


FlatLevel.prototype.width = function() {
  return this._width;
};


FlatLevel.prototype.height = function() {
  return this._height;
};


FlatLevel.prototype.tileWidth = function() {
  return this._tileWidth;
};


FlatLevel.prototype.tileHeight = function() {
  return this._tileHeight;
};


FlatLevel.prototype._validateWithParentLevel = function(parentLevel) {

  var width = this.width();
  var height = this.height();
  var tileWidth = this.tileWidth();
  var tileHeight = this.tileHeight();

  var parentWidth = parentLevel.width();
  var parentHeight = parentLevel.height();
  var parentTileWidth = parentLevel.tileWidth();
  var parentTileHeight = parentLevel.tileHeight();

  if (width % parentWidth !== 0) {
    return new Error('Level width must be multiple of parent level: ' +
                     width + ' vs. ' + parentWidth);
  }

  if (height % parentHeight !== 0) {
    return new Error('Level height must be multiple of parent level: ' +
                     height + ' vs. ' + parentHeight);
  }

  if (tileWidth % parentTileWidth !== 0) {
    return new Error('Level tile width must be multiple of parent level: ' +
                     tileWidth + ' vs. ' + parentTileWidth);
  }

  if (tileHeight % parentTileHeight !== 0) {
    return new Error('Level tile height must be multiple of parent level: ' +
                     tileHeight + ' vs. ' + parentTileHeight);
  }

};


/**
 * @class FlatGeometry
 * @implements Geometry
 * @classdesc
 *
 * A {@link Geometry} implementation suitable for tiled flat images with
 * multiple resolution levels.
 *
 * The following restrictions apply:
 *   - All tiles must be square, except when in the last row or column position,
 *     and must form a rectangular grid;
 *   - The width and height of a level must be multiples of the parent level
 *     width and height.
 *
 * @param {Object[]} levelPropertiesList Level description
 * @param {number} levelPropertiesList[].width Level width in pixels
 * @param {number} levelPropertiesList[].tileWidth Tile width in pixels for
 *                 square tiles
 * @param {number} levelPropertiesList[].height Level height in pixels
 * @param {number} levelPropertiesList[].tileHeight Tile height in pixels for
 *                 square tiles
 */
function FlatGeometry(levelPropertiesList) {
  if (type(levelPropertiesList) !== 'array') {
    throw new Error('Level list must be an array');
  }

  this.levelList = makeLevelList(levelPropertiesList, FlatLevel);
  this.selectableLevelList = makeSelectableLevelList(this.levelList);

  for (var i = 1; i < this.levelList.length; i++) {
    this.levelList[i]._validateWithParentLevel(this.levelList[i-1]);
  }

  this._tileSearcher = new TileSearcher(this);

  this._neighborsCache = new LruMap(FlatTile.equals, FlatTile.hash, 64);

  this._vec = vec4.create();

  this._viewSize = {};
}


FlatGeometry.prototype.maxTileSize = function() {
  var maxTileSize = 0;
  for (var i = 0; i < this.levelList.length; i++) {
    var level = this.levelList[i];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};


FlatGeometry.prototype.levelTiles = function(level, result) {

  var levelIndex = this.levelList.indexOf(level);
  var maxX = level.numHorizontalTiles() - 1;
  var maxY = level.numVerticalTiles() - 1;

  if (!result) {
    result = [];
  }

  for (var x = 0; x <= maxX; x++) {
    for (var y = 0; y <= maxY; y++) {
      result.push(new FlatTile(x, y, levelIndex, this));
    }
  }

  return result;

};


FlatGeometry.prototype._closestTile = function(view, level) {
  var ray = this._vec;

  // Compute a view ray into the central screen point.
  vec4.set(ray, 0, 0, 1, 1);
  vec4.transformMat4(ray, ray, view.inverseProjection());

  // Compute the image coordinates that the view ray points into.
  var x = 0.5 + ray[0];
  var y = 0.5 - ray[1];

  // Get the desired zoom level.
  var tileZ = this.levelList.indexOf(level);
  var levelWidth = level.width();
  var levelHeight = level.height();
  var tileWidth = level.tileWidth();
  var tileHeight = level.tileHeight();
  var numX = level.numHorizontalTiles();
  var numY = level.numVerticalTiles();

  // Find the coordinates of the tile that the view ray points into.
  var tileX = clamp(Math.floor(x * levelWidth / tileWidth), 0, numX - 1);
  var tileY = clamp(Math.floor(y * levelHeight / tileHeight), 0, numY - 1);

  return new FlatTile(tileX, tileY, tileZ, this);
};


FlatGeometry.prototype.visibleTiles = function(view, level, result) {
  var viewSize = this._viewSize;
  var tileSearcher = this._tileSearcher;

  result = result || [];

  view.size(viewSize);
  if (viewSize.width === 0 || viewSize.height === 0) {
    // No tiles are visible if the viewport is empty.
    return result;
  }

  var startingTile = this._closestTile(view, level);
  var count = tileSearcher.search(view, startingTile, result);
  if (!count) {
    throw new Error('Starting tile is not visible');
  }

  return result;
};


FlatGeometry.TileClass = FlatGeometry.prototype.TileClass = FlatTile;
FlatGeometry.type = FlatGeometry.prototype.type = 'flat';
FlatTile.type = FlatTile.prototype.type = 'flat';


module.exports = FlatGeometry;
