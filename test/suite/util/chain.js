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
var sinon = require('sinon');
var wait = require('../../wait');

var chain = require('../../../src/util/chain');
var cancelize = require('../../../src/util/cancelize');

var error = new Error('err');

var noop = function() {};

function twiceSync(x, done) {
  done(null, 2*x);
}

function twiceAsync(x, done) {
  setTimeout(function() {
    done(null, 2*x);
  }, 0);
  return noop;
}

function squareSync(x, done) {
  done(null, x*x);
  return noop;
}

function squareAsync(x, done) {
  setTimeout(function() {
    done(null, x*x);
  }, 0);
  return noop;
}

function succeed(done) {
  setTimeout(function() {
    done(null, 42);
  }, 0);
  return noop;
}

function fail(x, done) {
  setTimeout(function() {
    done(error);
  }, 0);
  return noop;
}

suite('chain', function() {

  test('zero', function() {
    var fn = chain();
    var spy = sinon.spy();
    fn(1, 2, 3, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 1, 2, 3));
    });
  });

  test('one async', function(done) {
    var fn = chain(twiceAsync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

  test('two async', function(done) {
    var fn = chain(twiceAsync, squareAsync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 16));
      done();
    });
  });

  test('one sync', function(done) {
    var fn = chain(twiceSync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 4));
      done();
    });
  });

  test('two sync', function(done) {
    var fn = chain(twiceSync, squareSync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 16));
      done();
    });
  });

  test('one sync, one async', function(done) {
    var fn = chain(twiceSync, squareAsync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 16));
      done();
    });
  });

  test('one async, one sync', function(done) {
    var fn = chain(twiceAsync, squareSync);
    var spy = sinon.spy();
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(spy.calledWithExactly(null, 16));
      done();
    });
  });

  test('error aborts chain', function(done) {
    var spy = sinon.spy();
    var neverCalledSpy = sinon.spy(succeed);
    var fn = chain(fail, neverCalledSpy);
    fn(2, spy);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(neverCalledSpy.notCalled);
      assert.isTrue(spy.calledWithExactly(error));
      done();
    });
  });

  test('cancel aborts chain', function(done) {
    var spy = sinon.spy();
    var neverCalledSpy = sinon.spy(succeed);
    var fn = chain(cancelize(twiceAsync), neverCalledSpy);
    var cancel = fn(2, spy);
    cancel(error);
    wait.untilSpyCalled(spy, function() {
      assert.isTrue(neverCalledSpy.notCalled);
      assert.isTrue(spy.calledWithExactly(error));
      done();
    });
  });

});
