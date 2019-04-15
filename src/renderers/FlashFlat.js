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

var FlashBaseRenderer = require('./FlashBase');
var FlatTile = require('../geometries/Flat').Tile;
var inherits = require('../util/inherits');


/**
 * @class FlashFlatRenderer
 * @implements Renderer
 * @classdesc
 *
 * A renderer for {@link FlatGeometry} and {@link FlatView}, appropriate for a
 * {@link FlashStage}.
 *
 * Most users do not need to instantiate this class. Renderers are created and
 * destroyed by {@link Stage} as necessary.
 */
function FlashFlatRenderer(flashElement, layerId, quirks) {
  this.constructor.super_.call(this, flashElement, layerId, quirks, FlatTile);
  this._flashTileList = [];
}

inherits(FlashFlatRenderer, FlashBaseRenderer);


FlashFlatRenderer.prototype._renderOnFlash = function(layer, rect) {

  var flashElement = this._flashElement;
  var layerId = this._layerId;
  var padSize = this._quirks.padSize;

  var tileList = this._tileList;
  var textureMap = this._textureMap;

  var flashTileList = this._flashTileList;
  flashTileList.length = 0;

  for (var i = 0; i < tileList.length; i++) {
    var tile = tileList[i];
    var texture = textureMap.get(tile);
    if (!texture) {
      throw new Error('Rendering tile with missing texture');
    }

    // Get padding sizes.
    var padTop = tile.padTop() ? padSize : 0;
    var padBottom = tile.padBottom() ? padSize : 0;
    var padLeft = tile.padLeft() ? padSize : 0;
    var padRight = tile.padRight() ? padSize : 0;

    flashTileList.push({
      textureId: texture._textureId,
      width: tile.width(),
      height: tile.height(),
      centerX: tile.centerX(),
      centerY: tile.centerY(),
      scaleX: tile.scaleX(),
      scaleY: tile.scaleY(),
      levelWidth: tile.levelWidth(),
      levelHeight: tile.levelHeight(),
      padTop: padTop,
      padBottom: padBottom,
      padLeft: padLeft,
      padRight: padRight
    });
  }

  // Get viewport position and size.
  var stageWidth = this._flashElement.clientWidth;
  var stageHeight = this._flashElement.clientHeight;
  var viewportX = stageWidth * rect.x;
  var viewportY = stageHeight * rect.y;
  var viewportWidth = stageWidth * rect.width;
  var viewportHeight = stageHeight * rect.height;

  // Get opacity value.
  var opacity = 1.0;
  var effects = layer.effects();
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }

  // Get view parameters.
  var view = layer.view();
  var x = view.x();
  var y = view.y();
  var zoomX = view._zoomX();
  var zoomY = view._zoomY();

  flashElement.drawFlatTiles(
      layerId, viewportWidth, viewportHeight, viewportX, viewportY, opacity,
      x, y, zoomX, zoomY, flashTileList);
};


module.exports = FlashFlatRenderer;
