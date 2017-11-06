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

var Map = require('./collections/Map');
var Set = require('./collections/Set');
var LruSet = require('./collections/LruSet');
var eventEmitter = require('minimal-event-emitter');
var defaults = require('./util/defaults');
var retry = require('./util/retry');
var chain = require('./util/chain');

var inherits = require('./util/inherits');

var debug = typeof MARZIPANODEBUG !== 'undefined' && MARZIPANODEBUG.textureStore;


// Clients communicate with the texture store primarily through the startFrame,
// endFrame and markTile methods. The call sequence must be accepted by the
// following grammar (where X* denotes zero or more occurrences of X):
//
//   Sequence ::= Frame*
//   Frame ::= Client*
//   Client ::= StartFrame MarkTile* EndFrame
//
// In the grammar above:
//   * Sequence comprises the entire lifetime of the texture store;
//   * Frame comprises the duration of a single frame;
//   * Client comprises the sequence of calls made into the store by one
//     particular client within the duration of a single frame.
//
// Other kinds of calls into the store (e.g. pin and unpin) may be freely
// interleaved with the above sequence.
//
// At any given time, the texture store is in one of three phases. The start
// phase corresponds to the interval between the first StartFrame and the
// first EndFrame of a Frame. The end phase corresponds to the interval
// between the first and the last EndFrame of a Frame. The remaining periods
// of time belong to the idle phase.

var IdlePhase = 'idle';
var StartPhase = 'start';
var EndPhase = 'end';


var defaultOptions = {
  // Maximum number of cached textures for previously visible tiles.
  previouslyVisibleCacheSize: 32
};


// Assign an id to each operation so we can track its state.
// We actually only need this in debug mode, but the code is less convoluted
// if we track unconditionally, and the performance hit is minimal anyway.
var nextId = 0;


// Distinguish a cancellation from other kinds of errors.
function CancelError() {}
inherits(CancelError, Error);


// An item saved in a texture store. This class is responsible for loading
// and unloading a tile's texture and emitting the associated events.
function TextureStoreItem(store, tile) {

  var self = this;

  self._id = nextId++;
  self._store = store;
  self._tile = tile;

  self._asset = null;
  self._texture = null;

  self._changeHandler = function() {
    store.emit('textureInvalid', tile);
  };

  var source = store.source();
  var stage = store.stage();

  var loadAsset = source.loadAsset.bind(source);
  var createTexture = stage.createTexture.bind(stage);

  // Retry loading the asset until it succeeds, then create the texture from it.
  // This process may be canceled at any point by calling the destroy() method.
  var fn = chain(retry(loadAsset), createTexture);

  if (debug) {
    console.log('loading', self._id, self._tile);
  }

  self._cancel = fn(stage, tile, function(err, tile, asset, texture) {

    // Make sure we do not call cancel after the operation is complete.
    self._cancel = null;

    if (err) {
      // The loading process was interrupted by an error.
      // This could either be because the texture creation failed, or because
      // the operation was canceled before the loading was complete.

      // Destroy the asset and texture, if they exist.
      if (asset) {
        asset.destroy();
      }
      if (texture) {
        texture.destroy();
      }

      // Emit events.
      if (err instanceof CancelError) {
        self._store.emit('textureCancel', self._tile);
        if (debug) {
          console.log('cancel', self._id, self._tile);
        }
      } else {
        self._store.emit('textureError', self._tile, err);
        if (debug) {
          console.log('error', self._id, self._tile);
        }
      }

      return;
    }

    // Save a local reference to the texture.
    self._texture = texture;

    // If the asset is dynamic, save a local reference to it and setup
    // handler to be called whenever it changes.
    // Otherwise, destroy the asset as we won't be needing it any more.
    if (asset.dynamic) {
      self._asset = asset;
      asset.addEventListener('change', self._changeHandler);
    } else {
      asset.destroy();
    }

    // Emit event.
    self._store.emit('textureLoad', self._tile);
    if (debug) {
      console.log('load', self._id, self._tile);
    }
  });

}


TextureStoreItem.prototype.asset = function() {
  return this._asset;
};


TextureStoreItem.prototype.texture = function() {
  return this._texture;
};


