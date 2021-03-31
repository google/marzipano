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

// Create procedurally-generated single-color tile source.
var source = new SolidColorSource(512, 512);

// Create geometry with a very large number of levels.
var levels = [];
for(var i = 0; i < 32; i++) {
  levels.push({ tileSize: 512, size: 512 * Math.pow(2,i) });
}
var geometry = new Marzipano.CubeGeometry(levels);

// Create view.
var view = new Marzipano.RectilinearView();

// Create scene.
var scene = viewer.createScene({
  source: source,
  geometry: geometry,
  view: view,
  pinFirstLevel: true
});

// Display scene.
scene.switchTo();

// Show stats about the current view and cubemap size.

var facePixelsElement = document.getElementById('facePixels');
var faceTilesElement = document.getElementById('faceTiles');
var totalPixelsElement = document.getElementById('totalPixels');
var totalTilesElement = document.getElementById('totalTiles');
var fovElement = document.getElementById('fov');

view.addEventListener('change', function() {
  var level = view.selectLevel(geometry.levelList);

  var faceTiles = level.numHorizontalTiles() * level.numVerticalTiles();
  var totalTiles = faceTiles * 6;
  var faceMegaPixels = (level.width()/1000) * (level.height()/1000);
  var totalMegaPixels = faceMegaPixels * 6;

  var fovDeg = view.fov() * 180/Math.PI;
  var fovFormatted = fovDeg.toFixed(10) + '°';

  var faceTilesFormatted = formatTileNum(faceTiles);
  var totalTilesFormatted = formatTileNum(totalTiles);
  var facePixelsFormatted = formatMegaPixels(faceMegaPixels) + 'pixel';
  var totalPixelsFormatted = formatMegaPixels(totalMegaPixels) + 'pixel';

  faceTilesElement.innerHTML = faceTilesFormatted;
  totalTilesElement.innerHTML = totalTilesFormatted;
  facePixelsElement.innerHTML = facePixelsFormatted;
  totalPixelsElement.innerHTML = totalPixelsFormatted;
  fovElement.innerHTML = fovFormatted;
});

function formatMegaPixels(num) {
  var suffixes = [ 'Mega' , 'Giga', 'Tera', 'Peta', 'Exa', 'Zetta' ];
  for (var i = 0; i < suffixes.length; i++) {
    var divider = Math.pow(1000, i);
    if (num < divider) {
      break;
    }
  }
  i -= 1;
  var divided = num / Math.pow(1000, i);
  var formatted = divided.toFixed(2) + ' ' + suffixes[i];
  return formatted;
}

function formatTileNum(num) {
  var suffixes = [ '', 'K', 'M' , 'G', 'T', 'P', 'E', 'Z' ];
  if (num < 999999) {
    return num;
  }
  for (var i = 0; i < suffixes.length; i++) {
    var divider = Math.pow(1000, i);
    if (num < divider) {
      break;
    }
  }
  i -= 1;
  var divided = num / Math.pow(1000, i);
  var formatted = divided.toFixed(2) + suffixes[i];
  return formatted;
}
