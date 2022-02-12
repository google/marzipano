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

import Layer from "../../src/Layer";

function MockStage() {}

function MockSource() {}

function MockTile() {}

function MockLevel() {}

function MockGeometry(levelList) {
  this.levelList = levelList;
  this.visibleTiles = sinon.stub();
  this.levelTiles = sinon.stub();
}

function MockView(selectedLevel) {
  this.selectLevel = function() { return selectedLevel; }
}
eventEmitter(MockView);

function MockTextureStore() {
  this.pin = sinon.spy();
  this.unpin = sinon.spy();
}
eventEmitter(MockTextureStore);

suite('Layer', function() {

  var stage;
  var source;
  var geometry;
  var view;
  var textureStore;

  var levelList = [new MockLevel(), new MockLevel(), new MockLevel()];
  var selectedLevel = levelList[2];
  var tileList = [new MockTile(), new MockTile()];

  beforeEach(function() {
    stage = new MockStage();
    source = new MockSource();
    geometry = new MockGeometry(levelList);
    view = new MockView(selectedLevel);
    textureStore = new MockTextureStore();
  });

  afterEach(function() {
    stage = source = geometry = view = textureStore = null;
  });

  test('getters', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    assert.strictEqual(source, layer.source());
    assert.strictEqual(geometry, layer.geometry());
    assert.strictEqual(view, layer.view());
    assert.strictEqual(textureStore, layer.textureStore());
  });

  test('visible tiles', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    var tiles = [];
    layer.visibleTiles(tiles);
    assert.isTrue(geometry.visibleTiles.calledWithExactly(view, selectedLevel, tiles));
  });

  test('fixed level', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('fixedLevelChange', spy);

    var tiles = [];

    assert.equal(null, layer.fixedLevel());
    assert.notStrictEqual(levelList[1], selectedLevel);
    layer.setFixedLevel(1);
    assert.strictEqual(layer.fixedLevel(), 1);
    assert.isTrue(spy.calledOnce);
    layer.visibleTiles(tiles);
    assert.isTrue(geometry.visibleTiles.calledWithExactly(view, levelList[1], tiles));

    layer.setFixedLevel(null);
    assert.equal(null, layer.fixedLevel());
    assert.isTrue(spy.calledTwice);
    layer.visibleTiles(tiles);
    assert.isTrue(geometry.visibleTiles.calledWithExactly(view, selectedLevel, tiles));
  });

  test('pin level', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    geometry.levelTiles.returns(tileList);
    layer.pinLevel(1);
    assert.isTrue(geometry.levelTiles.withArgs(levelList[1]).calledOnce);
    for (var i = 0; i < tileList.length; i++) {
      assert.isTrue(textureStore.pin.calledWithExactly(tileList[i]));
    }
    layer.unpinLevel(1);
    assert.isTrue(geometry.levelTiles.withArgs(levelList[1]).calledTwice);
    for (var i = 0; i < tileList.length; i++) {
      assert.isTrue(textureStore.unpin.calledWithExactly(tileList[i]));
    }
  });

  test('pin first level', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    geometry.levelTiles.returns(tileList);
    layer.pinFirstLevel();
    assert.isTrue(geometry.levelTiles.withArgs(levelList[0]).calledOnce);
    for (var i = 0; i < tileList.length; i++) {
      assert.isTrue(textureStore.pin.calledWithExactly(tileList[i]));
    }
    layer.unpinLevel(1);
    assert.isTrue(geometry.levelTiles.withArgs(levelList[0]).calledTwice);
    for (var i = 0; i < tileList.length; i++) {
      assert.isTrue(textureStore.unpin.calledWithExactly(tileList[i]));
    }
  });

  test('view events', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('viewChange', spy);
    view.emit('change');
    assert.isTrue(spy.calledOnce);
  });

  test('texture store events', function() {
    var layer = new Layer(source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('textureStoreChange', spy);
    textureStore.emit('textureStartLoad');
    assert.equal(spy.callCount, 0);
    textureStore.emit('textureLoad');
    assert.equal(spy.callCount, 1);
    textureStore.emit('textureCancel');
    assert.equal(spy.callCount, 1);
    textureStore.emit('textureError');
    assert.equal(spy.callCount, 2);
    textureStore.emit('textureInvalid');
    assert.equal(spy.callCount, 3);
    textureStore.emit('textureUnload');
    assert.equal(spy.callCount, 3);
  });
});