TextureStoreItem.prototype.destroy = function() {

  var self = this;

  var id = self._id;
  var store = self._store;
  var tile = self._tile;
  var asset = self._asset;
  var texture = self._texture;
  var cancel = self._cancel;

  if (cancel) {
    // The texture is still loading, so cancel it.
    cancel(new CancelError('Texture load cancelled'));
    return;
  }

  // Destroy asset.
  if (asset) {
    asset.removeEventListener('change', self._changeHandler);
    asset.destroy();
  }

  // Destroy texture.
  if (texture) {
    texture.destroy();
  }

  // Emit event.
  store.emit('textureUnload', tile);
  if (debug) {
    console.log('unload', id, tile);
  }

  // Kill references.
  self._changeHandler = null;
  self._asset = null;
  self._texture = null;
  self._tile = null;
  self._store = null;
  self._id = null;

};

eventEmitter(TextureStoreItem);


/**
 * Signals that a texture has been loaded.
 * @event TextureStore#textureLoad
 * @param {Tile} tile The tile for which the texture was loaded.
 */

/**
 * Signals that a texture has been unloaded.
 * @event TextureStore#textureUnload
 * @param {Tile} tile The tile for which the texture was unloaded.
 */

/**
 * Signals that a texture has been invalidated.
 * @event TextureStore#textureInvalid
 * @param {Tile} tile The tile for which the texture was invalidated.
 */

/**
 * Signals that loading a texture has been cancelled.
 * @event TextureStore#textureCancel
 * @param {Tile} tile The tile for which the texture loading was cancelled.
 */

/**
 * Signals that loading a texture has failed.
 * @event TextureStore#textureError
 * @param {Tile} tile The tile for which the texture loading has failed.
 */

/**
 * @class
 * @classdesc
 * A TextureStore maintains a cache of textures used to render a {@link Layer}.
 *
 * A {@link Stage} communicates with the TextureStore through the startFrame(),
 * markTile() and endFrame() methods, which indicate the tiles that are visible
 * in the current frame. Textures for visible tiles are loaded and retained
 * as long as the tiles remain visible. A limited amount of textures whose
 * tiles used to be visible are cached according to an LRU policy. Tiles may
 * be pinned to ensure that their textures are never unloaded, even when
 * the tiles are invisible.
 *
 * Multiple layers belonging to the same underlying {@link WebGlStage} may
 * share the same TextureStore. Layers belonging to distinct {@link WebGlStage}
 * instances, or belonging to a {@link CssStage} or a {@link FlashStage},
 * may not do so due to restrictions on the use of textures across stages.
 *
 * @param {Geometry} geometry the underlying geometry.
 * @param {Source} source the underlying source.
 * @param {Stage} stage the underlying stage.
 * @param {Object} opts options.
 * @param {Number} [opts.previouslyVisibleCacheSize=32] the non-visible texture
 *                 LRU cache size.
 */
function TextureStore(geometry, source, stage, opts) {

  opts = defaults(opts || {}, defaultOptions);

  this._source = source;
  this._stage = stage;

  var TileClass = geometry.TileClass;

  // The current phase.
  this._clientPhase = IdlePhase;

  // The number of pending startFrame calls without a matching endFrame call.
  this._clientCounter = 0;

  // The cache proper: map cached tiles to their respective textures/assets.
  this._itemMap = new Map(TileClass.equals, TileClass.hash);

  // The subset of cached tiles that are currently visible.
  this._visible = new Set(TileClass.equals, TileClass.hash);

  // The subset of cached tiles that were visible recently, but are not
  // visible right now. Newly inserted tiles replace older ones.
  this._previouslyVisible = new LruSet(TileClass.equals, TileClass.hash, opts.previouslyVisibleCacheSize);

  // The subset of cached tiles that should never be evicted from the cache.
  // A tile may be pinned more than once; map each tile into a reference count.
  this._pinMap = new Map(TileClass.equals, TileClass.hash);

  // Temporary variables.
  this._newVisible = new Set(TileClass.equals, TileClass.hash);
  this._noLongerVisible = [];
  this._visibleAgain = [];
  this._evicted = [];

}

eventEmitter(TextureStore);


/**
 * Destructor.
 */
TextureStore.prototype.destroy = function() {
  this.clear();
  this._source = null;
  this._stage = null;
  this._itemMap = null;
  this._visible = null;
  this._previouslyVisible = null;
  this._pinMap = null;
  this._newVisible = null;
  this._noLongerVisible = null;
  this._visibleAgain = null;
  this._evicted = null;
};


/**
 * Return the underlying {@link Stage}.
 * @return {Stage}
 */
TextureStore.prototype.stage = function() {
  return this._stage;
};


