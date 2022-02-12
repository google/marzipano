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

import cancelize from "../../../src/util/cancelize";

var error = new Error('err');

var noop = function() {};

function twice(x, done) {
  setTimeout(function() {
    done(null, 2*x);
  }, 0);
  return noop;
}

suite('cancelize', function() {

  test('cancel', function(done) {
    var fn = cancelize(twice);
    var spy = sinon.spy();
    var cancel = fn(2, spy);
    cancel(error);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(error));
      done();
    });
  });

  test('no cancel', function(done) {
    var fn = cancelize(twice);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

});
