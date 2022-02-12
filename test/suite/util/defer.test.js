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
import wait from "../../wait";

import defer from "../../../src/util/defer";

suite('defer', function() {

  test('without arguments', function(done) {
    var spy = sinon.spy();
    defer(spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly());
      done();
    });
  });

  test('with arguments', function(done) {
    var spy = sinon.spy();
    defer(spy, [1, 2, 3]);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(1, 2, 3));
      done();
    });
  });

});
