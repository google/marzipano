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

var assert = require('proclaim');
var sinon = require('sinon');

var eventEmitter = require('minimal-event-emitter');
var inherits = require('../../src/util/inherits');

var Stage = require('../../src/stages/Stage');

// Stage is an abstract class and cannot be instantiated directly.
// We must stub methods and properties expected to be implemented by subclasses.
function TestStage() {
  this.constructor.super_.call(this);
  this._validateLayer = sinon.stub();
}

inherits(TestStage, Stage);

// Mock layer.
function MockLayer() {}

eventEmitter(MockLayer);

suite('Stage', function() {

  test('manages the layer stack correctly', function() {
    var stage = new TestStage();

    var layer1 = new MockLayer();
    var layer2 = new MockLayer();
    var layer3 = new MockLayer();

    assert.isFalse(stage.hasLayer(layer1));
    assert.deepEqual([], stage.listLayers());
    assert.throws(function() { stage.addLayer(layer1, 1); });
    assert.throws(function() { stage.moveLayer(layer1, 1); });
    assert.throws(function() { stage.removeLayer(layer1); });

    stage.addLayer(layer1);
    assert.isTrue(stage.hasLayer(layer1));
    assert.deepEqual([layer1], stage.listLayers());

    stage.addLayer(layer2, 1);
    assert.isTrue(stage.hasLayer(layer2));
    assert.deepEqual([layer1, layer2], stage.listLayers());

    assert.throws(function() { stage.addLayer(layer3, -1); });
    assert.throws(function() { stage.addLayer(layer3, 3); });

    stage.addLayer(layer3, 1);
    assert.isTrue(stage.hasLayer(layer3));
    assert.deepEqual([layer1, layer3, layer2], stage.listLayers());

    assert.throws(function() { stage.moveLayer(layer1, -1); });
    assert.throws(function() { stage.moveLayer(layer1, 3); });

    stage.moveLayer(layer1, 2);
    assert.isTrue(stage.hasLayer(layer1));
    assert.deepEqual([layer3, layer2, layer1], stage.listLayers());

    stage.removeLayer(layer2);
    assert.isFalse(stage.hasLayer(layer2));
    assert.deepEqual([layer1, layer3], stage.listLayers());

    stage.removeLayer(layer1);
    assert.isFalse(stage.hasLayer(layer1));
    assert.deepEqual([layer3], stage.listLayers());
  });

  test('throws if layer validation fails', function() {
    var stage = new TestStage();
    var layer = new MockLayer();

    stage._validateLayer.throws();
    assert.throws(function() { stage.addLayer(layer); });
  });

});