/**
 * Return the underlying {@link Source}.
 * @return {Source}
 */
TextureStore.prototype.source = function() {
  return this._source;
};


/**
 * Remove all textures from the TextureStore, including pinned textures.
 */
TextureStore.prototype.clear = function() {

  var self = this;

  // Collect list of tiles to be evicted.
  self._evicted.length = 0;
  self._itemMap.each(function(tile) {
    self._evicted.push(tile);
  });

  // Evict tiles.
  self._evicted.forEach(function(tile) {
    self._unloadTile(tile);
  });

  // Clear all internal state.
  self._itemMap.clear();
  self._visible.clear();
  self._previouslyVisible.clear();
  self._pinMap.clear();
  self._newVisible.clear();
  self._noLongerVisible.length = 0;
  self._visibleAgain.length = 0;
  self._evicted.length = 0;
};


/**
 * Remove all textures in the TextureStore, excluding unpinned textures.
 */
TextureStore.prototype.clearNotPinned = function() {

  var self = this;

  // Collect list of tiles to be evicted.
  self._evicted.length = 0;
  self._itemMap.each(function(tile) {
    if (!self._pinMap.has(tile)) {
      self._evicted.push(tile);
    }
  });

  // Evict tiles.
  self._evicted.forEach(function(tile) {
    self._unloadTile(tile);
  });

  // Clear all caches except the pinned set.
  self._visible.clear();
  self._previouslyVisible.clear();

  // Clear temporary variables.
  self._evicted.length = 0;
};


/**
 * Signal the beginning of a frame. Called from {@link Stage}.
 */
TextureStore.prototype.startFrame = function() {

  // Check that this is an appropriate state for startFrame to be called.
  if (this._clientPhase !== IdlePhase && this._clientPhase !== StartPhase) {
    throw new Error('TextureStore: startFrame called out of sequence');
  }

  // We are now in the start phase and expect one more call to endFrame
  // before the current frame is complete.
  this._clientPhase = StartPhase;
  this._clientCounter++;

  // Clear the set of visible tiles, which is populated by calls to markTile.
  this._newVisible.clear();

};


/**
 * Mark a tile within the current frame. Called from {@link Stage}.
 * @param {Tile} tile the tile to mark
 */
TextureStore.prototype.markTile = function(tile) {

  // Check that this is an appropriate state for markTile to be called.
  if (this._clientPhase !== StartPhase) {
    throw new Error('TextureStore: markTile called out of sequence');
  }

  // Refresh texture for dynamic assets.
  var item = this._itemMap.get(tile);
  var texture = item && item.texture();
  var asset = item && item.asset();
  if (texture && asset) {
    texture.refresh(tile, asset);
  }

  // Add tile to the visible set.
  this._newVisible.add(tile);

};


/**
 * Signal the end of a frame. Called from {@link Stage}.
 */
TextureStore.prototype.endFrame = function() {

  // Check that this is an appropriate state for endFrame to be called.
  if (this._clientPhase !== StartPhase && this._clientPhase !== EndPhase) {
    throw new Error('TextureStore: endFrame called out of sequence');
  }

  // We are now in the end phase and expect one less call to endFrame
  // before the current frame is complete.
  this._clientPhase = EndPhase;
  this._clientCounter--;

  // If all calls to startFrame have been matched by a corresponding call
  // to endFrame, process the frame and return to the idle phase.
  if (!this._clientCounter) {
    this._update();
    this._clientPhase = IdlePhase;
  }
};


