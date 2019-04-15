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

var FlatTile = require('../geometries/Flat').Tile;
var CssBaseRenderer = require('./CssBase');
var decimal = require('../util/decimal');
var inherits = require('../util/inherits');


/**
 * @class CssFlatRenderer
 * @implements Renderer
 * @classdesc
 *
 * A renderer for {@link FlatGeometry} and {@link FlatView}, appropriate for a
 * {@link CssStage}.
 *
 * Most users do not need to instantiate this class. Renderers are created and
 * destroyed by {@link Stage} as necessary.
 */
function CssFlatRenderer(root, quirks) {
  this.constructor.super_.call(this, root, quirks, FlatTile);
}

inherits(CssFlatRenderer, CssBaseRenderer);


CssFlatRenderer.prototype.calculateTransform = function(tile, texture, view) {

  var padSize = this._browserQuirks.padSize;

  var transform = '';

  // Place top left corner of tile at the center of the viewport.
  var viewportWidth = view.width();
  var viewportHeight = view.height();
  transform += 'translateX(' + decimal(viewportWidth/2) + 'px) translateY(' + decimal(viewportHeight/2) + 'px) ';

  // Determine the zoom factor.
  var zoomX = viewportWidth / view._zoomX();
  var zoomY = viewportHeight / view._zoomY();

  // Move tile into its position within the image.
  var cornerX = tile.centerX() - tile.scaleX() / 2 + 0.5;
  var cornerY = 0.5 - tile.centerY() - tile.scaleY() / 2;
  var translX = cornerX * zoomX;
  var translY = cornerY * zoomY;
  transform += 'translateX(' + decimal(translX) + 'px) translateY(' + decimal(translY) + 'px) ';

  // Apply view offsets.
  var offX = -view.x() * zoomX;
  var offY = -view.y() * zoomY;
  transform += 'translateX(' + decimal(offX) + 'px) translateY(' + decimal(offY) + 'px) ';

  // Compensate for padding around the tile.
  var padLeft = tile.padLeft() ? padSize : 0;
  var padTop = tile.padTop() ? padSize : 0;
  if (padLeft !== 0 || padTop !== 0) {
    transform += 'translateX(' + decimal(-padLeft) + 'px) translateY(' + decimal(-padTop) + 'px) ';
  }

  // Scale tile into correct size.
  var scaleX = zoomX / tile.levelWidth();
  var scaleY = zoomY / tile.levelHeight();
  transform += 'scale(' + decimal(scaleX) + ', ' + decimal(scaleY) + ') ';

  return transform;

};


module.exports = CssFlatRenderer;
