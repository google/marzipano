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

var Stage = require('./Stage');
var cssSupported = require('../support/Css');
var browser = require('bowser');
var inherits = require('../util/inherits');
var loadImageHtml = require('./loadImageHtml');
var setAbsolute = require('../util/dom').setAbsolute;
var setFullSize = require('../util/dom').setFullSize;
var setNullTransformOrigin = require('../util/dom').setNullTransformOrigin;


// Browser-specific workarounds.
var browserQuirks = {

  // On most browsers we need to pad the tile edges with repeated pixels so
  // that the borders between neighboring tiles aren't apparent.
  // On iOS this isn't required, but we must disable it because the padding is
  // incorrectly rendered on top of the neighboring tile.
  padSize: browser.ios ? 0 : 3,

  // In order to prevent fallback tiles from overlapping their children, iOS
  // requires smaller zoom levels to be placed below larger zoom levels in
  // the CSS 3D coordinate space.
  reverseLevelDepth: browser.ios,

  // A null transform on the layer element is required so that transitions
  // between layers work on iOS.
  useNullTransform: browser.ios,

  // On Webkit and Gecko browsers, some tiles become invisible at certain
  // angles, usually non-floor tiles when looking straight down. Setting the
  // translateZ following the perspective transform to a slightly larger value
  // than the latter seems to work around this glitch.
  perspectiveNudge: browser.webkit || browser.gecko ? 0.001 : 0

};

/**
 * @class
 * @classdesc A {@link Stage} implementation using CSS 3D Transforms.
 * @extends Stage
*/
function CssStage(opts) {
  this.constructor.super_.call(this, opts);

  this._domElement = document.createElement('div');

  setAbsolute(this._domElement);
  setFullSize(this._domElement);

  // N.B. the CSS stage requires device adaptation to be configured through
  // the <meta name="viewport"> tag on the containing document.
  // Failure to do so will cause clipping and padding bugs to occur,
  // at least on iOS <= 7.
}

inherits(CssStage, Stage);


CssStage.prototype.destroy = function() {
  this.constructor.super_.prototype.destroy.call(this);
  this._domElement = null;
};


CssStage.supported = function() {
  return cssSupported();
};


CssStage.prototype._setSize = function() {};


CssStage.prototype.loadImage = loadImageHtml;


CssStage.prototype._validateLayer = function(layer) {
  return;
};


CssStage.prototype.createRenderer = function(Renderer) {
  return new Renderer(this._domElement, browserQuirks);
};

CssStage.prototype.destroyRenderer = function(renderer) {
  renderer.destroy();
};


CssStage.prototype.startFrame = function() {};


CssStage.prototype.endFrame = function() {};


CssStage.type = CssStage.prototype.type = 'css';


function CssTexture(stage, tile, asset) {

  var canvas = document.createElement('canvas');
  setAbsolute(canvas);
  setNullTransformOrigin(canvas);

  this._canvas = canvas;
  this._timestamp = null;
  this.refresh(tile, asset);

}


CssTexture.prototype.refresh = function(tile, asset) {

  // Check whether the texture needs to be updated.
  var timestamp = asset.timestamp();
  if (timestamp === this._timestamp) {
    return;
  }
  this._timestamp = timestamp;

  var canvas = this._canvas;
  var ctx = canvas.getContext('2d');

  // Get asset element.
  var element = asset.element();

  // Get tile dimensions.
  var tileWidth = tile.width();
  var tileHeight = tile.height();

  // Get padding sizes.
  var padSize = browserQuirks.padSize;
  var padTop = tile.padTop() ? padSize : 0;
  var padBottom = tile.padBottom() ? padSize : 0;
  var padLeft = tile.padLeft() ? padSize : 0;
  var padRight = tile.padRight() ? padSize : 0;

  // Set canvas size.
  canvas.width = padLeft + tileWidth + padRight;
  canvas.height = padTop + tileHeight + padBottom;

  // Draw image.
  ctx.drawImage(element, padLeft, padTop, tileWidth, tileHeight);

  var i;

  // Draw top padding.
  for (i = 0; i < padTop; i++) {
    ctx.drawImage(canvas, padLeft, padTop, tileWidth, 1,
                          padLeft, i, tileWidth, 1);
  }

  // Draw left padding.
  for (i = 0; i < padLeft; i++) {
    ctx.drawImage(canvas, padLeft, padTop, 1, tileHeight,
                          i, padTop, 1, tileHeight);
  }

  // Draw bottom padding.
  for (i = 0; i < padBottom; i++) {
    ctx.drawImage(canvas, padLeft, padTop + tileHeight - 1, tileWidth, 1,
                          padLeft, padTop + tileHeight + i, tileWidth, 1);
  }

  // Draw right padding.
  for (i = 0; i < padRight; i++) {
    ctx.drawImage(canvas, padLeft + tileWidth - 1, padTop, 1, tileHeight,
                          padLeft + tileWidth + i, padTop, 1, tileHeight);
  }

};


CssTexture.prototype.destroy = function() {
  // TODO: investigate whether keeping a pool of canvases instead of
  // creating new ones on demand improves performance.
  this._canvas = null;
  this._timestamp = null;
};


CssStage.TextureClass = CssStage.prototype.TextureClass = CssTexture;


module.exports = CssStage;
