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
import Marzipano from '../../src/index.js';

// Create viewer.
// Use progressive rendering to produce a more pleasing visual effect when
// zooming past several resolution levels, at the cost of additional bandwidth
// consumption.
var viewer = new Marzipano.Viewer(
    document.getElementById('pano'), {stage: {progressive: true}});

// Create source.
// The tiles were generated with the krpano tools, which indexes the tiles
// from 1 instead of 0. Hence, we cannot use ImageUrlSource.fromString()
// and must write a custom function to convert tiles into URLs.
var urlPrefix = "//www.marzipano.net/media/prague";
var previewUrl = urlPrefix + "/preview.jpg";
var tileUrl = function(f, z, x, y) {
  return urlPrefix + "/l" + z + "/" + f + "/" + y + "/" + x + ".jpg";
};
var source = new Marzipano.ImageUrlSource(function(tile) {
  if (tile.z === 0) {
    var mapY = 'lfrbud'.indexOf(tile.face) / 6;
    return { url: previewUrl, rect: { x: 0, y: mapY, width: 1, height: 1/6 }};
  } else {
    return { url: tileUrl(tile.face, tile.z, tile.x+1, tile.y+1) };
  }
});

// Create geometry.
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 },
  { tileSize: 512, size: 8192 },
  { tileSize: 512, size: 16384 },
  { tileSize: 512, size: 32768 },
  { tileSize: 512, size: 65536 }
]);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(65536, 100*Math.PI/180);
var view = new Marzipano.RectilinearView(null, limiter);

// Create scene.
var scene = viewer.createScene({
  source: source,
  geometry: geometry,
  view: view,
  pinFirstLevel: true
});

// Display scene.
scene.switchTo();
