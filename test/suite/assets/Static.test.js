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

import { suite, test } from 'vitest';
import { assert as assert } from "chai";
import sinon from "sinon";
sinon.assert.expose(assert, {prefix: ''});

import StaticAsset from "../../../src/assets/Static";

function createTestCanvas(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// TODO: this might need browser environment to test
suite.skip('StaticAsset', function() {

  test('element', function() {
    var img = new Image();
    var asset = new StaticAsset(img);
    assert.strictEqual(asset.element(), img);
  });

  test('image width and height', function(done) {
    var img = new Image(10, 20);
    img.onload = function() {
      var asset = new StaticAsset(img);
      assert.strictEqual(asset.width(), 12);
      assert.strictEqual(asset.height(), 34);
      done();
    };
    img.src = createTestCanvas(12, 34).toDataURL();
  });

  test('canvas width and height', function() {
    var asset = new StaticAsset(createTestCanvas(12, 34));
    assert.strictEqual(asset.width(), 12);
    assert.strictEqual(asset.height(), 34);
  });

  test('isDynamic', function() {
    var img = new Image();
    var asset = new StaticAsset(img);
    assert.isFalse(asset.isDynamic());
  });

  test('timestamp', function() {
    var img = new Image();
    var asset = new StaticAsset(img);
    assert.strictEqual(asset.timestamp(), 0);
  });

});
