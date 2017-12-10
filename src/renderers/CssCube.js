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

var CubeTile = require('../geometries/Cube').TileClass;
var CssBaseRenderer = require('./CssBase');
var decimal = require('../util/decimal');
var inherits = require('../util/inherits');


/**
 * @class
 * @classdesc A renderer for {@link CubeGeometry} and {@link RectilinearView},
 *     appropriate for a {@link CssStage}.
 * @implements Renderer
 */
function CssCubeRenderer(root, quirks) {
  this.constructor.super_.call(this, root, quirks, CubeTile);
}

inherits(CssCubeRenderer, CssBaseRenderer);


CssCubeRenderer.prototype.calculateTransform = function(tile, texture, view) {

  var padSize = this._browserQuirks.padSize;
  var reverseLevelDepth = this._browserQuirks.reverseLevelDepth;
  var perspectiveNudge = this._browserQuirks.perspectiveNudge;

  var transform = '';

  // Calculate the cube size for this level.
  var cubeSize = reverseLevelDepth ? 256 - tile.z : tile.levelWidth();

  // Place top left corner of tile at viewport center to serve as the center
  // of rotation.
  // We do not rotate about the center of the tile because, for some mysterious
  // reason, this seems to occasionally crash Chrome.
  var size = view.size();
  var viewportWidth = size.width;
  var viewportHeight = size.height;
  transform += 'translate3d(' + decimal(viewportWidth/2) + 'px, ' + decimal(viewportHeight/2) + 'px, 0px) ';

  // Set the perspective depth.
  var perspective = 0.5 * viewportHeight / Math.tan(view.fov() / 2);
  var distance = perspective + perspectiveNudge;
  transform += 'perspective(' + decimal(perspective) + 'px) translateZ(' + decimal(distance) + 'px) ';

  // Set the camera rotation.
  var viewRotZ = -view.roll();
  var viewRotX = -view.pitch();
  var viewRotY = view.yaw();
  transform += 'rotateZ(' + decimal(viewRotZ) + 'rad) rotateX(' + decimal(viewRotX) + 'rad) rotateY(' + decimal(viewRotY) + 'rad) ';

  // Set the cube face orientation.
  var tileRotX = -tile.rotX();
  var tileRotY = tile.rotY();
  transform += 'rotateX(' + decimal(tileRotX) + 'rad) rotateY(' + decimal(tileRotY) + 'rad) ';

  // Move tile into its position within the cube face.
  var cornerX = tile.centerX() - tile.scaleX() / 2;
  var cornerY = -(tile.centerY() + tile.scaleY() / 2);
  var translX = cornerX * cubeSize;
  var translY = cornerY * cubeSize;
  var translZ = -cubeSize / 2;
  transform += 'translate3d(' + decimal(translX) + 'px, ' + decimal(translY) + 'px, ' + decimal(translZ) + 'px) ';

  // Scale tile into correct size.
  if (reverseLevelDepth) {
    var scaleX = cubeSize * tile.scaleX() / tile.width();
    var scaleY = cubeSize * tile.scaleY() / tile.height();
    transform += 'scale(' + decimal(scaleX) + ', ' + decimal(scaleY) + ') ';
  }

  // Compensate for padding around the tile.
  var padLeft = tile.padLeft() ? padSize : 0;
  var padTop = tile.padTop() ? padSize : 0;
  if (padLeft !== 0 || padTop !== 0) {
    transform += 'translate3d(' + decimal(-padLeft) + 'px, ' + decimal(-padTop) + 'px, 0) ';
  }

  return transform;

};


module.exports = CssCubeRenderer;
