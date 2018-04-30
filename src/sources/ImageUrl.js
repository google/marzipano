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
var NetworkError = require('../NetworkError');
var WorkPool = require('../collections/WorkPool');
var chain = require('../util/chain');
var delay = require('../util/delay');
var clock = require('../util/clock');


// Map template properties to their corresponding tile properties.
var templateProperties = {
  x: 'x',
  y: 'y',
  z: 'z',
  f: 'face'
};

// Default face order for cube maps.
var defaultCubeMapFaceOrder = 'bdflru';

// Default maximum number of concurrent requests.
var defaultConcurrency = 4;

// Default milliseconds to wait before retrying failed requests.
var defaultRetryDelay = 10000;


/**
 * @class
 * @classdesc Source that loads images given a URL and a crop rectangle.
 * @implements Source
 * @param {Function} sourceFromTile Function that receives a tile and returns
 * an object `{ url, rect }`.
 * @param {Object} opts
 * @param {number} [opts.concurrency=4] Maximum number of tiles to load at the
 * same time.
 * @param {number} [opts.retryDelay=10000] Milliseconds to wait before
 * retrying failed requests.
*/
function ImageUrlSource(sourceFromTile, opts) {

  opts = opts ? opts : {};

  this._loadPool = new WorkPool({
    concurrency: opts.concurrency || defaultConcurrency
  });

  this._retryDelay = opts.retryDelay || defaultRetryDelay;
  this._retryMap = {};

  this._sourceFromTile = sourceFromTile;
}


ImageUrlSource.prototype.loadAsset = function(stage, tile, done) {

  var self = this;

  var retryDelay = this._retryDelay;
  var retryMap = this._retryMap;

  var tileSource = this._sourceFromTile(tile);
  var url = tileSource.url;
  var rect = tileSource.rect;

  var loadImage = stage.loadImage.bind(stage, url, rect);

  var loadFn = function(done) {
    return self._loadPool.push(loadImage, function(err, asset) {
      if (err) {
        if (err instanceof NetworkError) {
          // If a network error occurred, wait before retrying.
          retryMap[url] = clock();
          self.emit('networkError', asset, err);
        }
        done(err, tile);
      } else {
        // On a successful fetch, forget the previous timeout.
        delete retryMap[url];
        done(null, tile, asset);
      }
    });
  };

  // Check whether we are retrying a failed request.
  var delayAmount;
  var lastTime = retryMap[url];
  if (lastTime != null) {
    var now = clock();
    var elapsed = now - lastTime;
    if (elapsed < retryDelay) {
      // Wait before retrying.
      delayAmount = retryDelay - elapsed;
    } else {
      // Retry timeout expired; perform the request at once.
      delayAmount = 0;
      delete retryMap[url];
    }
  }

  var delayFn = delay.bind(null, delayAmount);

  return chain(delayFn, loadFn)(done);
};


/**
 * Create an ImageUrlSource from a string template
 * @param {String} url Template for the tile URLs. The following placeholders may be used:
   - {z} : tile level index (0 is the smallest level)
   - {f} : tile face (b, d, f, l, r, u)
   - {x} : tile x index
   - {y} : tile y index
 * @param {Object} opts
 * @param {String} opts.cubeMapPreviewUrl Use the cube map preview at this URL as the first level
 * @param {String} [opts.cubeMapPreviewFaceOrder='bdflru'] Ordering of the faces on the cube map preview
*/
ImageUrlSource.fromString = function(url, opts) {
  opts = opts || {};

  var faceOrder = opts && opts.cubeMapPreviewFaceOrder || defaultCubeMapFaceOrder;

  var urlFn = opts.cubeMapPreviewUrl ? withPreview : withoutPreview;

  return new ImageUrlSource(urlFn);

  function withoutPreview(tile) {
    var tileUrl = url;

    for (var property in templateProperties) {
      var templateProperty = templateProperties[property];
      var regExp = propertyRegExp(property);
      var valueFromTile = tile.hasOwnProperty(templateProperty) ? tile[templateProperty] : '';
      tileUrl = tileUrl.replace(regExp, valueFromTile);
    }

    return { url: tileUrl };
  }

  function withPreview(tile) {
    if (tile.z === 0) {
      return cubeMapUrl(tile);
    }
    else {
      return withoutPreview(tile);
    }
  }

  function cubeMapUrl(tile) {
    var y = faceOrder.indexOf(tile.face) / 6;
    return {
      url: opts.cubeMapPreviewUrl,
      rect: { x: 0, y: y, width: 1, height: 1/6 }
    };
  }
};


ImageUrlSource.stringHasFace = function(url) {
  return ImageUrlSource.stringHasProperty(url, 'f');
};


ImageUrlSource.stringHasX = function(url) {
  return ImageUrlSource.stringHasProperty(url, 'x');
};


ImageUrlSource.stringHasY = function(url) {
  return ImageUrlSource.stringHasProperty(url, 'y');
};


ImageUrlSource.stringHasLevel = function(url) {
  return ImageUrlSource.stringHasProperty(url, 'z');
};


ImageUrlSource.stringHasProperty = function(url, property) {
  return !!url.match(propertyRegExp(property));
};


function propertyRegExp(property) {
  var regExpStr = '\\{(' + property + ')\\}';
  return new RegExp(regExpStr, 'g');
}

eventEmitter(ImageUrlSource);

module.exports = ImageUrlSource;
