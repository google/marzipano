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

import eventEmitter from "minimal-event-emitter";
import NetworkError from "../NetworkError";
import WorkPool from "../collections/WorkPool";
import chain from "../util/chain";
import delay from "../util/delay";
import now from "../util/now";


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
 * @class ImageUrlSource
 * @implements Source
 * @classdesc
 *
 * A {@link Source} that loads {@link Asset assets} from images given a URL and
 * a crop rectangle.
 *
 * @param {Function} sourceFromTile Function that receives a tile and returns
 * a `{ url, rect }` object, where `url` is an image URL and `rect`, when
 * present, is an `{ x, y, width, height }` object in normalized coordinates
 * denoting the portion of the image to use.
 * @param {Object} opts
 * @param {number} [opts.concurrency=4] Maximum number of tiles to request at
 *     the same time. The limit is per {@link ImageSourceUrl} instance.
 * @param {number} [opts.retryDelay=10000] Time in milliseconds to wait before
 *     retrying a failed request.
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

eventEmitter(ImageUrlSource);


ImageUrlSource.prototype.loadAsset = function(stage, tile, done) {

  var self = this;

  var retryDelay = this._retryDelay;
  var retryMap = this._retryMap;

  var tileSource = this._sourceFromTile(tile);
  var url = tileSource.url;
  var rect = tileSource.rect;

  var loadImage = stage.loadImage.bind(stage, url, rect);

  var loadFn = function(done) {
    // TODO: Deduplicate load requests for the same URL. Although the browser
    // might be smart enough to avoid duplicate requests, they are still unduly
    // impacted by the concurrency parameter.
    return self._loadPool.push(loadImage, function(err, asset) {
      if (err) {
        if (err instanceof NetworkError) {
          // If a network error occurred, wait before retrying.
          retryMap[url] = now();
          self.emit('networkError', err, tile);
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
    var currentTime = now();
    var elapsed = currentTime - lastTime;
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
 * Creates an ImageUrlSource from a string template.
 *
 * @param {String} url Tile URL template, which may contain the following
 *    placeholders:
 *    - `{f}` : tile face (one of `b`, `d`, `f`, `l`, `r`, `u`)
 *    - `{z}` : tile level index (0 is the smallest level)
 *    - `{x}` : tile horizontal index
 *    - `{y}` : tile vertical index
 * @param {Object} opts In addition to the options already supported by the
 *     {@link ImageUrlSource} constructor.
 * @param {String} opts.cubeMapPreviewUrl URL to use as the preview level.
 *     This must be a single image containing six cube faces laid out
 *     vertically according to the face order parameter.
 * @param {String} [opts.cubeMapPreviewFaceOrder='bdflru'] Face order within
 *     the preview image.
 */
ImageUrlSource.fromString = function(url, opts) {
  opts = opts || {};

  var faceOrder = opts && opts.cubeMapPreviewFaceOrder || defaultCubeMapFaceOrder;

  var urlFn = opts.cubeMapPreviewUrl ? withPreview : withoutPreview;

  return new ImageUrlSource(urlFn, opts);

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

function propertyRegExp(property) {
  var regExpStr = '\\{(' + property + ')\\}';
  return new RegExp(regExpStr, 'g');
}

export default ImageUrlSource;
