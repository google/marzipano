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

var FlashAsset = require('../assets/Flash');
var NetworkError = require('../NetworkError');
var once = require('../util/once');

// TODO: Move the load queue into the loader.

/**
 * @class FlashImageLoader
 * @implements ImageLoader
 * @classdesc
 *
 * A {@link Loader} for Flash images.
 *
 * @param {Stage} stage The stage which is going to request images to be loaded.
 */
function FlashImageLoader(stage) {
  if (stage.type !== 'flash') {
    throw new Error('Stage type incompatible with loader');
  }
  this._stage = stage;
}

/**
 * Loads an {@link Asset} from an image.
 * @param {string} url The image URL.
 * @param {?Rect} rect A {@link Rect} describing a portion of the image, or null
 *     to use the full image.
 * @param {function(?Error, Asset)} done The callback.
 * @return {function()} A function to cancel loading.
 */
FlashImageLoader.prototype.loadImage = function(url, rect, done) {
  var stage = this._stage;
  var flashElement = stage.flashElement();

  var x = rect && rect.x || 0;
  var y = rect && rect.y || 0;
  var width = rect && rect.width || 1;
  var height = rect && rect.height || 1;

  var imageId = flashElement.loadImage(url, width, height, x, y);

  done = once(done);

  // TODO: use a single callback for all imageLoaded events.

  function callback(err, callbackId) {
    // There is a single callback for all load events, so make sure this
    // is the right one.
    if (callbackId !== imageId) {
      return;
    }

    stage.removeFlashCallbackListener('imageLoaded', callback);

    // TODO: is there any way to distinguish a network error from other
    // kinds of errors? For now we always return NetworkError since this
    // prevents images to be retried continuously while we are offline.
    if (err) {
      done(new NetworkError('Network error: ' + url));
    } else {
      done(null, new FlashAsset(flashElement, imageId));
    }
  }

  stage.addFlashCallbackListener('imageLoaded', callback);

  function cancel() {
    flashElement.cancelImage(imageId);
    stage.removeFlashCallbackListener('imageLoaded', callback);
    done.apply(null, arguments);
  }

  return cancel;
};

module.exports = FlashImageLoader;
