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

var NetworkError = require('../NetworkError');
var once = require('../util/once');

var StaticImageAsset = require('../assets/StaticImage');
var StaticCanvasAsset = require('../assets/StaticCanvas');

// N.B. loadImageHtml is broken on IE8 for images that require resizing, due
// to the missing HTML5 canvas element and naturalWidth/naturalHeight
// properties on image elements. This is currently not a problem because the
// HTML-based renderers (WebGL and CSS) do not work on IE8 anyway for lack of
// CSS transforms support. It could become a problem in the future if we
// decide to support CSS rendering of flat panoramas on IE8.

function loadImageHtml(url, rect, done) {

  var img = new Image();

  // Allow cross-domain image loading with support for authentication via cookies.
  // This is required to be able to create WebGL textures from images residing
  // on a different domain than the HTML document's.
  img.crossOrigin = 'use-credentials';

  var x = rect && rect.x || 0;
  var y = rect && rect.y || 0;
  var width = rect && rect.width || 1;
  var height = rect && rect.height || 1;

  done = once(done);

  img.onload = function() {
    if (x === 0 && y === 0 && width === 1 && height === 1) {
      done(null, new StaticImageAsset(img));
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

      done(null, new StaticCanvasAsset(canvas));
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

}

module.exports = loadImageHtml;