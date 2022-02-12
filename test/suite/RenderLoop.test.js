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

import { suite, test, beforeEach, afterEach, assert } from 'vitest';
import sinon from "sinon";

import eventEmitter from "minimal-event-emitter";

import RenderLoop from "../../src/RenderLoop";

class MockStage {
  constructor() {
    this.render = sinon.spy();
  }
}

eventEmitter(MockStage);

suite('RenderLoop', function() {

  // Replace requestAnimationFrame() and cancelAnimationFrame() with fakes so
  // that the tests still pass when the browser window has no focus. As a side
  // effect, it also makes the tests less flaky since no timeouts are involved.
  //
  // Note that the fakes don't observe the spec fully: no timestamp argument is
  // passed to the registered callback (because we have no need for it).

  var realRequestAnimationFrame = window.requestAnimationFrame;
  var realCancelAnimationFrame = window.cancelAnimationFrame;

  var runMap = {};
  var nextId = 0;

  var fakeRequestAnimationFrame = function(fn) {
    var id = nextId++;
    runMap[id] = fn;
    return id;
  };

  var fakeCancelAnimationFrame = function(id) {
    if (runMap.hasOwnProperty(id)) {
      delete runMap[id];
    }
  };

  var fakeTickFrame = function() {
    for (var id in runMap) {
      var fn = runMap[id];
      fn();
    }
    runMap = {};
  };

  beforeEach(function() {
    window.requestAnimationFrame = fakeRequestAnimationFrame;
    window.cancelAnimationFrame = fakeCancelAnimationFrame;
  });

  afterEach(function() {
    window.requestAnimationFrame = realRequestAnimationFrame;
    window.cancelAnimationFrame = realCancelAnimationFrame;
  });

  test('initial state', function() {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    stage.emit('renderInvalid');
    fakeTickFrame();
    assert.isTrue(stage.render.notCalled);
  });

  test('start', function() {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    stage.emit('renderInvalid');
    fakeTickFrame();
    assert.isTrue(stage.render.called);
  });

  test('stop', function() {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    loop.stop();
    stage.emit('renderInvalid');
    fakeTickFrame();
    assert.isTrue(stage.render.notCalled);
  });

  test('renderOnNextFrame', function() {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    loop.renderOnNextFrame();
    fakeTickFrame();
    assert.isTrue(stage.render.called);
  });

});
