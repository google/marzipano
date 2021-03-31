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

// Create viewer.
var viewer = new Marzipano.Viewer(document.getElementById('pano'));

// Create geometry.
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create view.
// The view is shared by the two layers.
var viewLimiter = Marzipano.RectilinearView.limit.traditional(3100, 100*Math.PI/180);
var view = new Marzipano.RectilinearView(null, viewLimiter);

// Get the stage.
var stage = viewer.stage();

// Create the left and right images.
var left = createLayer(stage, view, geometry, 'left');
var right = createLayer(stage, view, geometry, 'right');

// Add layers into the stage.
// The left image must be rendered on top of the right image.
// See colorTransformEffects.js for an explanation.
stage.addLayer(right);
stage.addLayer(left);

function createLayer(stage, view, geometry, eye) {
  // Create the source.
  var urlPrefix = "//www.marzipano.net/media/music-room";
  var source = new Marzipano.ImageUrlSource.fromString(
    urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg",
    { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

  // Create the texture store.
  var textureStore = new Marzipano.TextureStore(source, stage);

  // Create the layer.
  var layer = new Marzipano.Layer(source, geometry, view, textureStore);

  layer.pinFirstLevel();

  return layer;
}

// Update the effects to match the chosen anaglyph type.
var typeElement = document.getElementById('type');
function updateEffects() {
  var type = typeElement.value;
  var effects = colorTransformEffects[type]();
  left.setEffects(effects.left);
  right.setEffects(effects.right);
}
updateEffects();
typeElement.addEventListener('change', updateEffects);
