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

var StaticAsset = require('../assets/Static');
var NetworkError = require('../NetworkError');
var once = require('../util/once');

// N.B. HtmlImageLoader is broken on IE8 for images that require resizing, due
// to the unavailable HTML5 canvas element and the naturalWidth/naturalHeight
// properties of image elements. This is currently not a problem because the
// HTML-based renderers (WebGL and CSS) do not work on IE8 anyway. It could
// become a problem in the future if we decide to support CSS rendering of flat
// panoramas on IE8.

// TODO: Move the load queue into the loader.

/**
 * @class HtmlImageLoader
 * @implements ImageLoader
 * @classdesc
 *
 * A {@link Loader} for HTML images.
 *
 * @param {Stage} stage The stage which is going to request images to be loaded.
 */
function HtmlImageLoader(stage) {
  if (stage.type !== 'webgl' && stage.type !== 'css') {
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
HtmlImageLoader.prototype.loadImage = function(url, rect, done) {
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

  img.onload = function() {
    if (x === 0 && y === 0 && width === 1 && height === 1) {
      done(null, new StaticAsset(img));
    }
    else {
      x *= img.naturalWidth;
      y *= img.naturalHeight;
      width *= img.naturalWidth;
      height *= img.naturalHeight;

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext('2d');

      context.drawImage(img, x, y, width, height, 0, 0, width, height);

      done(null, new StaticAsset(canvas));
    }
  };

  img.onerror = function() {
    // TODO: is there any way to distinguish a network error from other
    // kinds of errors? For now we always return NetworkError since this
    // prevents images to be retried continuously while we are offline.
    done(new NetworkError('Network error: ' + url));
  };

  img.src = url;

  function cancel() {
    img.onload = img.onerror = null;
    img.src = '';
    done.apply(null, arguments);
  }

  return cancel;
};

module.exports = HtmlImageLoader;
