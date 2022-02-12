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

import StaticAsset from "../assets/Static";
import NetworkError from "../NetworkError";
import browser from "bowser";
import global from "../util/global";
import once from "../util/once";

// TODO: Move the load queue into the loader.

// Whether to use createImageBitmap instead of a canvas for cropping.
// See https://caniuse.com/?search=createimagebitmap
var useCreateImageBitmap = !!global.createImageBitmap && !browser.firefox && !browser.safari;

// Options for createImageBitmap.
var createImageBitmapOpts = {
  imageOrientation: 'flipY',
  premultiplyAlpha: 'premultiply'
};

/**
 * @class HtmlImageLoader
 * @implements ImageLoader
 * @classdesc
 *
 * A {@link Loader} for HTML images.
 *
 * @param {Stage} stage The stage which is going to request images to be loaded.
 */
class HtmlImageLoader {
  constructor(stage) {
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
  loadImage(url, rect, done) {
    var self = this;

    var img = new Image();

    // Allow cross-domain image loading.
    // This is required to be able to create WebGL textures from images fetched
    // from a different domain. Note that setting the crossorigin attribute to
    // 'anonymous' will trigger a CORS preflight for cross-domain requests, but no
    // credentials (cookies or HTTP auth) will be sent; to do so, the attribute
    // would have to be set to 'use-credentials' instead. Unfortunately, this is
    // not a safe choice, as it causes requests to fail when the response contains
    // an Access-Control-Allow-Origin header with a wildcard. See the section
    // "Credentialed requests and wildcards" on:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    img.crossOrigin = 'anonymous';

    var x = rect && rect.x || 0;
    var y = rect && rect.y || 0;
    var width = rect && rect.width || 1;
    var height = rect && rect.height || 1;

    done = once(done);

    img.onload = function () {
      self._handleLoad(img, x, y, width, height, done);
    };

    img.onerror = function () {
      self._handleError(url, done);
    };

    img.src = url;

    function cancel() {
      img.onload = img.onerror = null;
      img.src = '';
      done.apply(null, arguments);
    }

    return cancel;
  }
  _handleLoad(img, x, y, width, height, done) {
    if (x === 0 && y === 0 && width === 1 && height === 1) {
      // Fast path for when cropping is not needed.
      done(null, new StaticAsset(img));
      return;
    }

    x *= img.naturalWidth;
    y *= img.naturalHeight;
    width *= img.naturalWidth;
    height *= img.naturalHeight;

    if (useCreateImageBitmap) {
      // Prefer to crop using createImageBitmap, which can potentially offload
      // work to another thread and avoid blocking the user interface.
      // Assume that the promise is never rejected.
      global.createImageBitmap(img, x, y, width, height, createImageBitmapOpts)
        .then(function (bitmap) {
          done(null, new StaticAsset(bitmap));
        });
    } else {
      // Fall back to cropping using a canvas, which can potentially block the
      // user interface, but is the best we can do.
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext('2d');
      context.drawImage(img, x, y, width, height, 0, 0, width, height);
      done(null, new StaticAsset(canvas));
    }
  }
  _handleError(url, done) {
    // TODO: is there any way to distinguish a network error from other
    // kinds of errors? For now we always return NetworkError since this
    // prevents images to be retried continuously while we are offline.
    done(new NetworkError('Network error: ' + url));
  }
}

export default HtmlImageLoader;
