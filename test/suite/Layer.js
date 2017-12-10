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

var Layer = require('../../src/Layer');

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

  setup(function() {
    stage = new MockStage();
    source = new MockSource();
    geometry = new MockGeometry(levelList);
    view = new MockView(selectedLevel);
    textureStore = new MockTextureStore();
  });

  teardown(function() {
    stage = source = geometry = view = textureStore = null;
  });

  test('getters', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    assert.equal(stage, layer.stage());
    assert.equal(source, layer.source());
    assert.equal(geometry, layer.geometry());
    assert.equal(view, layer.view());
    assert.equal(textureStore, layer.textureStore());
  });

  test('visible tiles', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    var tiles = [];
    layer.visibleTiles(tiles);
    assert(geometry.visibleTiles.calledWith(view, selectedLevel, tiles));
  });

  test('fixed level', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('fixedLevelChange', spy);

    var tiles = [];

    assert.equal(null, layer.fixedLevel());
    assert(levelList[1] !== selectedLevel);
    layer.setFixedLevel(1);
    assert.equal(1, layer.fixedLevel());
    assert(spy.calledOnce);
    layer.visibleTiles(tiles);
    assert(geometry.visibleTiles.calledWith(view, levelList[1], tiles));

    layer.setFixedLevel(null);
    assert.equal(null, layer.fixedLevel());
    assert(spy.calledTwice);
    layer.visibleTiles(tiles);
    assert(geometry.visibleTiles.calledWith(view, selectedLevel, tiles));
  });

  test('pin level', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    geometry.levelTiles.returns(tileList);
    layer.pinLevel(1);
    assert(geometry.levelTiles.withArgs(levelList[1]).calledOnce);
    for (var i = 0; i < tileList.length; i++) {
      assert(textureStore.pin.calledWith(tileList[i]));
    }
    layer.unpinLevel(1);
    assert(geometry.levelTiles.withArgs(levelList[1]).calledTwice);
    for (var i = 0; i < tileList.length; i++) {
      assert(textureStore.unpin.calledWith(tileList[i]));
    }
  });

  test('pin first level', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    geometry.levelTiles.returns(tileList);
    layer.pinFirstLevel();
    assert(geometry.levelTiles.withArgs(levelList[0]).calledOnce);
    for (var i = 0; i < tileList.length; i++) {
      assert(textureStore.pin.calledWith(tileList[i]));
    }
    layer.unpinLevel(1);
    assert(geometry.levelTiles.withArgs(levelList[0]).calledTwice);
    for (var i = 0; i < tileList.length; i++) {
      assert(textureStore.unpin.calledWith(tileList[i]));
    }
  });

  test('view events', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('viewChange', spy);
    view.emit('change');
    assert(spy.calledOnce);
  });

  test('texture store events', function() {
    var layer = new Layer(stage, source, geometry, view, textureStore);
    var spy = sinon.spy();
    layer.addEventListener('textureStoreChange', spy);
    textureStore.emit('textureLoad');
    textureStore.emit('textureError');
    textureStore.emit('textureInvalid');
    assert(spy.calledThrice);
  });
});
