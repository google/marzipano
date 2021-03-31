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

var ispot = require('../../../src/util/ispot');

suite('ispot', function() {

  test('ispot', function() {
    var powersOfTwo = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
    for (var i = 0; i < powersOfTwo.length; i++) {
      assert.isTrue(ispot(powersOfTwo[i]));
    }
    var nonPowersOfTwo = [3, 5, 6, 10, 15, 33];
    for (var i = 0; i < nonPowersOfTwo.length; i++) {
      assert.isFalse(ispot(nonPowersOfTwo[i]));
    }
  });

});
