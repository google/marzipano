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

// Common tests for WorkQueue and WorkPool.

import { suite, test, assert } from 'vitest';
import sinon from "sinon";
import wait from "../../wait";

import defer from "../../../src/util/defer";
import cancelize from "../../../src/util/cancelize";

function returnSync(returnValue) {
  return cancelize(function(done) {
    done(returnValue);
  });
}

function returnAsync(returnValue) {
  return cancelize(function(done) {
    defer(function() {
      done(returnValue);
    });
  });
}

function runTests(name, cls) {

  suite(name, function() {

    test('one sync', function(done) {
      var q = new cls();
      var spy = sinon.spy();
      q.push(returnSync(1), spy);
      wait.untilSpyCalled(spy, function() {
        assert.isTrue(spy.calledWithExactly(1));
        done();
      });
    });

    test('one async', function(done) {
      var q = new cls();
      var spy = sinon.spy();
      q.push(returnAsync(1), spy);
      wait.untilSpyCalled(spy, function() {
        assert.isTrue(spy.calledWithExactly(1));
        done();
      });
    });

    test('two sync', function(done) {
      var q = new cls();
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      q.push(returnSync(1), spy1);
      q.push(returnSync(2), spy2);
      wait.untilSpyCalled(spy1, spy2, function() {
        assert.isTrue(spy1.calledWithExactly(1));
        assert.isTrue(spy2.calledWithExactly(2));
        done();
      });
    });

    test('two async', function(done) {
      var q = new cls();
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      q.push(returnAsync(1), spy1);
      q.push(returnAsync(2), spy2);
      wait.untilSpyCalled(spy1, spy2, function() {
        assert.isTrue(spy1.calledWithExactly(1));
        assert.isTrue(spy2.calledWithExactly(2));
        done();
      });
    });

    test('one sync, one async', function(done) {
      var q = new cls();
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      q.push(returnSync(1), spy1);
      q.push(returnAsync(2), spy2);
      wait.untilSpyCalled(spy1, spy2, function() {
        assert.isTrue(spy1.calledWithExactly(1));
        assert.isTrue(spy2.calledWithExactly(2));
        done();
      });
    });

    test('one async, one sync', function(done) {
      var q = new cls();
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      q.push(returnAsync(1), spy1);
      q.push(returnSync(2), spy2);
      wait.untilSpyCalled(spy1, spy2, function() {
        assert.isTrue(spy1.calledWithExactly(1));
        assert.isTrue(spy2.calledWithExactly(2));
        done();
      });
    });

    test('cancel', function(done) {
      var q = new cls();
      var spy = sinon.spy();
      var cancel = q.push(returnAsync(1), spy);
      cancel('err');
      wait.untilSpyCalled(spy, function() {
        assert.isTrue(spy.calledWithExactly('err'));
        done();
      });
    });

    test('pause and resume', function(done) {
      var q = new cls();
      var spy = sinon.spy();
      q.pause();
      q.push(returnSync(1), spy);
      setTimeout(function() {
        assert.isTrue(spy.notCalled);
        q.resume();
        wait.untilSpyCalled(spy, function() {
          assert.isTrue(spy.calledWithExactly(1));
          done();
        });
      }, 20);
    });
  });

}

module.exports = runTests;
