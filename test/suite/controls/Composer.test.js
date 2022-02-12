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

import { suite, test, beforeEach, assert } from 'vitest';

import ControlComposer from "../../../src/controls/Composer";
import eventEmitter from "minimal-event-emitter";


suite('ControlComposer', function() {

  function MethodStub() { }
  eventEmitter(MethodStub);


  // Instances to be used on tests
  var composer = null;
  var method = null;
  var method2 = null;

  // clock stub
  var nowValue = null;
  function advanceClock(v) { nowValue += v; }
  var now = function() { return nowValue; };

  // Initialize instances
  beforeEach(function() {
    nowValue = 0;

    composer = new ControlComposer({nowForTesting: now});
    method = new MethodStub();
    method2 = new MethodStub();

    composer.add(method);
    composer.add(method2);
  });

  test('offset', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });

    var o = composer.offsets();

    assert.strictEqual(o.offsets.x, 0.1);
    assert.isFalse(o.changing);
  });


  test('offsets on multiple parameters', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });
    method.emit('parameterDynamics', 'y', { offset: 0.2 });
    method.emit('parameterDynamics', 'zoom', { offset: 0.3 });
    method.emit('parameterDynamics', 'yaw', { offset: 0.4 });
    method.emit('parameterDynamics', 'pitch', { offset: 0.5 });

    var o = composer.offsets();

    assert.strictEqual(o.offsets.x, 0.1);
    assert.strictEqual(o.offsets.y, 0.2);
    assert.strictEqual(o.offsets.zoom, 0.3);
    assert.strictEqual(o.offsets.yaw, 0.4);
    assert.strictEqual(o.offsets.pitch, 0.5);
    assert.isFalse(o.changing);
  });

  test('offset from multiple methods', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });
    method2.emit('parameterDynamics', 'x', { offset: 0.25 });

    var o = composer.offsets();

    assert.strictEqual(o.offsets.x, 0.1 + 0.25);
    assert.isFalse(o.changing);
  });

  test('offsets on same parameter from single method', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });
    method.emit('parameterDynamics', 'x', { offset: 0.25 });

    var o = composer.offsets();

    assert.strictEqual(o.offsets.x, 0.1 + 0.25);
    assert.isFalse(o.changing);
  });

  test('equal offsets on same parameter from single method', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });
    method.emit('parameterDynamics', 'x', { offset: 0.1 });

    var o = composer.offsets();

    assert.strictEqual(o.offsets.x, 0.1 + 0.1);
    assert.isFalse(o.changing);
  });

  test('throw with unknown parameter', function() {
    assert.throws(function() {
      method.emit('parameterDynamics', 'wrong', { offset: 0.1 });
    });
  });

  test('velocity', function() {
    method.emit('parameterDynamics', 'x', { velocity: 0.3 });

    var o;

    // After 0 time, the offset should be 0, the value will change
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0);
    assert.isTrue(o.changing);

    // After 1s
    advanceClock(1000);
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.3);
    assert.isTrue(o.changing);

    // After another 0.5s
    advanceClock(500);
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.15);
    assert.isTrue(o.changing);
  });

  test('offset overrides existing velocity', function() {
    method.emit('parameterDynamics', 'x', { velocity: 0.3 });
    method.emit('parameterDynamics', 'x', { offset: 0.1 });

    var o;

    // After 1s
    advanceClock(1000);
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.1);
    assert.isFalse(o.changing);
  });

  test('velocity is added to existing offset', function() {
    method.emit('parameterDynamics', 'x', { offset: 0.1 });
    advanceClock(100);
    method.emit('parameterDynamics', 'x', { velocity: 0.3 });

    var o;

    // After 1s
    advanceClock(1000);
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.1 + 0.3);
    assert.isTrue(o.changing);
  });

  test('velocity after velocity with friction', function() {
    method.emit('parameterDynamics', 'x', { velocity: 1, friction: 1 });

    var o;

    advanceClock(1500);

    // Movement stopped
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.5);

    advanceClock(1000);
    method.emit('parameterDynamics', 'x', { velocity: 1 });

    // Without advancing time, the offset should be 0
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0);

    advanceClock(1000);
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 1);
  });

  test('velocity change between compose() calls', function() {
    composer.offsets();

    method.emit('parameterDynamics', 'x', { velocity: 1 });

    var o;

    advanceClock(500);
    method.emit('parameterDynamics', 'x', { velocity: 2 });

    advanceClock(500);
    o = composer.offsets();

    assert.strictEqual(o.offsets.x, 1.5);
  });

  test('friction', function() {
    method.emit('parameterDynamics', 'x', { velocity: 1, friction: 0.1 });

    var o;

    // After 1s
    // The velocity right after the parameterDynamics were emitted was 1
    // After 1s the velocity is be 0.9, making the average 0.95
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.95, 0.00001);
    assert.isTrue(o.changing);

    // After 2s
    // The velocity after 1s was 0.9, now it is 0.8, making the average 0.85
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.85, 0.00001);
    assert.isTrue(o.changing);

    // After 9s (2s + 7s)
    // The velocity after 2 was 0.8, now it is 0.1, making the average 0.45
    advanceClock(7000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.45 * 7, 0.00001);
    assert.isTrue(o.changing);

    // After 10s (9s + 1s)
    // The velocity was 0.1, now it is 0, making the average 0.05
    // isChanging is on the edge
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.05, 0.00001);

    // After 10.1s
    // The velocity is 0, so there should be no offset
    // isChanging should be false
    advanceClock(100);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0, 0.00001);
    assert.isFalse(o.changing);
  });

  test('friction with negative velocity', function() {
    method.emit('parameterDynamics', 'x', { velocity: -1, friction: 0.1 });

    var o;

    // After 1s
    // The velocity right after the parameterDynamics were emitted was 1
    // After 1s the velocity is be 0.9, making the average 0.95
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, -0.95, 0.00001);
    assert.isTrue(o.changing);

    // After 2s
    // The velocity after 1s was 0.9, now it is 0.8, making the average 0.85
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, -0.85, 0.00001);
    assert.isTrue(o.changing);
  });

  test('friction after velocity', function() {
    method.emit('parameterDynamics', 'x', { velocity: 1 });

    var o;

    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 1, 0.00001);
    assert.isTrue(o.changing);

    method.emit('parameterDynamics', 'x', { velocity: 1, friction: 1 });

    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.5, 0.00001);
  });

  test('velocity becomes 0 between offset calls', function() {
    method.emit('parameterDynamics', 'x', { velocity: 1, friction: 0.1 });

    var o;

    // After 9s
    // The velocity right after the parameterDynamics were emitted was 1
    // After 9s the velocity is 0.1, making the average 0.55
    advanceClock(9000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.55 * 9, 0.00001);
    assert.isTrue(o.changing);

    // After 11s
    // The velocity at 9s was 0.1, at 10s was 0
    // Average velocity on interval [9s, 10s] is 0.05
    // Average velocity on interval [10s, 11s] is 0
    advanceClock(2000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, 0.05, 0.00001);
    assert.isFalse(o.changing);
  });


  test('offset after velocity from other method', function() {
    method.emit('parameterDynamics', 'x', { velocity: -1, friction: 1 });

    var o;

    // After 1.5s, the movement should have ended
    // Total movement is -0.5
    advanceClock(1000);
    o = composer.offsets();
    assert.closeTo(o.offsets.x, -0.5, 0.00001);
    assert.isFalse(o.changing);

    method2.emit('parameterDynamics', 'x', { offset: 0.1 });
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.1);

    method2.emit('parameterDynamics', 'x', { offset: 0.1 });
    o = composer.offsets();
    assert.strictEqual(o.offsets.x, 0.1);
  });

});
