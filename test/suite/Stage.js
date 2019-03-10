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
sinon.assert.expose(assert, {prefix: ''});

var eventEmitter = require('minimal-event-emitter');
var inherits = require('../../src/util/inherits');

var Stage = require('../../src/stages/Stage');

var CubeGeometry = require('../../src/geometries/Cube');
var CubeTile = CubeGeometry.TileClass;
var EquirectGeometry = require('../../src/geometries/Equirect');
var EquirectTile = EquirectGeometry.TileClass;

// Stage is an abstract class and cannot be instantiated directly.
// We must stub methods and properties expected to be implemented by subclasses.
function TestStage() {
  var renderers = [].slice.apply(arguments);
  var nextRendererIndex = 0;
  this.constructor.super_.call(this);
  this.validateLayer = sinon.stub();
  this.setSizeForType = sinon.stub();
  this.startFrame = sinon.stub();
  this.endFrame = sinon.stub();
  this.createRenderer = function() { return renderers[nextRendererIndex++]; };
  this.destroyRenderer = sinon.stub();
  this.registerRenderer('fake', 'fake', function() {});
}

inherits(TestStage, Stage);

function MockLayer(mockTextureStore) {
  this.geometry = sinon.stub().returns(new MockGeometry());
  this.view = sinon.stub().returns(new MockView());
  this.effects = sinon.stub().returns({});
  this.isProgressive = sinon.stub();
  this.visibleTiles = sinon.stub();
  this.textureStore = function() {
    return mockTextureStore;
  };
}

eventEmitter(MockLayer);

function MockView() {
  this.type = 'fake';
  this.setSize = sinon.stub();
}

function MockGeometry() {
  this.type = 'fake';
}

function MockRenderer() {
  this.startLayer = sinon.stub();
  this.renderTile = sinon.stub();
  this.endLayer = sinon.stub();
}

function MockTextureStore() {
  this.texture = sinon.stub();
  this.startFrame = sinon.stub();
  this.markTile = sinon.stub();
  this.endFrame = sinon.stub();
}

