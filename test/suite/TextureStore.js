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

var eventEmitter = require('minimal-event-emitter');
var defer = require('../../src/util/defer');
var cancelize = require('../../src/util/cancelize');

var TextureStore = require('../../src/TextureStore');

var nextId = 0;

// Mock tile.
// The id is propagated into the respective asset and texture.
// The dynamicAsset parameter determines whether the asset will be dynamic.
// The assetFailures and textureFailures parameters determine how many times
// in a row loading the respective asset or creating the respective texture
// will fail.
function MockTile(opts) {
  this.id = nextId++;
  this.dynamicAsset = opts && opts.dynamicAsset;
  this.assetFailures = opts && opts.assetFailures || 0;
  this.textureFailures = opts && opts.textureFailures || 0;
}

// Mock asset.
function MockAsset(tile, dynamic) {
  this.id = tile.id;
  this.dynamic = !!dynamic;
  this.destroy = sinon.spy();
}

eventEmitter(MockAsset);

// Mock texture.
function MockTexture(asset) {
  this.id = asset.id;
  this.refresh = sinon.spy();
  this.destroy = sinon.spy();
}

var loadAssetError = new Error('Asset error');
var createTextureError = new Error('Create texture');

// Mock a Geometry. For these tests we only need the TileClass property.
var mockGeometry = {
  TileClass: {
    equals: function(x, y) {
      return x === y;
    },
    hash: function() {
      return 0;
    }
  }
};

// Mock a Source. For these tests we only need the loadAsset() method.
var mockSource = {
  loadAsset: cancelize(function(stage, tile, done) {
    if (tile.assetFailures) {
      // Fail
      tile.assetFailures--;
      defer(function() {
        done(loadAssetError, tile, asset);
      });
    } else {
      // Succeed
      var asset = new MockAsset(tile, tile.dynamicAsset);
      defer(function() {
        done(null, tile, asset);
      });
    }
  })
};

// Mock a Stage. For these tests we only need the createTexture() method.
var mockStage = {
  createTexture: cancelize(function(tile, asset, done) {
    if (tile.textureFailures) {
      // Fail
      tile.textureFailures--;
      defer(function() {
        done(createTextureError, tile, asset);
      });
    } else {
      // Succeed
      var texture = new MockTexture(asset);
      defer(function() {
        done(null, tile, asset, texture);
      });
    }
  })
};

function makeTextureStore(opts) {
  return new TextureStore(mockGeometry, mockSource, mockStage, opts);
}

