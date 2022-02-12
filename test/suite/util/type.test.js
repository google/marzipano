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

import type from "../../../src/util/type";

suite('type', function() {

  test('undefined', function() {
    assert.strictEqual(type(undefined), 'undefined');
  });

  test('null', function() {
    assert.strictEqual(type(null), 'null');
  });

  test('number', function() {
    assert.strictEqual(type(0), 'number');
  });

  test('boolean', function() {
    assert.strictEqual(type(false), 'boolean');
  });

  test('array', function() {
    assert.strictEqual(type([]), 'array');
  });

  test('object', function() {
    assert.strictEqual(type({}), 'object');
  });

  test('function', function() {
    assert.strictEqual(type(function(){}), 'function');
  });

  test('regexp', function() {
    assert.strictEqual(type(/.*/), 'regexp');
  });

});
