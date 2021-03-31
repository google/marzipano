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

var compose = require('../../../src/util/compose');

function twice(x) {
  return 2*x;
}

function square(x) {
  return x*x;
}

suite('compose', function() {

  test('zero', function() {
    var fn = compose();
    assert.strictEqual(fn(42), 42);
  });

  test('one', function() {
    var fn = compose(twice);
    assert.strictEqual(fn(42), 84);
  });

  test('two', function() {
    var fn = compose(twice, square);
    assert.strictEqual(fn(4), 64);
  });

});
