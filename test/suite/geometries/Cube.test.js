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

import { suite, test, beforeEach } from 'vitest';
import { assert as assert } from "chai";

import Cube from "../../../src/geometries/Cube";
var CubeTile = Cube.Tile;

suite('CubeGeometry', function() {

  function containsTile(tileList, tile) {
    for (var i = 0; i < tileList.length; i++) {
      if (tileList[i].equals(tile)) {
        return true;
      }
    }
    return false;
  }

  suite('malformed levels', function() {

    test('level size must not be smaller than parent level', function() {
      assert.throws(function() {
        new Cube([{ tileSize: 512, size: 512 }, { tileSize: 512, size: 500 }]);
      });
    });

    test('level size must be multiple of parent level', function() {
      assert.throws(function() {
        new Cube([{ tileSize: 512, size: 512 }, { tileSize: 512, size: 1000 }]);
      });
    });

    test('number of tiles in level must not be smaller than parent level', function() {
      assert.throws(function() {
        new Cube([{ tileSize: 128, size: 512 }, { tileSize: 512, size: 1024 }]);
      });
    });

    test('number of tiles in level must be multiple of parent level', function() {
      assert.throws(function() {
        new Cube([{ tileSize: 256, size: 512 }, { tileSize: 512, size: 512*3 }]);
      });
    });

  });

  suite('levels with constant tile size', function() {

    var cube = null;

    beforeEach(function() {
      var levels = [
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
        { tileSize: 512, size: 2048 }
      ];
      cube = new Cube(levels);
    });

    test('top tile does not have parent', function() {
      var p = new CubeTile('f', 0, 0, 0, cube).parent();
      assert.isNull(p);
    });

    test('parent of level 1', function() {
      for (var tileX = 0; tileX < 2; tileX++) {
        for (var tileY = 0; tileY < 2; tileY++) {
          var p = new CubeTile('f', tileX, tileY, 1, cube).parent();
          assert.isTrue(p.equals(new CubeTile('f', 0, 0, 0, cube)));
        }
      }
    });

    test('parent of level 2', function() {
      var p = new CubeTile('f', 2, 0, 2, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 1, 0, 1, cube)));
    });

    test('children of level 0', function() {
      var c = new CubeTile('f', 0, 0, 0, cube).children();
      assert.lengthOf(c, 4);
      assert.isTrue(containsTile(c, new CubeTile('f', 0, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 0, 1, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 1, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 1, 1, 1, cube)));
    });

    test('children of level 1 top right', function() {
      var c = new CubeTile('f', 1, 0, 1, cube).children();
      assert.lengthOf(c, 4);
      assert.isTrue(containsTile(c, new CubeTile('f', 2, 0, 2, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 2, 1, 2, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 3, 0, 2, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 3, 1, 2, cube)));
    });
  });

  suite('levels with doubling tile size', function() {

    var cube = null;

    beforeEach(function() {
      var levels = [
        { tileSize: 256, size: 512 },
        { tileSize: 512, size: 1024 }
      ];
      cube = new Cube(levels);
    });

    test('parent top left tile', function() {
      var p = new CubeTile('f', 0, 0, 1, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 0, 0, 0, cube)));
    });

    test('parent top right tile', function() {
      var p = new CubeTile('f', 1, 0, 1, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 1, 0, 0, cube)));
    });

    test('children of level 0 top right', function() {
      var c = new CubeTile('f', 1, 0, 0, cube).children();
      assert.lengthOf(c, 1);
      assert.isTrue(containsTile(c, new CubeTile('f', 1, 0, 1, cube)));
    });
  });

  suite('levels with halving tile size', function() {

    var cube = null;

    beforeEach(function() {
      var levels = [
        { tileSize: 128, size: 256 },
        { tileSize: 64, size: 512 }
      ];
      cube = new Cube(levels);
    });

    test('parent of top left tile', function() {
      var p = new CubeTile('f', 0, 0, 1, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 0, 0, 0, cube)));
    });

    test('parent of top right tile', function() {
      var p = new CubeTile('f', 7, 0, 1, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 1, 0, 0, cube)));
    });

    test('children of level 0 top right', function() {
      var c = new CubeTile('f', 1, 0, 0, cube).children();
      assert.lengthOf(c, 16);
      assert.isTrue(containsTile(c, new CubeTile('f', 4, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 7, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 4, 3, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 7, 3, 1, cube)));
    });
  });

  suite('levels with tripling tile size', function() {

    var cube = null;

    beforeEach(function() {
      var levels = [
        { tileSize: 256, size: 512 },
        { tileSize: 256, size: 1536 }
      ];
      cube = new Cube(levels);
    });

    test('top right tile parent', function() {
      var p = new CubeTile('f', 4, 2, 1, cube).parent();
      assert.isTrue(p.equals(new CubeTile('f', 1, 0, 0, cube)));
    });

    test('top right tile children', function() {
      var c = new CubeTile('f', 1, 0, 0, cube).children();
      assert.lengthOf(c, 9);
      assert.isTrue(containsTile(c, new CubeTile('f', 3, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 5, 0, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 3, 2, 1, cube)));
      assert.isTrue(containsTile(c, new CubeTile('f', 5, 2, 1, cube)));
    });

  });

});
