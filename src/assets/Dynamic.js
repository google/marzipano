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

import StaticAsset from "./Static";
import inherits from "../util/inherits";
import eventEmitter from "minimal-event-emitter";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class DynamicAsset
 * @implements Asset
 * @extends StaticAsset
 * @classdesc
 *
 * An {@link Asset} whose pixel contents may change.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} element The
 *     underlying pixel source.
 * @throws If the pixel source is unsupported.
 */
function DynamicAsset(element) {
  this.constructor.super_.call(this, element);
  this._timestamp = 0;
}

inherits(DynamicAsset, StaticAsset);
eventEmitter(DynamicAsset);

/**
 * Destructor.
 */
DynamicAsset.prototype.destroy = function() {
  clearOwnProperties(this);
};

DynamicAsset.prototype.timestamp = function() {
  return this._timestamp;
};

DynamicAsset.prototype.isDynamic = function() {
  return true;
};

/**
 * Marks the asset dirty, signaling that the contents of the underlying pixel
 * source have changed.
 *
 * @throws If the asset is not dynamic.
 */
DynamicAsset.prototype.markDirty = function() {
  this._timestamp++;
  this.emit('change');
};

export default DynamicAsset;