suite('TextureStore', function() {

  suite('visibility', function() {

    test('mark tile as visible', function() {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      assert.isTrue(store.query(tile).visible);
    });

    test('mark tile as not visible', function() {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.startFrame();
      store.endFrame();
      assert.isFalse(store.query(tile).visible);
    });

  });

  suite('textures', function() {

    test('load texture for static asset', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.addEventListener('textureStartLoad', function(eventTile) {
        assert.strictEqual(eventTile, tile);
        assert.strictEqual(store.texture(tile), null);
        assert.isFalse(store.query(tile).hasAsset);
        assert.isFalse(store.query(tile).hasTexture);
        store.addEventListener('textureLoad', function(eventTile) {
          var texture = store.texture(tile);
          assert.strictEqual(eventTile, tile);
          assert.isNotNull(texture);
          assert.strictEqual(texture.id, tile.id);
          assert.isFalse(store.query(tile).hasAsset);
          assert.isTrue(store.query(tile).hasTexture);
          done();
        });
      });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
    });

    test('load texture for dynamic asset', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ dynamicAsset: true });
      store.addEventListener('textureStartLoad', function(eventTile) {
        assert.strictEqual(eventTile, tile);
        assert.strictEqual(store.texture(tile), null);
        assert.isFalse(store.query(tile).hasAsset);
        assert.isFalse(store.query(tile).hasTexture);
        store.addEventListener('textureLoad', function(eventTile) {
          var texture = store.texture(tile);
          assert.strictEqual(eventTile, tile);
          assert.isNotNull(texture);
          assert.strictEqual(texture.id, tile.id);
          assert.isTrue(store.query(tile).hasAsset);
          assert.isTrue(store.query(tile).hasTexture);
          done();
        });
      });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
    });

    test('retry on loadAsset failure', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ assetFailures: 1 }); // will succeed when retried
      store.addEventListener('textureLoad', function(eventTile) {
        var texture = store.texture(tile);
        assert.strictEqual(eventTile, tile);
        assert.isNotNull(texture);
        assert.strictEqual(texture.id, tile.id);
        assert.isFalse(store.query(tile).hasAsset);
        assert.isTrue(store.query(tile).hasTexture);
        done();
      });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
    });

    test('error on createTexture failure', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ textureFailures: 1 });
      store.addEventListener('textureError', function(eventTile) {
        assert.strictEqual(eventTile, tile);
        assert.isFalse(store.query(tile).hasAsset);
        assert.isFalse(store.query(tile).hasTexture);
        done();
      });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
    });

    test('cancel load', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.addEventListener('textureCancel', function(eventTile) {
        assert.strictEqual(eventTile, tile);
        assert.isFalse(store.query(tile).hasAsset);
        assert.isFalse(store.query(tile).hasTexture);
        done();
      });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.startFrame();
      store.endFrame();
    });

    test('unload texture', function(done) {
      var store = makeTextureStore({
        previouslyVisibleCacheSize: 0
      });
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        store.addEventListener('textureUnload', function(eventTile) {
          assert.strictEqual(eventTile, tile);
          assert.isFalse(store.query(tile).hasAsset);
          assert.isFalse(store.query(tile).hasTexture);
          done();
        });
        store.startFrame();
        store.endFrame();
      });
    });

    test('return asset for a tile', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ dynamicAsset: true });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        var asset = store.asset(tile);
        assert.instanceOf(asset, MockAsset);
        assert.strictEqual(asset.id, tile.id);
        done();
      });
    });

    test('return texture for a tile', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        var texture = store.texture(tile);
        assert.instanceOf(texture, MockTexture);
        assert.strictEqual(texture.id, tile.id);
        done();
      });
    });

    test('refresh texture for dynamic assets', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ dynamicAsset: true });
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        store.startFrame();
        store.markTile(tile);
        store.endFrame();
        var asset = store.asset(tile);
        var texture = store.texture(tile);
        assert.isTrue(texture.refresh.calledWithExactly(tile, asset));
        done();
      });
    });

    test('do not refresh texture for static assets', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        store.startFrame();
        store.markTile(tile);
        store.endFrame();
        var texture = store.texture(tile);
        assert.isTrue(texture.refresh.notCalled);
        done();
      });
    });

    test('notify on texture invalidation by dynamic asset', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile({ dynamicAsset: true });
      var invalidSpy = sinon.spy();
      store.addEventListener('textureInvalid', invalidSpy);
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        store.addEventListener('textureInvalid', function(eventTile) {
          assert.strictEqual(eventTile, tile);
          done();
        });
        var asset = store.asset(tile);
        asset.emit('change');
      });
    });

  });

  suite('LRU', function() {

    test('previously visible tile without a texture is not kept', function() {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.startFrame();
      store.endFrame();
      assert.isFalse(store.query(tile).previouslyVisible);
    });

    test('previously visible tile with a texture is kept', function(done) {
      var store = makeTextureStore({
        previouslyVisibleCacheSize: 1
      });
      var tile = new MockTile();
      store.startFrame();
      store.markTile(tile);
      store.endFrame();
      store.addEventListener('textureLoad', function() {
        store.startFrame();
        store.endFrame();
        assert.isTrue(store.query(tile).previouslyVisible);
        done();
      });
    });

    test('older tile is displaced by newer tile', function(done) {
      var store = makeTextureStore({
        previouslyVisibleCacheSize: 1
      });
      var tiles = [ new MockTile(), new MockTile(), new MockTile() ];
      var markAndWaitForLoad = function(i) {
        if (i === tiles.length) {
          assert.isFalse(store.query(tiles[0]).previouslyVisible);
          assert.isTrue(store.query(tiles[1]).previouslyVisible);
          done();
        } else {
          var tile = tiles[i];
          store.startFrame();
          store.markTile(tile);
          store.endFrame();
          store.addEventListener('textureLoad', function(loadedTile) {
            if (loadedTile === tile) {
              markAndWaitForLoad(i+1);
            }
          });
        }
      };
      markAndWaitForLoad(0);
    });

  });

  suite('pinning', function() {

    test('pinning is reference-counted', function() {
      var store = makeTextureStore();
      var tile = new MockTile();
      var i, state;
      for (i = 1; i <= 3; i++) {
        store.pin(tile);
        state = store.query(tile);
        assert.isTrue(state.pinned);
        assert.strictEqual(state.pinCount, i);
      }
      for (i = 2; i >= 0; i--) {
        store.unpin(tile);
        state = store.query(tile);
        if (i > 0) {
          assert.isTrue(state.pinned);
        } else {
          assert.isFalse(state.pinned);
        }
        assert.strictEqual(state.pinCount, i);
      }
    });

    test('pinning tile causes load', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.addEventListener('textureLoad', function(eventTile) {
        assert.strictEqual(eventTile, tile);
        assert.isTrue(store.query(tile).pinned);
        done();
      });
      store.pin(tile);
    });

    test('unpinning tile causes unload', function(done) {
      var store = makeTextureStore();
      var tile = new MockTile();
      store.pin(tile);
      store.addEventListener('textureLoad', function() {
        store.addEventListener('textureUnload', function(eventTile) {
          assert.strictEqual(eventTile, tile);
          assert.isFalse(store.query(tile).pinned);
          done();
        });
        store.unpin(tile);
      });
    });

    test('pinned tile is not evicted when it becomes invisible', function(done) {
      var store = makeTextureStore({
        previouslyVisibleCacheSize: 0
      });
      var tile = new MockTile();
      store.pin(tile);
      store.addEventListener('textureLoad', function() {
        store.startFrame();
        store.endFrame();
        assert.isTrue(store.query(tile).hasTexture);
        done();
      });
    });

    test('unpinned tile is evicted when it becomes invisible', function(done) {
      var store = makeTextureStore({
        previouslyVisibleCacheSize: 0
      });
      var tile = new MockTile();
      var unloadSpy = sinon.spy();
      store.addEventListener('textureUnload', unloadSpy);
      store.pin(tile);
      store.addEventListener('textureLoad', function() {
        store.unpin(tile);
        store.startFrame();
        store.endFrame();
        assert.isFalse(store.query(tile).hasTexture);
        done();
      });
    });

  });

});
