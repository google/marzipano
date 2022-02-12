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

import { suite, test, assert } from 'vitest';

import FlatView from "../../../src/views/Flat";
import FlatGeometry from "../../../src/geometries/Flat";
import { mat4 as mat4 } from "gl-matrix";
import pixelRatio from "../../../src/util/pixelRatio";

suite('FlatView', function() {

  suite('constructor', function() {

    test('sets default parameters', function() {
      var view = new FlatView({ mediaAspectRatio: 1 });
      assert.strictEqual(view.x(), 0.5);
      assert.strictEqual(view.y(), 0.5);
      assert.strictEqual(view.zoom(), 1.0);
    });

  });

  suite('getters/setters', function() {

    test('x', function() {
      var view = new FlatView({ mediaAspectRatio: 1 });
      view.setX(1.234);
      assert.strictEqual(view.x(), 1.234);
    });

    test('y', function() {
      var view = new FlatView({ mediaAspectRatio: 1 });
      view.setY(1.234);
      assert.strictEqual(view.y(), 1.234);
    });

    test('zoom', function() {
      var view = new FlatView({ mediaAspectRatio: 1 });
      view.setZoom(1.234);
      assert.strictEqual(view.zoom(), 1.234);
    });

    test('size', function() {
      var view = new FlatView({ mediaAspectRatio: 1 });
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

  suite('view limiting', function() {

    test('x', function() {
      var view = new FlatView(
        { width: 100, height: 100, mediaAspectRatio: 1 },
        FlatView.limit.x(0.25, 0.75));
      view.setX(0.2);
      assert.strictEqual(view.x(), 0.25);
      view.setX(0.8);
      assert.strictEqual(view.x(), 0.75);
    });

    test('y', function() {
      var view = new FlatView(
        { width: 100, height: 100, mediaAspectRatio: 1 },
        FlatView.limit.y(0.25, 0.75));
      view.setY(0.2);
      assert.strictEqual(view.y(), 0.25);
      view.setY(0.8);
      assert.strictEqual(view.y(), 0.75);
    });

    test('zoom', function() {
      var view = new FlatView(
        { width: 100, height: 100, mediaAspectRatio: 1 },
        FlatView.limit.zoom(0.5, 2));
      view.setZoom(0.4);
      assert.strictEqual(view.zoom(), 0.5);
      view.setZoom(2.1);
      assert.strictEqual(view.zoom(), 2);
    });

    test('resolution', function() {
      var view = new FlatView(
        { width: 512, height: 512, mediaAspectRatio: 1 },
        FlatView.limit.resolution(2048));
      var minZoom = pixelRatio() * 512 / 2048;
      view.setZoom(minZoom - 0.1);
      assert.strictEqual(view.zoom(), minZoom);
    });

    test('visibleX', function() {
      var view = new FlatView(
        { width: 100, height: 100, mediaAspectRatio: 1 },
        FlatView.limit.visibleX(0.25, 0.75));
      view.setZoom(0.6);
      assert.strictEqual(view.zoom(), 0.5);
      view.setX(0.4);
      assert.strictEqual(view.x(), 0.5);
    });

    test('visibleY', function() {
      var view = new FlatView(
        { width: 100, height: 100, mediaAspectRatio: 1 },
        FlatView.limit.visibleY(0.25, 0.75));
      view.setZoom(0.6);
      assert.strictEqual(view.zoom(), 0.5);
      view.setY(0.4);
      assert.strictEqual(view.y(), 0.5);
    });

    suite('letterbox', function() {

      test('square image square viewport', function() {
        var view = new FlatView(
          { width: 100, height: 100, mediaAspectRatio: 1 },
          FlatView.limit.letterbox());
        view.setZoom(1.1);
        assert.strictEqual(view.zoom(), 1.0);
      });

      test('square image on narrow viewport', function() {
        var view = new FlatView(
          { width: 100, height: 200, mediaAspectRatio: 1 },
          FlatView.limit.letterbox());
        view.setZoom(1.1);
        assert.strictEqual(view.zoom(), 1.0);
      });

      test('square image on wide viewport', function() {
        var view = new FlatView(
          { width: 200, height: 100, mediaAspectRatio: 1 },
          FlatView.limit.letterbox());
        view.setZoom(2.1);
        assert.strictEqual(view.zoom(), 2.0);
      });

      test('non-square image narrower than viewport', function() {
        var view = new FlatView(
          { width: 100, height: 100, mediaAspectRatio: 0.5 },
          FlatView.limit.letterbox());
        view.setZoom(2.1);
        assert.strictEqual(view.zoom(), 2.0);
      });

      test('non-square image wider than viewport', function() {
        var view = new FlatView(
          { width: 100, height: 100, mediaAspectRatio: 2 },
          FlatView.limit.letterbox());
        view.setZoom(1.1);
        assert.strictEqual(view.zoom(), 1.0);
      });

    });

    test('enforced on initial parameters', function() {
      var view = new FlatView(
        { width: 100, height: 100, yaw: 0, pitch: 0, zoom: 0.25, mediaAspectRatio: 1 },
        FlatView.limit.zoom(0.5, 1));
      assert.strictEqual(view.zoom(), 0.5);
    });

    test('replace existing limiter', function() {
      var view = new FlatView(
        { width: 100, height: 100, yaw: 0, pitch: 0, zoom: 0.25, mediaAspectRatio: 1 },
        FlatView.limit.zoom(0.5, 1));
      view.setLimiter(FlatView.limit.zoom(0.75, 1));
      assert.strictEqual(view.zoom(), 0.75);
    });

  });

  suite('projection', function() {

    var newProj, oldProj = mat4.create();

    var view = new FlatView({ width: 100, height: 100, mediaAspectRatio: 1 });

    test('compute initial', function() {
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on x change', function() {
      view.setX(0.1);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on y change', function() {
      view.setY(0.1);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on zoom change', function() {
      view.setZoom(0.1);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on media aspect ratio change', function() {
      view.setMediaAspectRatio(0.5);
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

    test('update on viewport change', function() {
      view.setSize({ width: 100, height: 150 });
      newProj = view.projection();
      assert.notDeepEqual(newProj, oldProj);
      mat4.copy(oldProj, newProj);
    });

  });

  suite('selectLevel', function() {

    test('returns level', function() {
      var geometry = new FlatGeometry([512, 1024, 2048].map(function(size) {
        return { width: size, height: size, tileWidth: 512, tileHeight: 512 };
      }));
      var view = new FlatView({ width: 512, height: 512, mediaAspectRatio: 1 });
      var lvl = view.selectLevel(geometry.levelList);
      assert.include(geometry.levelList, lvl);
    });

  });

  suite('intersects', function() {

    suite('square viewport', function() {

      var view = new FlatView({ mediaAspectRatio: 1, width: 512, height: 512, x: 0.5, y: 0.5, zoom: 1.0 });

      test('fully visible', function() {
        var rect = [ [-0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0.25, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0.25, 0.25], [0.25, 0.75], [0.75, 0.75], [0.75, 0.25] ];
        assert(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0.25, -0.25], [0.25, -0.75], [0.75, -0.75], [0.75, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [-0.25, -0.25], [-0.25, -0.75], [-0.75, -0.75], [-0.75, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [-0.25, 0.25], [-0.25, 0.75], [-0.75, 0.75], [-0.75, 0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('above viewport', function() {
        var rect = [ [-0.25, 0.75], [-0.25, 1.25], [0.25, 1.25], [0.25, 0.75] ];
        assert.isFalse(view.intersects(rect));
      });

      test('below viewport', function() {
        var rect = [ [-0.25, -0.75], [-0.25, -1.25], [0.25, -1.25], [0.25, -0.75] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the left of viewport', function() {
        var rect = [ [-1.25, -0.25], [-1.25, 0.25], [-0.75, 0.25], [-0.75, -0.25] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the right of viewport', function() {
        var rect = [ [1.25, -0.25], [1.25, 0.25], [0.75, 0.25], [0.75, -0.25] ];
        assert.isFalse(view.intersects(rect));
      });

    });

    suite('wide viewport', function() {

      var view = new FlatView({ width: 200, height: 100, x: 0.5, y: 0.5, zoom: 1.0, mediaAspectRatio: 1 });

      test('fully visible', function() {
        var rect = [ [-0.25, -0.10], [-0.25, 0.10], [0.25, 0.10], [0.25, -0.10] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0.25, 0.10], [0.25, 0.40], [0.75, 0.40], [0.75, 0.10] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0.25, -0.10], [0.25, -0.40], [0.75, -0.40], [0.75, -0.10] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [-0.25, -0.10], [-0.25, -0.40], [-0.75, -0.40], [-0.75, -0.10] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [-0.25, 0.10], [-0.25, 0.40], [-0.75, 0.40], [-0.75, 0.10] ];
        assert.isTrue(view.intersects(rect));
      });

      test('above viewport', function() {
        var rect = [ [-0.25, 0.40], [-0.25, 0.70], [0.25, 0.70], [0.25, 0.40] ];
        assert.isFalse(view.intersects(rect));
      });

      test('below viewport', function() {
        var rect = [ [-0.25, -0.40], [-0.25, -0.70], [0.25, -0.70], [0.25, -0.40] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the left of viewport', function() {
        var rect = [ [-1.25, -0.10], [-1.25, 0.10], [-0.75, 0.10], [-0.75, -0.10] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the right of viewport', function() {
        var rect = [ [1.25, -0.10], [1.25, 0.10], [0.75, 0.10], [0.75, -0.10] ];
        assert.isFalse(view.intersects(rect));
      });

    });

    suite('narrow viewport', function() {

      var view = new FlatView({ width: 100, height: 200, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });

      test('fully visible', function() {
        var rect = [ [-0.10, -0.25], [-0.10, 0.25], [0.10, 0.25], [0.10, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top right', function() {
        var rect = [ [0.10, 0.25], [0.10, 0.75], [0.40, 0.75], [0.40, 0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom right', function() {
        var rect = [ [0.10, -0.25], [0.10, -0.75], [0.40, -0.75], [0.40, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to bottom left', function() {
        var rect = [ [-0.10, -0.25], [-0.10, -0.75], [-0.40, -0.75], [-0.40, -0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('partially visible extending to top left', function() {
        var rect = [ [-0.10, 0.25], [-0.10, 0.75], [-0.40, 0.75], [-0.40, 0.25] ];
        assert.isTrue(view.intersects(rect));
      });

      test('above viewport', function() {
        var rect = [ [-0.10, 0.75], [-0.10, 1.25], [0.10, 1.25], [0.10, 0.75] ];
        assert.isFalse(view.intersects(rect));
      });

      test('below viewport', function() {
        var rect = [ [-0.10, -0.75], [-0.10, -1.25], [0.10, -1.25], [0.10, -0.75] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the left of viewport', function() {
        var rect = [ [-0.70, -0.25], [-0.70, 0.25], [-0.40, 0.25], [-0.40, -0.25] ];
        assert.isFalse(view.intersects(rect));
      });

      test('to the right of viewport', function() {
        var rect = [ [0.70, -0.25], [0.70, 0.25], [0.40, 0.25], [0.40, -0.25] ];
        assert.isFalse(view.intersects(rect));
      });

    });

  });

  suite('coordinatesToScreen', function() {

    suite('in general', function() {

      test('writes to result argument', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var result = {};
        var ret = view.coordinatesToScreen({ x: 0.5, y: 0.5 }, result);
        assert.strictEqual(ret, result);
      });

    });

    suite('view centered on center', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0.5, y: 0.5 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 50, 0.001);
        assert.closeTo(coords.y, 50, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0.25, y: 0.25 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 0.001);
        assert.closeTo(coords.y, 0, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0.75, y: 0.75 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 100, 0.001);
        assert.closeTo(coords.y, 100, 0.001);
      });

    });

    suite('view centered on top left corner', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 50, 0.001);
        assert.closeTo(coords.y, 50, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: -0.25, y: -0.25 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 0.001);
        assert.closeTo(coords.y, 0, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0.25, y: 0.25 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 100, 0.001);
        assert.closeTo(coords.y, 100, 0.001);
      });

    });

    suite('view centered on bottom right corner', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 1, y: 1 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 50, 0.001);
        assert.closeTo(coords.y, 50, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 0.75, y: 0.75 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 0.001);
        assert.closeTo(coords.y, 0, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.coordinatesToScreen({ x: 1.25, y: 1.25 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 100, 0.001);
        assert.closeTo(coords.y, 100, 0.001);
      });

    });

  });

  suite('screenToCoordinates', function() {

    suite('in general', function() {

      test('writes to result argument', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var result = {};
        var ret = view.screenToCoordinates({ x: 50, y: 50 }, result);
        assert.strictEqual(ret, result);
      });

    });

    suite('view centered on center', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 50, y: 50 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0.5, 0.001);
        assert.closeTo(coords.y, 0.5, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0.25, 0.001);
        assert.closeTo(coords.y, 0.25, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0.5, y: 0.5, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 100, y: 100 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0.75, 0.001);
        assert.closeTo(coords.y, 0.75, 0.001);
      });

    });

    suite('view centered on top left corner', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 50, y: 50 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0, 0.001);
        assert.closeTo(coords.y, 0, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, -0.25, 0.001);
        assert.closeTo(coords.y, -0.25, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 0, y: 0, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 100, y: 100 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0.25, 0.001);
        assert.closeTo(coords.y, 0.25, 0.001);
      });

    });

    suite('view centered on bottom right corner', function() {

      test('center', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 50, y: 50 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 1, 0.001);
        assert.closeTo(coords.y, 1, 0.001);
      });

      test('top left', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 0, y: 0 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 0.75, 0.001);
        assert.closeTo(coords.y, 0.75, 0.001);
      });

      test('bottom right', function() {
        var view = new FlatView({ width: 100, height: 100, x: 1, y: 1, zoom: 0.5, mediaAspectRatio: 1 });
        var coords = view.screenToCoordinates({ x: 100, y: 100 });
        assert.isNotNull(coords);
        assert.closeTo(coords.x, 1.25, 0.001);
        assert.closeTo(coords.y, 1.25, 0.001);
      });

    });

  });

});
