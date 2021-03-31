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
var cmp = require('../util/cmp');
var common = require('./common');
var Level = require('./Level');
var type = require('../util/type');


/**
 * @class EquirectTile
 * @implements Tile
 * @classdesc
 *
 * A tile in an @{EquirectGeometry}.
 */
function EquirectTile(z, geometry) {
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}


EquirectTile.prototype.rotX = function() {
  return 0;
};


EquirectTile.prototype.rotY = function() {
  return 0;
};


EquirectTile.prototype.centerX = function() {
  return 0.5;
};


EquirectTile.prototype.centerY = function() {
  return 0.5;
};


EquirectTile.prototype.scaleX = function() {
  return 1;
};


EquirectTile.prototype.scaleY = function() {
  return 1;
};


EquirectTile.prototype.parent = function() {
  if (this.z === 0) {
    return null;
  }
  return new EquirectTile(this.z - 1, this._geometry);
};


EquirectTile.prototype.children = function(result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }
  result = result || [];
  result.push(new EquirectTile(this.z + 1, this._geometry));
  return result;
};


EquirectTile.prototype.neighbors = function() {
  return [];
};


EquirectTile.prototype.hash = function() {
  return hash(this.z);
};


EquirectTile.prototype.equals = function(that) {
  return this._geometry === that._geometry && this.z === that.z;
};


EquirectTile.prototype.cmp = function(that) {
  return cmp(this.z, that.z);
};


EquirectTile.prototype.str = function() {
  return 'EquirectTile(' + tile.z + ')';
};


function EquirectLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);
  this._width = levelProperties.width;
}

inherits(EquirectLevel, Level);


EquirectLevel.prototype.width = function() {
  return this._width;
};


EquirectLevel.prototype.height = function() {
  return this._width/2;
};


EquirectLevel.prototype.tileWidth = function() {
  return this._width;
};


EquirectLevel.prototype.tileHeight = function() {
  return this._width/2;
};


/**
 * @class EquirectGeometry
 * @implements Geometry
 * @classdesc
 *
 * A {@link Geometry} implementation suitable for equirectangular images with a
 * 2:1 aspect ratio.
 *
 * @param {Object[]} levelPropertiesList Level description
 * @param {number} levelPropertiesList[].width Level width in pixels
*/
function EquirectGeometry(levelPropertiesList) {
  if (type(levelPropertiesList) !== 'array') {
    throw new Error('Level list must be an array');
  }

  this.levelList = common.makeLevelList(levelPropertiesList, EquirectLevel);
  this.selectableLevelList = common.makeSelectableLevelList(this.levelList);
}


EquirectGeometry.prototype.maxTileSize = function() {
  var maxTileSize = 0;
  for (var i = 0; i < this.levelList.length; i++) {
    var level = this.levelList[i];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};


EquirectGeometry.prototype.levelTiles = function(level, result) {
  var levelIndex = this.levelList.indexOf(level);
  result = result || [];
  result.push(new EquirectTile(levelIndex, this));
  return result;
};


EquirectGeometry.prototype.visibleTiles = function(view, level, result) {
  var tile = new EquirectTile(this.levelList.indexOf(level), this);
  result = result || [];
  result.length = 0;
  result.push(tile);
};


EquirectGeometry.Tile = EquirectGeometry.prototype.Tile = EquirectTile;
EquirectGeometry.type = EquirectGeometry.prototype.type = 'equirect';
EquirectTile.type = EquirectTile.prototype.type = 'equirect';


module.exports = EquirectGeometry;
