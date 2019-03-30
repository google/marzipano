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

var eventEmitter = require('minimal-event-emitter');
var clearOwnProperties = require('../util/clearOwnProperties');

/**
 * @class FlashAsset
 * @implements Asset
 * @classdesc
 *
 * An immutable {@link Asset} compatible with {@link FlashStage}.
 * 
 * The asset's underlying pixel source is a unique image ID associated with
 * a Flash application.
 *
 * @param {Element} flashElement The HTML element for the Flash application.
 * @param {number} imageId The unique image ID inside the Flash application.
 */
function FlashAsset(flashElement, imageId) {
  this._flashElement = flashElement;
  this._imageId = imageId;
}

eventEmitter(FlashAsset);

/**
 * Destructor.
 */
FlashAsset.prototype.destroy = function() {
  this._flashElement.unloadImage(this._imageId);
  clearOwnProperties(this);
};

FlashAsset.prototype.element = function() {
  return this._imageId;
};

FlashAsset.prototype.width = function() {
  // Not actually used anywhere.
  return 0;
};

FlashAsset.prototype.height = function() {
  // Not actually used anywhere.
  return 0;
};

FlashAsset.prototype.timestamp = function() {
  return 0;
};

FlashAsset.prototype.isDynamic = function() {
  return false;
};

module.exports = FlashAsset;
