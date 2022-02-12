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

import convertFov from "../../../src/util/convertFov";

suite('convertFov', function() {

  test('htov', function() {

    var htov = convertFov.htov;

    var testMatrix = [
      { width: 100, height: 100, hfov: 1, vfov: 1 },
      { width: 200, height: 100, hfov: 1, vfov: 2 * Math.atan(0.5 * Math.tan(0.5)) },
      { width: 100, height: 200, hfov: 1, vfov: 2 * Math.atan(2 * Math.tan(0.5)) },
      { width: 100, height: 100, hfov: 2, vfov: 2 },
      { width: 200, height: 100, hfov: 2, vfov: 2 * Math.atan(0.5 * Math.tan(1)) },
      { width: 100, height: 200, hfov: 2, vfov: 2 * Math.atan(2 * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(htov(t.hfov, t.width, t.height), t.vfov, 0.00000001);
    }

  });

  test('htod', function() {

    var htod = convertFov.htod;

    var testMatrix = [
      { width: 100, height: 100, hfov: 1, dfov: 2 * Math.atan(Math.sqrt(2) * Math.tan(0.5)) },
      { width: 200, height: 100, hfov: 1, dfov: 2 * Math.atan(0.5*Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 200, hfov: 1, dfov: 2 * Math.atan(Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 100, hfov: 2, dfov: 2 * Math.atan(Math.sqrt(2) * Math.tan(1)) },
      { width: 200, height: 100, hfov: 2, dfov: 2 * Math.atan(0.5*Math.sqrt(5) * Math.tan(1)) },
      { width: 100, height: 200, hfov: 2, dfov: 2 * Math.atan(Math.sqrt(5) * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(htod(t.hfov, t.width, t.height), t.dfov, 0.00000001);
    }

  });

  test('vtoh', function() {

    var vtoh = convertFov.vtoh;

    var testMatrix = [
      { width: 100, height: 100, vfov: 1, hfov: 1 },
      { width: 200, height: 100, vfov: 1, hfov: 2 * Math.atan(2 * Math.tan(0.5)) },
      { width: 100, height: 200, vfov: 1, hfov: 2 * Math.atan(0.5 * Math.tan(0.5)) },
      { width: 100, height: 100, vfov: 2, hfov: 2 },
      { width: 200, height: 100, vfov: 2, hfov: 2 * Math.atan(2 * Math.tan(1)) },
      { width: 100, height: 200, vfov: 2, hfov: 2 * Math.atan(0.5 * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(vtoh(t.vfov, t.width, t.height), t.hfov, 0.00000001);
    }

  });

  test('vtod', function() {

    var vtod = convertFov.vtod;

    var testMatrix = [
      { width: 100, height: 100, vfov: 1, dfov: 2 * Math.atan(Math.sqrt(2) * Math.tan(0.5)) },
      { width: 200, height: 100, vfov: 1, dfov: 2 * Math.atan(Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 200, vfov: 1, dfov: 2 * Math.atan(0.5*Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 100, vfov: 2, dfov: 2 * Math.atan(Math.sqrt(2) * Math.tan(1)) },
      { width: 200, height: 100, vfov: 2, dfov: 2 * Math.atan(Math.sqrt(5) * Math.tan(1)) },
      { width: 100, height: 200, vfov: 2, dfov: 2 * Math.atan(0.5*Math.sqrt(5) * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(vtod(t.vfov, t.width, t.height), t.dfov, 0.00000001);
    }

  });

  test('dtoh', function() {

    var dtoh = convertFov.dtoh;

    var testMatrix = [
      { width: 100, height: 100, dfov: 1, hfov: 2 * Math.atan(1/Math.sqrt(2) * Math.tan(0.5)) },
      { width: 200, height: 100, dfov: 1, hfov: 2 * Math.atan(2/Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 200, dfov: 1, hfov: 2 * Math.atan(1/Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 100, dfov: 2, hfov: 2 * Math.atan(1/Math.sqrt(2) * Math.tan(1)) },
      { width: 200, height: 100, dfov: 2, hfov: 2 * Math.atan(2/Math.sqrt(5) * Math.tan(1)) },
      { width: 100, height: 200, dfov: 2, hfov: 2 * Math.atan(1/Math.sqrt(5) * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(dtoh(t.dfov, t.width, t.height), t.hfov, 0.00000001);
    }

  });

  test('dtov', function() {

    var dtov = convertFov.dtov;

    var testMatrix = [
      { width: 100, height: 100, dfov: 1, vfov: 2 * Math.atan(1/Math.sqrt(2) * Math.tan(0.5)) },
      { width: 200, height: 100, dfov: 1, vfov: 2 * Math.atan(1/Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 200, dfov: 1, vfov: 2 * Math.atan(2/Math.sqrt(5) * Math.tan(0.5)) },
      { width: 100, height: 100, dfov: 2, vfov: 2 * Math.atan(1/Math.sqrt(2) * Math.tan(1)) },
      { width: 200, height: 100, dfov: 2, vfov: 2 * Math.atan(1/Math.sqrt(5) * Math.tan(1)) },
      { width: 100, height: 200, dfov: 2, vfov: 2 * Math.atan(2/Math.sqrt(5) * Math.tan(1)) }
    ];

    for (var i = 0; i < testMatrix.length; i++) {
      var t = testMatrix[i];
      assert.closeTo(dtov(t.dfov, t.width, t.height), t.vfov, 0.00000001);
    }

  });

});
