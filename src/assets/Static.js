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

var global = require('../util/global');
var eventEmitter = require('minimal-event-emitter');
var clearOwnProperties = require('../util/clearOwnProperties');

var propertyMap = {
  HTMLImageElement: ['naturalWidth', 'naturalHeight'],
  HTMLCanvasElement: ['width', 'height'],
  ImageBitmap: ['width', 'height']
};

/**
 * @class StaticAsset
 * @implements Asset
 * @classdesc
 *
 * An immutable {@link Asset} compatible with {@link WebGlStage} and
 * {@link CssStage}.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} element The
 *     underlying pixel source.
 * @throws If the pixel source is unsupported.
 */
function StaticAsset(element) {
  var supported = false;
  for (var type in propertyMap) {
    if (global[type] && element instanceof global[type]) {
      supported = true;
      this._widthProp = propertyMap[type][0];
      this._heightProp = propertyMap[type][1];
      break;
    }
  }
  if (!supported) {
    throw new Error('Unsupported pixel source');
  }

  this._element = element;
}

eventEmitter(StaticAsset);

/**
 * Destructor.
 */
StaticAsset.prototype.destroy = function() {
  clearOwnProperties(this);
};

StaticAsset.prototype.element = function() {
  return this._element;
};

StaticAsset.prototype.width = function() {
  return this._element[this._widthProp];
};

StaticAsset.prototype.height = function() {
  return this._element[this._heightProp];
};

StaticAsset.prototype.timestamp = function() {
  return 0;
};

StaticAsset.prototype.isDynamic = function() {
  return false;
};

module.exports = StaticAsset;
