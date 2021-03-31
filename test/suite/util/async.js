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

var async = require('../../../src/util/async');

var error = new Error('err');

function twice(x) {
  return 2*x;
}

function fail() {
  throw error;
}

suite('async', function() {

  test('success', function() {
    var fn = async(twice.bind(null, 2));
    var spy = sinon.spy();
    fn(spy);
    assert.isTrue(spy.calledOnce);
    assert.isTrue(spy.calledWithExactly(null, 4));
  });

  test('failure', function() {
    var fn = async(fail);
    var spy = sinon.spy();
    fn(spy);
    assert.isTrue(spy.calledOnce);
    assert.isTrue(spy.calledWithExactly(error));
  });

});
