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

var Map = require('../collections/Map');
var clearOwnProperties = require('../util/clearOwnProperties');


function tileCmp(a, b) {
  return a.cmp(b);
}


function FlashBaseRenderer(flashElement, layerId, quirks, tileClass) {

  this._flashElement = flashElement;
  this._layerId = layerId;
  this._quirks = quirks;

  this._tileList = [];

  this._textureMap = new Map();

  // Whether the Flash layer for this renderer has already been created
  // by calling flashElement.createLayer(). Note that we cannot do this
  // right here because Flash may not be initialized yet.
  this._layerCreated = false;
}


FlashBaseRenderer.prototype.destroy = function() {
  if (this._layerCreated) {
    this._flashElement.destroyLayer(this._layerId);
  }
  clearOwnProperties(this);
};


FlashBaseRenderer.prototype.startLayer = function(layer, rect) {
  if (!this._flashElement.isReady || !this._flashElement.isReady()) {
    return;
  }
  if (!this._layerCreated) {
    this._flashElement.createLayer(this._layerId);
    this._layerCreated = true;
  }
  this._tileList.length = 0;
  this._textureMap.clear();
};


FlashBaseRenderer.prototype.renderTile = function(tile, texture) {
  this._tileList.push(tile);
  this._textureMap.set(tile, texture);
};


FlashBaseRenderer.prototype.endLayer = function(layer, rect) {
  if (!this._flashElement.isReady || !this._flashElement.isReady()) {
    return;
  }

  // Sort tiles so they are rendered in an order coherent with their padding.
  var tileList = this._tileList;
  tileList.sort(tileCmp);

  this._renderOnFlash(layer, rect);
};


module.exports = FlashBaseRenderer;
