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

var RectilinearView = require('../../../src/views/Rectilinear');
var CubeGeometry = require('../../../src/geometries/Cube');
var mat4 = require('gl-matrix').mat4;
var htov = require('../../../src/util/convertFov').htov;
var pixelRatio = require('../../../src/util/pixelRatio');

suite('RectilinearView', function() {

  suite('constructor', function() {

    test('sets default parameters', function() {
      var view = new RectilinearView();
      assert.strictEqual(view.yaw(), 0.0);
      assert.strictEqual(view.pitch(), 0.0);
      assert.strictEqual(view.fov(), Math.PI/4);
    });

  });

  suite('getters/setters', function() {

    test('yaw', function() {
      var view = new RectilinearView();
      view.setYaw(1.234);
      assert.strictEqual(view.yaw(), 1.234);
    });

    test('pitch', function() {
      var view = new RectilinearView();
      view.setPitch(1.234);
      assert.strictEqual(view.pitch(), 1.234);
    });

    test('fov', function() {
      var view = new RectilinearView();
      view.setFov(1.234);
      assert.strictEqual(view.fov(), 1.234);
    });

    test('size', function() {
      var view = new RectilinearView();
      view.setSize({ width: 123, height: 456 });
      var obj = {};
      var retObj = view.size(obj);
      assert.strictEqual(obj.width, 123);
      assert.strictEqual(obj.height, 456);
      assert.isNotNull(retObj);
      assert.strictEqual(retObj.width, 123);
      assert.strictEqual(retObj.height, 456);
    });

  });

  suite('parameter normalization', function() {

    test('yaw', function() {
      var view = new RectilinearView();
      view.setYaw(Math.PI + 0.01);
      assert.strictEqual(view.yaw(), -Math.PI + 0.01);
      view.setYaw(-Math.PI - 0.01);
      assert.strictEqual(view.yaw(), Math.PI - 0.01);
    });

    test('pitch', function() {
      var view = new RectilinearView();
      view.setPitch(Math.PI + 0.01);
      assert.strictEqual(view.pitch(), -Math.PI + 0.01);
      view.setPitch(-Math.PI - 0.01);
      assert.strictEqual(view.pitch(), Math.PI - 0.01);
    });

  });

  suite('view limiting', function() {

    test('yaw', function() {
      var view = new RectilinearView(
        { width: 100, height: 100 },
        RectilinearView.limit.yaw(-Math.PI/2, Math.PI/2));
      view.setYaw(-Math.PI/2 - 0.1);
      assert.closeTo(view.yaw(), -Math.PI/2, 0.000001);
      view.setYaw(Math.PI/2 + 0.1);
      assert.closeTo(view.yaw(), Math.PI/2, 0.000001);
    });

    test('pitch', function() {
      var view = new RectilinearView(
        { width: 100, height: 100 },
        RectilinearView.limit.pitch(-Math.PI/2, Math.PI/2));
      view.setPitch(-Math.PI/2 - 0.1);
      assert.strictEqual(view.pitch(), -Math.PI/2);
      view.setPitch(Math.PI/2 + 0.1);
      assert.strictEqual(view.pitch(), Math.PI/2);
    });

    test('hfov', function() {
      var hmin = Math.PI/16, hmax = Math.PI/4;
      var vmin = htov(hmin, 200, 100), vmax = htov(hmax, 200, 100);
      var view = new RectilinearView(
        { width: 200, height: 100 },
        RectilinearView.limit.hfov(hmin, hmax));
      view.setFov(vmin - 0.1);
      assert.strictEqual(view.fov(), vmin);
      view.setFov(vmax + 0.1);
      assert.strictEqual(view.fov(), vmax);
    });

    test('vfov', function() {
      var vmin = Math.PI/16, vmax = Math.PI/4;
      var view = new RectilinearView(
        { width: 100, height: 100 },
        RectilinearView.limit.vfov(vmin, vmax));
      view.setFov(vmin - 0.1);
      assert.strictEqual(view.fov(), vmin);
      view.setFov(vmax + 0.1);
      assert.strictEqual(view.fov(), vmax);
    });

    test('resolution', function() {
      var view = new RectilinearView(
        { width: 512, height: 512 },
        RectilinearView.limit.resolution(2048));
      var minFov = 2 * Math.atan(pixelRatio() * 512 / 2048);
      view.setFov(minFov - 0.1);
      assert.strictEqual(view.fov(), minFov);
    });

    test('enforced on initial parameters', function() {
      var view = new RectilinearView(
        { width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/16 },
        RectilinearView.limit.vfov(Math.PI/8, Math.PI/4));
      assert.strictEqual(view.fov(), Math.PI/8);
    });

    test('replace existing limiter', function() {
      var view = new RectilinearView(
        { width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/16 },
        RectilinearView.limit.vfov(Math.PI/8, Math.PI/4));
      view.setLimiter(RectilinearView.limit.vfov(Math.PI/6, Math.PI/4));
      assert.strictEqual(view.fov(), Math.PI/6);
    });

  });

  suite('projection', function() {

    var newProj, oldProj = mat4.create();

    var view = new RectilinearView({ width: 100, height: 100 });

    test('compute initial', function() {
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on yaw change', function() {
      view.setYaw(Math.PI/3);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on pitch change', function() {
      view.setPitch(Math.PI/3);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on fov change', function() {
      view.setFov(Math.PI/3);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on viewport change', function() {
      view.setSize({ width: 100, height: 150});
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

  });

  suite('selectLevel', function() {

    test('returns level', function() {
      var geometry = new CubeGeometry([512, 1024, 2048].map(function(size) {
        return { size: size, tileSize: 512 };
      }));
      var view = new RectilinearView({ width: 512, height: 512 });
      var lvl = view.selectLevel(geometry.levelList);
      assert.include(geometry.levelList, lvl);
    });

  });

  suite('intersects', function() {

    suite('square viewport', function() {

      var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });

      test('fully visible', function() {
        var rect = [ [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [2, 2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [2, -2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [-2, -2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [-2, 2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible and larger than viewport', function() {
        var rect = [ [-2, 2, -0.5], [2, 2, -0.5], [2, -2, -0.5], [-2, -2, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('invisible above viewport', function() {
        var rect = [ [-0.5, 1.5, -0.5], [0.5, 1.5, -0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible below viewport', function() {
        var rect = [ [-0.5, -1.5, -0.5], [0.5, -1.5, -0.5], [0.5, -1, -0.5], [-0.5, -1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the left of viewport', function() {
        var rect = [ [-1.5, 0.5, -0.5], [-1, 0.5, -0.5], [-1, -0.5, -0.5], [-1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the right of viewport', function() {
        var rect = [ [1.5, 0.5, -0.5], [1, 0.5, -0.5], [1, -0.5, -0.5], [1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('behind camera', function() {
        var rect = [ [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('partially behind camera', function() {
        var rect = [ [0, -0.5, 0.5], [0, 0.5, 0.5], [0, -0.5, -0.5], [0, 0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

    });

    suite('wide viewport', function() {

      var view = new RectilinearView({ width: 200, height: 100, yaw: 0, pitch: 0, fov: Math.PI/4 });

      test('fully visible', function() {
        var rect = [ [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [2, 2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [2, -2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [-2, -2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [-2, 2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible and larger than viewport', function() {
        var rect = [ [-2, 2, -0.5], [2, 2, -0.5], [2, -2, -0.5], [-2, -2, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('invisible above viewport', function() {
        var rect = [ [-0.5, 1.5, -0.5], [0.5, 1.5, -0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible below viewport', function() {
        var rect = [ [-0.5, -1.5, -0.5], [0.5, -1.5, -0.5], [0.5, -1, -0.5], [-0.5, -1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the left of viewport', function() {
        var rect = [ [-1.5, 0.5, -0.5], [-1, 0.5, -0.5], [-1, -0.5, -0.5], [-1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the right of viewport', function() {
        var rect = [ [1.5, 0.5, -0.5], [1, 0.5, -0.5], [1, -0.5, -0.5], [1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('behind camera', function() {
        var rect = [ [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('partially behind camera', function() {
        var rect = [ [0, -0.5, 0.5], [0, 0.5, 0.5], [0, -0.5, -0.5], [0, 0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

    });

    suite('narrow viewport', function() {

      var view = new RectilinearView({ width: 100, height: 200, yaw: 0, pitch: 0, fov: Math.PI/8 });

      test('fully visible', function() {
        var rect = [ [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [2, 2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [2, -2, -0.5], [2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [0, 0, -0.5], [0, -2, -0.5], [-2, -2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [0, 0, -0.5], [0, 2, -0.5], [-2, 2, -0.5], [-2, 0, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible and larger than viewport', function() {
        var rect = [ [-2, 2, -0.5], [2, 2, -0.5], [2, -2, -0.5], [-2, -2, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

      test('invisible above viewport', function() {
        var rect = [ [-0.5, 1.5, -0.5], [0.5, 1.5, -0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible below viewport', function() {
        var rect = [ [-0.5, -1.5, -0.5], [0.5, -1.5, -0.5], [0.5, -1, -0.5], [-0.5, -1, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the left of viewport', function() {
        var rect = [ [-1.5, 0.5, -0.5], [-1, 0.5, -0.5], [-1, -0.5, -0.5], [-1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('invisible to the right of viewport', function() {
        var rect = [ [1.5, 0.5, -0.5], [1, 0.5, -0.5], [1, -0.5, -0.5], [1.5, -0.5, -0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('behind camera', function() {
        var rect = [ [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5] ];
        assert.isFalse(view.intersects(rect));
      });

      test('partially behind camera', function() {
        var rect = [ [0, -0.5, 0.5], [0, 0.5, 0.5], [0, -0.5, -0.5], [0, 0.5, -0.5] ];
        assert.isTrue(view.intersects(rect));
      });

    });

  });

  suite('coordinatesToScreen', function() {

    suite('in general', function() {

      test('writes to result argument', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var result = {};
        var ret = view.coordinatesToScreen({ yaw: 0, pitch: 0 }, result);
        assert.strictEqual(ret, result);
      });

    });

    suite('view looking ahead', function() {

      test('center', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: 0, pitch: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 50, 0.001);
        assert.closeTo(coords.y, 50, 0.001);
      });

      test('top left', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: -Math.PI/16, pitch: -Math.PI/16 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 1.0);
        assert.closeTo(coords.y, 0, 1.0);
      });

      test('bottom right', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: Math.PI/16, pitch: Math.PI/16 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 100, 1.0);
        assert.closeTo(coords.y, 100, 1.0);
      });

      test('offscreen', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: Math.PI/16 + 0.05, pitch: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 113.2, 0.5);
        assert.closeTo(coords.y, 50, 0.5);
      });

      test('behind camera', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = {};
        var ret = view.coordinatesToScreen({ yaw: Math.PI, pitch: 0 }, coords);
        assert.isNull(ret);
        assert.isNull(coords.x);
        assert.isNull(coords.y);
      });

    });

    suite('view looking behind', function() {

      test('center', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: Math.PI, pitch: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 50, 0.001);
        assert.closeTo(coords.y, 50, 0.001);
      });

      test('top left', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: 15*Math.PI/16, pitch: -Math.PI/16 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 1.0);
        assert.closeTo(coords.y, 0, 1.0);
      });

      test('bottom right', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: -15*Math.PI/16, pitch: Math.PI/16 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 100, 1.0);
        assert.closeTo(coords.y, 100, 1.0);
      });

      test('offscreen', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.coordinatesToScreen({ yaw: -15*Math.PI/16 + 0.05, pitch: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 113.2, 0.01);
        assert.closeTo(coords.y, 50, 0.01);
      });

      test('behind camera', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = {};
        var ret = view.coordinatesToScreen({ yaw: 0, pitch: 0 }, coords);
        assert.isNull(ret);
        assert.isNull(coords.x);
        assert.isNull(coords.y);
      });

    });

  });

  suite('screenToCoordinates', function() {

    suite('in general', function() {

      test('writes to result argument', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var result = {};
        var ret = view.screenToCoordinates({ x: 50, y: 50 }, result);
        assert.strictEqual(ret, result);
      });

    });

    suite('view looking ahead', function() {

      test('center', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 50, y: 50 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, 0, 0.001);
        assert.closeTo(coords.pitch, 0, 0.001);
      });

      test('top left', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, -Math.PI/16, 0.001);
        assert.closeTo(coords.pitch, -Math.PI/16, 0.1);
      });

      test('bottom right', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 100, y: 100 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, Math.PI/16, 0.001);
        assert.closeTo(coords.pitch, Math.PI/16, 0.1);
      });

      test('offscreen', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: 0, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 200, y: 200 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, 0.538, 0.01);
        assert.closeTo(coords.pitch, 0.473, 0.01);
      });

    });

    suite('view looking behind', function() {

      test('center', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 50, y: 50 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, Math.PI, 0.001);
        assert.closeTo(coords.pitch, 0, 0.001);
      });

      test('top left', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, 15*Math.PI/16, 0.001);
        assert.closeTo(coords.pitch, -Math.PI/16, 0.1);
      });

      test('bottom right', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 100, y: 100 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, -15*Math.PI/16, 0.001);
        assert.closeTo(coords.pitch, Math.PI/16, 0.1);
      });

      test('offscreen', function() {
        var view = new RectilinearView({ width: 100, height: 100, yaw: Math.PI, pitch: 0, fov: Math.PI/8 });
        var coords = view.screenToCoordinates({ x: 200, y: 200 });
        assert.isNotNull(coords);
        assert.closeTo(coords.yaw, -2.603, 0.001);
        assert.closeTo(coords.pitch, 0.473, 0.001);
      });

    });

  });

});