TextureStore.prototype._update = function() {

  var self = this;

  // Calculate the set of tiles that used to be visible but no longer are.
  self._noLongerVisible.length = 0;
  self._visible.each(function(tile) {
    if (!self._newVisible.has(tile)) {
      self._noLongerVisible.push(tile);
    }
  });

  // Calculate the set of tiles that were visible recently and have become
  // visible again.
  self._visibleAgain.length = 0;
  self._newVisible.each(function(tile) {
    if (self._previouslyVisible.has(tile)) {
      self._visibleAgain.push(tile);
    }
  });

  // Remove tiles that have become visible again from the list of previously
  // visible tiles.
  self._visibleAgain.forEach(function(tile) {
    self._previouslyVisible.remove(tile);
  });

  // Cancel loading of tiles that are no longer visible.
  // Move no longer visible tiles with a loaded texture into the previously
  // visible set, and collect the tiles evicted from the latter.
  self._evicted.length = 0;
  self._noLongerVisible.forEach(function(tile) {
    var item = self._itemMap.get(tile);
    var texture = item && item.texture();
    if (texture) {
      var otherTile = self._previouslyVisible.add(tile);
      if (otherTile != null) {
        self._evicted.push(otherTile);
      }
    } else if (item) {
      self._unloadTile(tile);
    }
  });

  // Unload evicted tiles, unless they are pinned.
  self._evicted.forEach(function(tile) {
    if (!self._pinMap.has(tile)) {
      self._unloadTile(tile);
    }
  });

  // Load visible tiles that are not already in the store.
  // Refresh texture on visible tiles for dynamic assets.
  self._newVisible.each(function(tile) {
    var item = self._itemMap.get(tile);
    if (!item) {
      self._loadTile(tile);
    }
  });

  // Swap the old visible set with the new one.
  var tmp = self._visible;
  self._visible = self._newVisible;
  self._newVisible = tmp;

  // Clear temporary variables.
  self._noLongerVisible.length = 0;
  self._visibleAgain.length = 0;
  self._evicted.length = 0;

};


TextureStore.prototype._loadTile = function(tile) {
  if (this._itemMap.has(tile)) {
    throw new Error('TextureStore: loading texture already in cache');
  }
  var item = new TextureStoreItem(this, tile);
  this._itemMap.set(tile, item);
};


TextureStore.prototype._unloadTile = function(tile) {
  var item = this._itemMap.del(tile);
  if (!item) {
    throw new Error('TextureStore: unloading texture not in cache');
  }
  item.destroy();
};


TextureStore.prototype.asset = function(tile) {
  var item = this._itemMap.get(tile);
  if (item) {
    return item.asset();
  }
  return null;
};


TextureStore.prototype.texture = function(tile) {
  var item = this._itemMap.get(tile);
  if (item) {
    return item.texture();
  }
  return null;
};


/**
 * Pin a tile. Textures for pinned tiles are never evicted from the store.
 * Upon pinning, the texture is created if not already present. Pins are
 * reference-counted; a tile may be pinned multiple times and must be unpinned
 * the corresponding number of times. Pinning is useful e.g. to ensure that
 * the lowest-resolution level of an image is always available to fall back
 * onto.
 * @param {Tile} tile the tile to pin
 * @returns {number} the pin reference count.
 */
TextureStore.prototype.pin = function(tile) {
  // Increment reference count.
  var count = (this._pinMap.get(tile) || 0) + 1;
  this._pinMap.set(tile, count);
  // If the texture for the tile is not present, load it now.
  if (!this._itemMap.has(tile)) {
    this._loadTile(tile);
  }
  return count;
};


/**
 * Unpin a tile. Pins are reference-counted; a tile may be pinned multiple
 * times and must be unpinned the corresponding number of times.
 * @param {Tile} tile the tile to unpin
 * @returns {number} the pin reference count.
 */
TextureStore.prototype.unpin = function(tile) {
  var count = this._pinMap.get(tile);
  // Consistency check.
  if (!count) {
    throw new Error('TextureStore: unpin when not pinned');
  } else {
    // Decrement reference count.
    count--;
    if (count > 0) {
      this._pinMap.set(tile, count);
    } else {
      this._pinMap.del(tile);
      // If the tile does not belong to either the visible or previously
      // visible sets, evict it from the cache.
      if (!this._visible.has(tile) && !this._previouslyVisible.has(tile)) {
        this._unloadTile(tile);
      }
    }
  }
  return count;
};


/**
 * Return the state of a tile.
 * @param {Tile} tile the tile to query
 * @return {Object} state
 * @return {boolean} state.visible whether the tile is in the visible set
 * @return {boolean} state.previouslyVisible whether the tile is in the
                     previously visible set
 * @return {boolean} state.hasAsset whether the asset for the tile is present
 * @return {boolean} state.hasTexture whether the texture for the tile is present
 * @return {boolean} state.pinned whether the tile is pinned
 * @return {number} state.pinCount the pin reference count for the tile
 */
TextureStore.prototype.query = function(tile) {
  var item = this._itemMap.get(tile);
  var pinCount = this._pinMap.get(tile) || 0;
  return {
    visible: this._visible.has(tile),
    previouslyVisible: this._previouslyVisible.has(tile),
    hasAsset: item != null && item.asset() != null,
    hasTexture: item != null && item.texture() != null,
    pinned: pinCount !== 0,
    pinCount: pinCount
  };
};


module.exports = TextureStore;
