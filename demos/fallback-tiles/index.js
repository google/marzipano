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

// Create a stage and register the default renderers.
var stage = new Marzipano.WebGlStage();
Marzipano.registerDefaultRenderers(stage);

// Set up view.
var initialViewParams = { yaw: Math.PI/16, pitch: 0, fov: Math.PI/2 };
var view = new Marzipano.RectilinearView(initialViewParams);

// Set up the bottom layer.
var levelsBelow = [512].map(function(size) {
  return {size: size, tileSize: 512};
});
var geometryBelow = new Marzipano.CubeGeometry(levelsBelow);
var sourceBelow = new Marzipano.ImageUrlSource(function(tile) {
  return { url: "//www.marzipano.net/media/pixels/red.png" };
});
var textureStoreBelow = new Marzipano.TextureStore(sourceBelow, stage);
var layerBelow = new Marzipano.Layer(
    sourceBelow, geometryBelow, view, textureStoreBelow, { effects: { opacity: 1 } });

// Set up the top layer.
var levelsAbove = [512, 1024, 2048, 4096].map(function(size) {
  return {size: size, tileSize: 512};
});
var geometryAbove = new Marzipano.CubeGeometry(levelsAbove);
var sourceAbove = new Marzipano.ImageUrlSource(function(tile) {
  return { url: "//www.marzipano.net/media/generated-tiles/" +
    tile.z + '_' + tile.face + '_' + tile.x + '_' + tile.y + '.png' };
});
var textureStoreAbove = new Marzipano.TextureStore(sourceAbove, stage);
var layerAbove = new Marzipano.Layer(
    sourceAbove, geometryAbove, view, textureStoreAbove, { effects: { opacity: 0.6 } });

// Add layers to stage.
stage.addLayer(layerBelow);
stage.addLayer(layerAbove);

// Add stage into DOM and update its size.
var container = document.getElementById('rendered');
container.appendChild(stage.domElement());
stage.setSize({ width: container.clientWidth, height: container.clientHeight });

// Pin level 0 so it serves as the last-resort fallback.
layerBelow.pinLevel(0);
layerAbove.pinLevel(0);

// Force level 2 to be rendered, causing levels 1 and 3 to be used as parent
// and children fallbacks, respectively.
layerAbove.setFixedLevel(2);

// List of tiles to be preloaded.
var preloadTiles = [
  // Level 1 tile on top right of front face (parent fallback).
  new Marzipano.CubeGeometry.Tile('f', 1, 0, 1, geometryAbove),
  // Level 2 tile on bottom right of front face (intended display level).
  new Marzipano.CubeGeometry.Tile('f', 3, 2, 2, geometryAbove),
  // Level 3 tiles on bottom right of front face (children fallback).
  new Marzipano.CubeGeometry.Tile('f', 6, 6, 3, geometryAbove),
  new Marzipano.CubeGeometry.Tile('f', 6, 7, 3, geometryAbove),
  new Marzipano.CubeGeometry.Tile('f', 7, 6, 3, geometryAbove),
  new Marzipano.CubeGeometry.Tile('f', 7, 7, 3, geometryAbove),
  // Level 3 tiles on bottom right of front face (incomplete children fallback).
  new Marzipano.CubeGeometry.Tile('f', 4, 4, 3, geometryAbove),
  new Marzipano.CubeGeometry.Tile('f', 4, 5, 3, geometryAbove)
];

// Pin tiles to force them to load.
for (var i = 0; i < preloadTiles.length; i++) {
  layerAbove.textureStore().pin(preloadTiles[i]);
}

// Check whether all tiles have loaded.
function ready() {
  for (var i = 0; i < preloadTiles.length; i++) {
    var state = layerAbove.textureStore().query(preloadTiles[i]);
    if (!state.hasTexture) {
      return false;
    }
  }
  return true;
}

// Wait for tiles to load, then render.
var checkInterval = 200;
setTimeout(function check() {
  if (ready()) {
    stage.render();
  } else {
    setTimeout(check, checkInterval);
  }
}, checkInterval);