suite('Stage', function() {

  test('manages the layer stack correctly', function() {
    var stage = new TestStage();

    var layer1 = new MockLayer();
    var layer2 = new MockLayer();
    var layer3 = new MockLayer();

    assert.isFalse(stage.hasLayer(layer1));
    assert.sameOrderedMembers([], stage.listLayers());
    assert.throws(function() { stage.addLayer(layer1, 1); });
    assert.throws(function() { stage.moveLayer(layer1, 1); });
    assert.throws(function() { stage.removeLayer(layer1); });

    stage.addLayer(layer1);
    assert.isTrue(stage.hasLayer(layer1));
    assert.sameOrderedMembers([layer1], stage.listLayers());

    stage.addLayer(layer2, 1);
    assert.isTrue(stage.hasLayer(layer2));
    assert.sameOrderedMembers([layer1, layer2], stage.listLayers());

    assert.throws(function() { stage.addLayer(layer3, -1); });
    assert.throws(function() { stage.addLayer(layer3, 3); });

    stage.addLayer(layer3, 1);
    assert.isTrue(stage.hasLayer(layer3));
    assert.sameOrderedMembers([layer1, layer3, layer2], stage.listLayers());

    assert.throws(function() { stage.moveLayer(layer1, -1); });
    assert.throws(function() { stage.moveLayer(layer1, 3); });

    stage.moveLayer(layer1, 2);
    assert.isTrue(stage.hasLayer(layer1));
    assert.sameOrderedMembers([layer3, layer2, layer1], stage.listLayers());

    stage.removeLayer(layer2);
    assert.isFalse(stage.hasLayer(layer2));
    assert.sameOrderedMembers([layer3, layer1], stage.listLayers());

    stage.removeLayer(layer1);
    assert.isFalse(stage.hasLayer(layer1));
    assert.sameOrderedMembers([layer3], stage.listLayers());
  });

  test('throws if layer validation fails', function() {
    var stage = new TestStage();
    var layer = new MockLayer();

    stage.validateLayer.throws();
    assert.throws(function() { stage.addLayer(layer); });
  });

  test('emits invalidation event', function() {
    var stage = new TestStage();
    var layer = new MockLayer();

    var spy = sinon.spy();
    stage.addEventListener('renderInvalid', spy);

    stage.addLayer(layer);
    assert.equal(spy.callCount, 1);

    layer.emit('viewChange');
    layer.emit('effectsChange');
    layer.emit('fixedLevelChange');
    layer.emit('textureStoreChange');
    assert.equal(spy.callCount, 5);

    stage.moveLayer(layer, 0);
    assert.equal(spy.callCount, 6);

    stage.removeLayer(layer);
    assert.equal(spy.callCount, 7);

    layer.emit('viewChange');
    layer.emit('effectsChange');
    layer.emit('fixedLevelChange');
    layer.emit('textureStoreChange');
    assert.equal(spy.callCount, 7);
  });

  test('gets and sets size', function() {
    var stage = new TestStage();

    var size = {};

    assert.strictEqual(size, stage.size(size));
    assert.equal(size.width, 0);
    assert.equal(size.height, 0);

    stage.setSize({width: 200, height: 100});
    assert.isTrue(stage.setSizeForType.called);

    size = stage.size();
    assert.equal(size.width, 200);
    assert.equal(size.height, 100);
  });

  test('renders a single layer', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var tile = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture = {};
    var store = new MockTextureStore();
    store.texture.withArgs(tile).returns(texture);
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(tile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callOrder(
      stage.startFrame,
      renderer.startLayer,
      renderer.renderTile,
      renderer.endLayer,
      stage.endFrame);

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, tile, texture, layer, 1);

    assert.calledOnce(store.markTile);
    assert.calledWith(store.markTile, tile);
    assert.callOrder(store.startFrame, store.markTile, store.endFrame);
  });

  test('renders multiple layers', function() {
    var renderer1 = new MockRenderer();
    var renderer2 = new MockRenderer();
    var stage = new TestStage(renderer1, renderer2);

    var tile1 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture1 = {};
    var store1 = new MockTextureStore();
    store1.texture.withArgs(tile1).returns(texture1);
    var layer1 = new MockLayer(store1);
    layer1.visibleTiles.callsFake(function(result) {
      result.push(tile1);
    });

    var tile2 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture2 = {};
    var store2 = new MockTextureStore();
    store2.texture.withArgs(tile2).returns(texture2);
    var layer2 = new MockLayer(store2);
    layer2.visibleTiles.callsFake(function(result) {
      result.push(tile2);
    });

    stage.addLayer(layer1);
    stage.addLayer(layer2);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callOrder(
      stage.startFrame,
      renderer1.startLayer,
      renderer1.renderTile,
      renderer1.endLayer,
      renderer2.startLayer,
      renderer2.renderTile,
      renderer2.endLayer,
      stage.endFrame);

    assert.calledOnce(stage.startFrame);
    assert.calledOnce(stage.endFrame);

    assert.calledOnce(renderer1.startLayer);
    assert.calledOnce(renderer1.endLayer);
    assert.calledOnce(renderer1.renderTile);
    assert.calledWith(renderer1.renderTile, tile1, texture1, layer1, 2);

    assert.calledOnce(renderer2.startLayer);
    assert.calledOnce(renderer2.endLayer);
    assert.calledOnce(renderer2.renderTile);
    assert.calledWith(renderer2.renderTile, tile2, texture2, layer2, 1);

    assert.calledOnce(store1.markTile);
    assert.calledWith(store1.markTile, tile1);
    assert.callOrder(store1.startFrame, store1.markTile, store1.endFrame);

    assert.calledOnce(store2.markTile);
    assert.calledWith(store2.markTile, tile2);
    assert.callOrder(store2.startFrame, store2.markTile, store2.endFrame);
  });

  test('renders multiple layers with the same renderer', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer, renderer);

    var tile1 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture1 = {};
    var store1 = new MockTextureStore();
    store1.texture.withArgs(tile1).returns(texture1);
    var layer1 = new MockLayer(store1);
    layer1.visibleTiles.callsFake(function(result) {
      result.push(tile1);
    });

    var tile2 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture2 = {};
    var store2 = new MockTextureStore();
    store2.texture.withArgs(tile2).returns(texture2);
    var layer2 = new MockLayer(store2);
    layer2.visibleTiles.callsFake(function(result) {
      result.push(tile2);
    });

    stage.addLayer(layer1);
    stage.addLayer(layer2);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callOrder(
      stage.startFrame,
      renderer.startLayer,
      renderer.renderTile,
      renderer.endLayer,
      stage.endFrame);

    assert.calledOnce(stage.startFrame);
    assert.calledOnce(stage.endFrame);

    assert.calledTwice(renderer.startLayer);
    assert.calledTwice(renderer.endLayer);
    assert.calledTwice(renderer.renderTile);
    assert.calledWith(renderer.renderTile, tile1, texture1, layer1, 2);
    assert.calledWith(renderer.renderTile, tile2, texture2, layer2, 1);

    assert.calledOnce(store1.markTile);
    assert.calledWith(store1.markTile, tile1);
    assert.callOrder(store1.startFrame, store1.markTile, store1.endFrame);

    assert.calledOnce(store2.markTile);
    assert.calledWith(store2.markTile, tile2);
    assert.callOrder(store2.startFrame, store2.markTile, store2.endFrame);
  });

  test('renders multiple layers with the same texture store', function() {
    var renderer1 = new MockRenderer();
    var renderer2 = new MockRenderer();
    var stage = new TestStage(renderer1, renderer2);

    var store = new MockTextureStore();

    var tile1 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture1 = {};
    store.texture.withArgs(tile1).returns(texture1);
    var layer1 = new MockLayer(store);
    layer1.visibleTiles.callsFake(function(result) {
      result.push(tile1);
    });

    var tile2 = new EquirectTile(0, new EquirectGeometry([{ width: 1 }]));
    var texture2 = {};
    store.texture.withArgs(tile2).returns(texture2);
    var layer2 = new MockLayer(store);
    layer2.visibleTiles.callsFake(function(result) {
      result.push(tile2);
    });

    stage.addLayer(layer1);
    stage.addLayer(layer2);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledTwice(store.startFrame);
    assert.calledTwice(store.endFrame);
    assert.calledTwice(store.markTile);
    assert.calledWith(store.markTile, tile1);
    assert.calledWith(store.markTile, tile2);
    assert.callOrder(store.startFrame, store.markTile, store.endFrame);
  });

  test('falls back to a parent tile', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 2, geometry);
    var parentTile = new CubeTile('f', 0, 0, 1, geometry);
    var grandparentTile = new CubeTile('f', 0, 0, 0, geometry);
    var store = new MockTextureStore();
    store.texture.returns(null).withArgs(parentTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, parentTile);

    assert.calledThrice(store.markTile);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, parentTile);
    assert.calledWith(store.markTile, grandparentTile);
  });

  test('falls back to a grandparent tile', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 2, geometry);
    var parentTile = new CubeTile('f', 0, 0, 1, geometry);
    var grandparentTile = new CubeTile('f', 0, 0, 0, geometry);
    var store = new MockTextureStore();
    store.texture.returns(null).withArgs(grandparentTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, grandparentTile);

    assert.calledThrice(store.markTile);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, parentTile);
    assert.calledWith(store.markTile, grandparentTile);
  });

  test('falls back to children tiles', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 1, geometry);
    var parentTile = new CubeTile('f', 0, 0, 0, geometry);
    var childTile1 = new CubeTile('f', 0, 0, 2, geometry);
    var childTile2 = new CubeTile('f', 0, 1, 2, geometry);
    var childTile3 = new CubeTile('f', 1, 0, 2, geometry);
    var childTile4 = new CubeTile('f', 1, 1, 2, geometry);
    var store = new MockTextureStore();
    store.texture
      .returns(null)
      .withArgs(parentTile).returns({})
      .withArgs(childTile1).returns({})
      .withArgs(childTile2).returns({})
      .withArgs(childTile3).returns({})
      .withArgs(childTile4).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callCount(renderer.renderTile, 4);
    assert.calledWith(renderer.renderTile, childTile1);
    assert.calledWith(renderer.renderTile, childTile2);
    assert.calledWith(renderer.renderTile, childTile3);
    assert.calledWith(renderer.renderTile, childTile4);

    assert.callCount(store.markTile, 6);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, parentTile);
    assert.calledWith(store.markTile, childTile1);
    assert.calledWith(store.markTile, childTile2);
    assert.calledWith(store.markTile, childTile3);
    assert.calledWith(store.markTile, childTile4);
  });

  test('falls back to both children and parent tiles', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 1, geometry);
    var parentTile = new CubeTile('f', 0, 0, 0, geometry);
    var childTile1 = new CubeTile('f', 0, 0, 2, geometry);
    var childTile2 = new CubeTile('f', 0, 1, 2, geometry);
    var childTile3 = new CubeTile('f', 1, 0, 2, geometry);
    var store = new MockTextureStore();
    store.texture
      .returns(null)
      .withArgs(parentTile).returns({})
      .withArgs(childTile1).returns({})
      .withArgs(childTile2).returns({})
      .withArgs(childTile3).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callCount(renderer.renderTile, 4);
    assert.calledWith(renderer.renderTile, childTile1);
    assert.calledWith(renderer.renderTile, childTile2);
    assert.calledWith(renderer.renderTile, childTile3);
    assert.calledWith(renderer.renderTile, parentTile);

    assert.callCount(store.markTile, 5);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, childTile1);
    assert.calledWith(store.markTile, childTile2);
    assert.calledWith(store.markTile, childTile3);
    assert.calledWith(store.markTile, parentTile);
  });

  test('falls back to grandchildren tiles on trivial geometries', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new EquirectGeometry([
      { width: 512 },
      { width: 1024 },
      { width: 2048 }
    ]);
    var visibleTile = new EquirectTile(0, geometry);
    var grandchildTile = new EquirectTile(2, geometry);
    var store = new MockTextureStore();
    store.texture
      .returns(null)
      .withArgs(grandchildTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, grandchildTile);

    assert.calledTwice(store.markTile);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, grandchildTile);
  });

  test('does not fall back to grandchildren tiles on nontrivial geometries', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 },
      { tileSize: 512, size: 4096 },
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 1, geometry);
    var parentTile = new CubeTile('f', 0, 0, 0, geometry);
    var grandchildTile = new CubeTile('f', 0, 0, 3, geometry);
    var store = new MockTextureStore();
    store.texture
      .returns(null)
      .withArgs(parentTile).returns({})
      .withArgs(grandchildTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, parentTile);

    assert.calledTwice(store.markTile);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, parentTile);
  });

  test('does not render a fallback tile more than once', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile1 = new CubeTile('f', 0, 0, 2, geometry);
    var visibleTile2 = new CubeTile('f', 1, 1, 2, geometry);
    var parentTile = new CubeTile('f', 0, 0, 1, geometry);
    var grandparentTile = new CubeTile('f', 0, 0, 0, geometry);
    var store = new MockTextureStore();
    store.texture.returns(null).withArgs(parentTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile1, visibleTile2);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, parentTile);

    assert.callCount(store.markTile, 4);
    assert.calledWith(store.markTile, visibleTile1);
    assert.calledWith(store.markTile, visibleTile2);
    assert.calledWith(store.markTile, parentTile);
    assert.calledWith(store.markTile, grandparentTile);
  });

  test('does not fall back when unnecessary', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 }
    ]);
    var visibleTile = new CubeTile('f', 0, 0, 1, geometry);
    var parentTile = new CubeTile('f', 0, 0, 0, geometry);
    var childTile = new CubeTile('f', 0, 0, 2, geometry);
    var store = new MockTextureStore();
    store.texture
        .returns(null)
        .withArgs(visibleTile).returns({})
        .withArgs(parentTile).returns({})
        .withArgs(childTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.calledOnce(renderer.renderTile);
    assert.calledWith(renderer.renderTile, visibleTile);

    assert.calledTwice(store.markTile);
    assert.calledWith(store.markTile, visibleTile);
    assert.calledWith(store.markTile, parentTile);
  });

  test('renders and loads tiles in the right order', function() {
    var renderer = new MockRenderer();
    var stage = new TestStage(renderer);

    var geometry = new CubeGeometry([
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 },
      { tileSize: 512, size: 4096 },
    ]);
    // `visibleTile1` falls back to `childTile` and `parentTile1`.
    // `visibleTile2` does not need a fallback.
    // `visibleTile3` falls back to grandparent.
    var visibleTile1 = new CubeTile('f', 0, 0, 2, geometry);
    var visibleTile2 = new CubeTile('f', 0, 1, 2, geometry);
    var visibleTile3 = new CubeTile('f', 0, 2, 2, geometry);
    var parentTile1 = new CubeTile('f', 0, 0, 1, geometry);
    var parentTile2 = new CubeTile('f', 0, 1, 1, geometry);
    var grandparentTile = new CubeTile('f', 0, 0, 0, geometry);
    var childTile = new CubeTile('f', 0, 0, 3, geometry);
    var store = new MockTextureStore();
    store.texture
      .returns(null)
      .withArgs(visibleTile2).returns({})
      .withArgs(grandparentTile).returns({})
      .withArgs(parentTile1).returns({})
      .withArgs(childTile).returns({});
    var layer = new MockLayer(store);
    layer.visibleTiles.callsFake(function(result) {
      result.push(visibleTile1, visibleTile2, visibleTile3);
    });

    stage.addLayer(layer);
    stage.setSize({width: 100, height: 100});
    stage.render();

    assert.callCount(renderer.renderTile, 4);
    assert.calledWith(renderer.renderTile.getCall(0), childTile);
    assert.calledWith(renderer.renderTile.getCall(1), visibleTile2);
    assert.calledWith(renderer.renderTile.getCall(2), parentTile1);
    assert.calledWith(renderer.renderTile.getCall(3), grandparentTile);

    assert.callCount(store.markTile, 7);
    assert.calledWith(store.markTile.getCall(0), grandparentTile);
    assert.calledWith(store.markTile.getCall(1), parentTile1);
    assert.calledWith(store.markTile.getCall(2), parentTile2);
    assert.calledWith(store.markTile.getCall(3), visibleTile1);
    assert.calledWith(store.markTile.getCall(4), visibleTile2);
    assert.calledWith(store.markTile.getCall(5), visibleTile3);
    assert.calledWith(store.markTile.getCall(6), childTile);
  });
});
