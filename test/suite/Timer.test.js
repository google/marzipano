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

import Timer from "../../src/Timer";
import now from "../../src/util/now";
import defer from "../../src/util/defer";
import wait from "../wait";

suite('Timer', function() {

  test('start', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 50});
    timer.addEventListener('timeout', spy);

    var timeBefore = now();
    assert.isFalse(timer.started());
    timer.start();
    assert.isTrue(timer.started());

    wait.untilSpyCalled(spy, function() {
      var timeAfter = now();
      assert.isFalse(timer.started());
      assert.isAtLeast(timeAfter - timeBefore, 50);
      done();
    });
  });

  test('stop', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 10});
    timer.addEventListener('timeout', spy);

    assert.isFalse(timer.started());
    timer.start();
    assert.isTrue(timer.started());
    timer.stop();
    assert.isFalse(timer.started());

    setTimeout(function() {
      assert.isTrue(spy.notCalled);
      done();
    }, 50);
  });

  test('reset', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 100});
    timer.addEventListener('timeout', spy);

    var timeBefore = now();
    timer.start();

    setTimeout(function() {
      assert.isTrue(spy.notCalled);
      timer.start();
    }, 50);

    wait.untilSpyCalled(spy, function() {
      var timeAfter = now();
      assert.isFalse(timer.started());
      assert.isAtLeast(timeAfter - timeBefore, 150);
      done();
    });
  });

  test('set duration after start with infinity', function(done) {
    var spy = sinon.spy();
    var timer = new Timer();
    timer.addEventListener('timeout', spy);

    var timeBefore = now();
    timer.start();

    defer(function() {
      timer.setDuration(50);
    });

    wait.untilSpyCalled(spy, function() {
      var timeAfter = now();
      assert.isAtLeast(timeAfter - timeBefore, 50);
      done();
    });
  });

  test('set duration when stopped', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 50});
    timer.addEventListener('timeout', spy);

    assert.strictEqual(timer.duration(), 50);
    timer.setDuration(100);
    assert.strictEqual(timer.duration(), 100);

    var timeBefore = now();
    timer.start();

    wait.untilSpyCalled(spy, function() {
      var timeAfter = now();
      assert.isAtLeast(timeAfter - timeBefore, 100);
      done();
    });
  });

  test('increase duration when started', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 50});
    timer.addEventListener('timeout', spy);

    var timeBefore = now();
    timer.start();

    defer(function() {
      timer.setDuration(100);
    });

    wait.untilSpyCalled(spy, function() {
      var timeAfter = now();
      assert.isAtLeast(timeAfter - timeBefore, 100);
      done();
    });
  });

  test('decrease duration when started', function(done) {
    var spy = sinon.spy();
    var timer = new Timer({duration: 100});
    timer.addEventListener('timeout', spy);

    timer.start();

    setTimeout(function() {
      assert.isTrue(spy.notCalled);
      timer.setDuration(10);
      assert.isTrue(spy.calledOnce);
      done();
    }, 50);
  });

});
