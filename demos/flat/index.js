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

// The tiles were generated with the krpano tools, which index the tiles
// from 1 instead of 0. Hence, we cannot use ImageUrlSource.fromString()
// and must write a custom function to convert tiles into URLs.
var urlPrefix = "//www.marzipano.net/media/lisboa";
var tileUrl = function(z, x, y) {
  return urlPrefix + "/l" + z + "/" + y + "/l" + z + '_' + y + '_' + x + ".jpg";
};
var source = new Marzipano.ImageUrlSource(function(tile) {
  return { url: tileUrl(tile.z+1, tile.x+1, tile.y+1) };
});

// Create geometry.
var geometry = new Marzipano.FlatGeometry([
  { width: 756,   height: 312,   tileWidth: 756, tileHeight: 756 },
  { width: 1512,  height: 624,   tileWidth: 756, tileHeight: 756 },
  { width: 3024,  height: 1248,  tileWidth: 756, tileHeight: 756 },
  { width: 6048,  height: 2496,  tileWidth: 756, tileHeight: 756 },
  { width: 12096, height: 4992,  tileWidth: 756, tileHeight: 756 },
  { width: 24192, height: 9984,  tileWidth: 756, tileHeight: 756 },
  { width: 48384, height: 19968, tileWidth: 756, tileHeight: 756 }
]);

// Create view.
// The letterbox view limiter allows the view to zoom out until the image is
// fully visible, adding black bands around the image where necessary.
var limiter = Marzipano.util.compose(
  Marzipano.FlatView.limit.resolution(48384),
  Marzipano.FlatView.limit.letterbox()
);
var view = new Marzipano.FlatView({ mediaAspectRatio: 48384/19968}, limiter);

// Create scene.
var scene = viewer.createScene({
  source: source,
  geometry: geometry,
  view: view,
  pinFirstLevel: true
});

// Display scene.
scene.switchTo();
