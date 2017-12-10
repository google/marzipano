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
var CubeTile = require('../geometries/Cube').TileClass;
var inherits = require('../util/inherits');

var radToDeg = require('../util/radToDeg');


/**
 * @class
 * @classdesc A renderer for {@link CubeGeometry} and {@link RectilinearView},
 *     appropriate for a {@link FlashStage}.
 * @implements Renderer
 */
function FlashCubeRenderer(flashElement, layerId, quirks) {
  this.constructor.super_.call(this, flashElement, layerId, quirks, CubeTile);
  this._flashTileList = [];
}

inherits(FlashCubeRenderer, FlashBaseRenderer);


FlashCubeRenderer.prototype._renderOnFlash = function(layer, rect) {

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
      face: tile.face,
      width: tile.width(),
      height: tile.height(),
      centerX: tile.centerX(),
      centerY: tile.centerY(),
      rotX: radToDeg(tile.rotX()),
      rotY: radToDeg(tile.rotY()),
      levelSize: tile.levelWidth(),
      padTop: padTop,
      padBottom: padBottom,
      padLeft: padLeft,
      padRight: padRight
    });
  }

  // Get opacity value.
  var opacity = 1.0;
  var effects = layer.effects();
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }

  // Get view parameters.
  var view = layer.view();
  var yaw = view.yaw();
  var pitch = view.pitch();
  var roll = view.roll();
  var fov = view.fov();

  flashElement.drawCubeTiles(layerId, rect.width, rect.height, rect.left, rect.top,
                             opacity, yaw, pitch, roll, fov, flashTileList);
};


module.exports = FlashCubeRenderer;
