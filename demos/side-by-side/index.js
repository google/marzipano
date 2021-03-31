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

// Create left and right layers
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create views.
var viewLimiter = Marzipano.RectilinearView.limit.traditional(3100, 100*Math.PI/180);
var viewLeft = new Marzipano.RectilinearView(null, viewLimiter);
var viewRight = new Marzipano.RectilinearView(null, viewLimiter);

// Get the stage.
var stage = viewer.stage();

// Create layers.
var leftLayer = createLayer(stage, viewLeft, geometry, 'left',
  { relativeWidth: 0.5, relativeX: 0 });
var rightLayer = createLayer(stage, viewRight, geometry, 'right',
  { relativeWidth: 0.5, relativeX: 0.5 });

// Add layers to stage.
stage.addLayer(leftLayer);
stage.addLayer(rightLayer);

function createLayer(stage, view, geometry, eye, rect) {
  var urlPrefix = "//www.marzipano.net/media/music-room";
  var source = new Marzipano.ImageUrlSource.fromString(
    urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg",
    { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

  var textureStore = new Marzipano.TextureStore(source, stage);
  var layer = new Marzipano.Layer(source, geometry, view, textureStore,
                                  { effects: { rect: rect }});

  layer.pinFirstLevel();

  return layer;
}

// Adjust the projection center.
// Note that setProjectionCenterX() and setProjectionCenterY() are
// experimental APIs and may change in the future.

var projectionCenterXElement = document.querySelector("#projection-center-x");
var projectionCenterYElement = document.querySelector("#projection-center-y");

projectionCenterXElement.addEventListener('input', function() {
  var projectionCenterX = projectionCenterXElement.value;
  viewLeft.setProjectionCenterX(parseFloat(projectionCenterX));
  viewRight.setProjectionCenterX(parseFloat(-projectionCenterX));
});

projectionCenterYElement.addEventListener('input', function() {
  var projectionCenterY = projectionCenterYElement.value;
  viewLeft.setProjectionCenterY(parseFloat(projectionCenterY));
  viewRight.setProjectionCenterY(parseFloat(projectionCenterY));
});
