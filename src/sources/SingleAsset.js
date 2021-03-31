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

/**
 * @class SingleAssetSource
 * @implements Source
 * @classdesc
 *
 * A {@link Source} that always provides the same {@link Asset}.
 *
 * @param {Asset} asset The asset.
*/
function SingleAssetSource(asset) {
  this._asset = asset;
}

SingleAssetSource.prototype.asset = function() {
  return this._asset;
};

SingleAssetSource.prototype.loadAsset = function(stage, tile, done) {
  var self = this;

  var timeout = setTimeout(function() {
    done(null, tile, self._asset);
  }, 0);

  function cancel() {
    clearTimeout(timeout);
    done.apply(null, arguments);
  }

  return cancel;
};

module.exports = SingleAssetSource;
