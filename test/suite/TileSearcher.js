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

var assert = require('chai').assert;

var TileSearcher = require('../../src/TileSearcher');

var CubeGeometry = require('../../src/geometries/Cube');
var CubeTile = CubeGeometry.Tile;
var RectilinearView = require('../../src/views/Rectilinear');

suite('TileSearcher', function() {

  test('none visible', function() {
    var geometry = new CubeGeometry([{size: 512, tileSize: 512}]);
    var startingTile = new CubeTile('f', 0, 0, 0, geometry);
    var view = new RectilinearView({
      yaw: Math.PI, fov: Math.PI/4, width: 100, height: 100
    });
    var result = [];
    var count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 0);
    assert.isEmpty(result);
  });

  test('one visible', function() {
    var geometry = new CubeGeometry([{size: 512, tileSize: 512}]);
    var startingTile = new CubeTile('b', 0, 0, 0, geometry);
    var view = new RectilinearView({
        yaw: Math.PI, fov: Math.PI/4, width: 100, height: 100
    });
    var result = [];
    var count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 1);
    assert.lengthOf(result, 1);
    assert.isTrue(result[0].equals(startingTile));
  });

  test('many visible', function() {
    var geometry = new CubeGeometry([{size: 512, tileSize: 128}]);
    var startingTile = new CubeTile('f', 1, 1, 0, geometry);
    var expectedTiles = [
      new CubeTile('f', 1, 1, 0, geometry),
      new CubeTile('f', 1, 2, 0, geometry),
      new CubeTile('f', 2, 1, 0, geometry),
      new CubeTile('f', 2, 2, 0, geometry)
    ];
    var view = new RectilinearView({
      yaw: 0, fov: Math.PI/6, width: 100, height: 100
    });
    var result = [];
    var count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 4);
    var seen = 0;
    for (var i = 0; i < result.length; i++) {
      for (var j = 0; j < expectedTiles.length; j++) {
        if (result[i].equals(expectedTiles[j])) {
          seen++;
          continue;
        }
      }
    }
    assert.equal(seen, expectedTiles.length);
  });

  test('preserves existing array members', function() {
    var geometry = new CubeGeometry([{size: 512, tileSize: 512}]);
    var startingTile = new CubeTile('b', 0, 0, 0, geometry);
    var view = new RectilinearView({
      yaw: Math.PI, fov: Math.PI/4, width: 100, height: 100
    });
    var result = [42];
    var count = new TileSearcher().search(view, startingTile, result);
    assert.equal(count, 1);
    assert.lengthOf(result, 2);
    assert.equal(result[0], 42);
    assert.isTrue(result[1].equals(startingTile));
  });

  test('consecutive searches work correctly', function() {
    var geometry = new CubeGeometry([{size: 512, tileSize: 512}]);
    var startingTile1 = new CubeTile('f', 0, 0, 0, geometry);
    var view1 = new RectilinearView({
      yaw: 0, fov: Math.PI/4, width: 100, height: 100
    });
    var startingTile2 = new CubeTile('b', 0, 0, 0, geometry);
    var view2 = new RectilinearView({
      yaw: Math.PI, fov: Math.PI/4, width: 100, height: 100
    });
    var searcher = new TileSearcher();
    var result = [];
    var count1 = searcher.search(view1, startingTile1, result);
    var count2 = searcher.search(view2, startingTile2, result);
    assert.equal(count1, 1);
    assert.equal(count2, 1);
    assert.lengthOf(result, 2);
    assert.equal(result[0], startingTile1);
    assert.equal(result[1], startingTile2);
  });

});
