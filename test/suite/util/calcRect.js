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

var calcRect = require('../../../src/util/calcRect');

suite('calcRect', function() {

  test('null', function() {
    var rect = calcRect(1, 1, null);
    assert.deepEqual(rect, {x: 0, y: 0, width: 1, height: 1});
  });

  test('relative offset', function() {
    var rect = calcRect(100, 200, { relativeX: 0.1, relativeY: 0.2 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 1, height: 1});
  });

  test('relative size', function() {
    var rect = calcRect(100, 200, { relativeWidth: 0.25, relativeHeight: 0.75 });
    assert.deepEqual(rect, {x: 0, y: 0, width: 0.25, height: 0.75});
  });

  test('relative offset and size', function() {
    var rect = calcRect(100, 200,
      { relativeX: 0.1, relativeY: 0.2,
        relativeWidth: 0.25, relativeHeight: 0.75 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 0.25, height: 0.75});
  });

  test('absolute offset', function() {
    var rect = calcRect(100, 200, { absoluteX: 10, absoluteY: 40 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 1, height: 1});
  });

  test('absolute size', function() {
    var rect = calcRect(100, 200, { absoluteWidth: 20, absoluteHeight: 50 });
    assert.deepEqual(rect, {x: 0, y: 0, width: 0.2, height: 0.25});
  });

  test('absolute offset and size', function() {
    var rect = calcRect(100, 200,
      { absoluteX: 10, absoluteY: 40,
        absoluteWidth: 20, absoluteHeight: 50 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 0.2, height: 0.25});
  });

  test('relative offset absolute size', function() {
    var rect = calcRect(100, 200,
      { relativeX: 0.1, relativeY: 0.2,
        absoluteWidth: 20, absoluteHeight: 50 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 0.2, height: 0.25});
  });

  test('absolute offset relative size', function() {
    var rect = calcRect(100, 200,
      { absoluteX: 10, absoluteY: 40,
        relativeWidth: 0.25, relativeHeight: 0.75 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 0.25, height: 0.75});
  });

  test('absolute overrides relative', function() {
    var rect = calcRect(100, 200,
      { absoluteX: 10, absoluteY: 40,
        absoluteWidth: 20, absoluteHeight: 50,
        relativeX: 0.12, relativeY: 0.34,
        relativeWidth: 0.56, relativeHeight: 0.78 });
    assert.deepEqual(rect, {x: 0.1, y: 0.2, width: 0.2, height: 0.25});
  });

});
