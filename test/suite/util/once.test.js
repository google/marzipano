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

import once from "../../../src/util/once";

function twice(x) {
  return 2*x;
}

suite('once', function() {

  test('does not call a second time', function() {
    var spy = sinon.spy(twice);
    var fn = once(spy);
    assert.strictEqual(fn(2), 4);
    assert.strictEqual(fn(3), 4);
    assert.isTrue(spy.calledOnce);
  });

});
