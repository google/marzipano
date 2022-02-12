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
import Marzipano from '../../src/index.js';
import { colorEffects } from './colorEffects.js';

export function createEditableLayers(stage, url, done) {
  urlToCanvas(url, function(err, colorCanvas) {
    if (err) {
      done(err);
      return;
    }

    // Make a desaturated copy of the canvas.
    var bwCanvas = desaturateCanvas(colorCanvas);

    // Create common geometry and view.
    var geometry = new Marzipano.EquirectGeometry([{ width: colorCanvas.width }]);
    var limiter = Marzipano.RectilinearView.limit.traditional(colorCanvas.width/4 * 1.5, 100*Math.PI/180);
    var view = new Marzipano.RectilinearView(null, limiter);

    // Create color layer.
    var colorAsset = new Marzipano.DynamicAsset(colorCanvas);
    var colorSource = new Marzipano.SingleAssetSource(colorAsset);
    var colorTextureStore = new Marzipano.TextureStore(colorSource, stage);
    var colorLayer = new Marzipano.Layer(colorSource, geometry, view, colorTextureStore);

    // Create desaturated layer.
    var bwAsset = new Marzipano.DynamicAsset(bwCanvas);
    var bwSource = new Marzipano.SingleAssetSource(bwAsset);
    var bwTextureStore = new Marzipano.TextureStore(bwSource, stage);
    var bwLayer = new Marzipano.Layer(bwSource, geometry, view, bwTextureStore);

    done(null, {
      colorLayer: colorLayer,
      bwLayer: bwLayer
    });
  });
}

function urlToCanvas(url, done) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = new Image();
  img.onload = function() {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    done(null, canvas);
  };
  img.onerror = function(e) {
    done(e);
  };
  img.crossOrigin = 'anonymous';
  img.src = url;
}

function desaturateCanvas(original) {
  var canvas = document.createElement('canvas');
  canvas.width = original.width;
  canvas.height = original.height;
  var ctx = canvas.getContext('2d');
  var imageData = original.getContext('2d').getImageData(0, 0, original.width, original.height);
  Marzipano.colorEffects.applyToImageData(imageData, colorEffects.saturation(0));
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
