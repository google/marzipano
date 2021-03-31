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

var real = require('../../../src/util/real');

var tab = [
  [ 0, true ],
  [ 1, true ],
  [ -1, true ],
  [ NaN, false ],
  [ Infinity, false ],
  [ -Infinity, false ]
];

suite('real', function() {

  test('real', function() {
    for (var i = 0; i < tab.length; i++) {
      var val = tab[i][0], ret = tab[i][1];
      assert.strictEqual(real(val), ret);
    }
  });

});
