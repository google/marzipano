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

  // This variable will have the response callbacks where the keys will be 
  // the image URL and the value will be a function
  this._imageFetchersCallbacks = {};

  this._isSimpleImageFetcherWorker = true;

  function imageFetcherWorkerOnMessage(event) {
    this._imageFetchersCallbacks[event.data.imageURL](event);
    delete this._imageFetchersCallbacks[event.data.imageURL];
  }

  // Check what method can use for loading the images
  // Check if the browser supports `OffscreenCanvas` and `createImageBitmap`
  // else using only fetch
  if (
   typeof window.OffscreenCanvas === "function" &&
   typeof window.createImageBitmap === "function"
  ) {
    this._imageFetcherNoResizeWorker = 
      new require("../workers/fetchImageUsingImageBitmap")();

    this._imageFetcherResizeWorker = 
      new require("../workers/fetchImageUsingOffscreenCanvas")();

    this._imageFetcherNoResizeWorker.onmessage = imageFetcherWorkerOnMessage;
    this._imageFetcherResizeWorker.onmessage = imageFetcherWorkerOnMessage;

    this._isSimpleImageFetcherWorker = false;
  } else {
    this._imageFetcherWorker = new require("../workers/fetchImage")();

    this._imageFetcherWorker.onmessage = imageFetcherWorkerOnMessage;
  }
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
  var x = rect && rect.x || 0;
  var y = rect && rect.y || 0;
  var width = rect && rect.width || 1;
  var height = rect && rect.height || 1;

  done = once(done);

  var cancelFunction;
  var shouldCancel = false;

  if (this._isSimpleImageFetcherWorker) {
    var internalCancelFunction;

    this._imageFetchersCallbacks[url] = function(event) {
      if (shouldCancel) return;

      var img = new Image();

      const objectURL = URL.createObjectURL(event.data.blob);

      img.onload = () => {
          URL.revokeObjectURL(objectURL);

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

      img.url = objectURL;

      internalCancelFunction = function() {
        img.onload = img.onerror = null;
        img.src = '';
      }
    };

    cancelFunction = function() {
      shouldCancel = true;
      if (internalCancelFunction) internalCancelFunction();
      done.apply(null, arguments);
    }

    this._imageFetcherWorker.postMessage({ imageURL: url });
  } else {
    this._imageFetchersCallbacks[url] = function(event) {
      if (shouldCancel) return;
      done(null, new StaticAsset(event.data.imageBitmap));
    };

    cancelFunction = function() {
      shouldCancel = true;
      done.apply(null, arguments);
    }

    if (x === 0 && y === 0 && width === 1 && height === 1) {
      this._imageFetcherNoResizeWorker.postMessage({ imageURL: url });
    } else {
      const mainCanvas = document.createElement("canvas");
      const mainCanvasOffscreen = mainCanvas.transferControlToOffscreen();

      this._imageFetcherResizeWorker.postMessage(
        { 
          imageURL: url, 
          canvas: mainCanvasOffscreen,
          x,
          y,
          width,
          height
        }, 
        [mainCanvasOffscreen]
      );
    }
  }

  return cancelFunction;
};

module.exports = HtmlImageLoader;
