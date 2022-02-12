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

import decimal from "../../../src/util/decimal";

var tab = [
  [ 0, '0.00000000000000' ],
  [ 1, '1.00000000000000' ],
  [ -1, '-1.00000000000000' ],
  [ 0.123456789012345, '0.123456789012345' ]
];

suite('decimal', function() {

  test('decimal', function() {
    for (var i = 0; i < tab.length; i++) {
      var a = tab[i][0], b = tab[i][1];
      assert.strictEqual(decimal(a), b);
    }
  });

});
