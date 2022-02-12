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

import retry from "../../../src/util/retry";
import defer from "../../../src/util/defer";
import cancelize from "../../../src/util/cancelize";

var error = new Error('err');

function flaky(nfail) {
  return function fn(x, done) {
    if (nfail--) {
      defer(function() {
        done(true);
      });
    } else {
      defer(function() {
        done(null, 2*x);
      });
    }
  };
}

suite('retry', function() {

  test('zero failures', function(done) {
    var spy = sinon.spy();
    var fn = retry(cancelize(flaky(0)));
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledOnce);
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

  test('one failure', function(done) {
    var spy = sinon.spy();
    var fn = retry(cancelize(flaky(1)));
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledOnce);
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

  test('two failures', function(done) {
    var spy = sinon.spy();
    var fn = retry(cancelize(flaky(2)));
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledOnce);
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

  test('cancel', function(done) {
    var spy = sinon.spy();
    var fn = retry(cancelize(flaky(0)));
    var cancel = fn(2, spy);
    cancel(error);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledOnce);
      assert.isTrue(spy.calledWithExactly(error));
      done();
    });
  });

});
