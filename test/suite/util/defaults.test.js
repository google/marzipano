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

import defaults from "../../../src/util/defaults";

suite('defaults', function() {

  test('defaults', function() {
    var originalObj = { foo: 42, bar: 37 };
    var defaultsObj = { foo: 100, quux: 200 };
    var expectedObj = { foo: 42, bar: 37, quux: 200 };
    var resultObj = defaults(originalObj, defaultsObj);
    assert.deepEqual(resultObj, expectedObj);
  });

});
