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

import Map from "./collections/Map";
import Set from "./collections/Set";
import LruSet from "./collections/LruSet";
import eventEmitter from "minimal-event-emitter";
import defaults from "./util/defaults";
import retry from "./util/retry";
import chain from "./util/chain";
import inherits from "./util/inherits";
import clearOwnProperties from "./util/clearOwnProperties";

var debug = typeof MARZIPANODEBUG !== 'undefined' && MARZIPANODEBUG.textureStore;


// A Stage informs the TextureStore about the set of visible tiles during a
// frame by calling startFrame, markTile and endFrame. In a particular frame,
// TextureStore expects one or more calls to startFrame, followed by zero or
// more calls to markTile, followed by one or more calls to endFrame. The
// number of calls to startFrame and endFrame must match. Calls to other
// TextureStore methods may be freely interleaved with this sequence.
//
// At any given time, TextureStore is in one of four states. The START state
// corresponds to the interval between the first startFrame and the first
// markTile of a frame. The MARK state corresponds to the interval between the
// first markTile and the first endFrame. The END state corresponds to the
// interval between the first and the last endFrame. At any other time, the
// TextureStore is in the IDLE state.
var State = {
  IDLE: 0,
  START: 1,
  MARK: 2,
  END: 3
};


var defaultOptions = {
  // Maximum number of cached textures for previously visible tiles.
  previouslyVisibleCacheSize: 512
};


// Assign an id to each operation so we can track its state.
// We actually only need this in debug mode, but the code is less convoluted
// if we track unconditionally, and the performance hit is minimal anyway.
var nextId = 0;


// Distinguishes a cancellation from other kinds of errors.
function CancelError() {}
inherits(CancelError, Error);


/**
 * @class TextureStoreItem
 * @classdesc
 *
 * An item saved in a {@link TextureStore}.
 *
 * Clients do not need to instantiate this. It is automatically instantiated by
 * a {@link TextureStore} to manage the lifetime of a stored item: loading,
 * refreshing, unloading and emitting associated events.
 *
 * @param {TextureStore} store The underlying {@link TextureStore}.
 * @param {Tile} tile The underlying tile.
 */
function TextureStoreItem(store, tile) {

  var self = this;

  var id = nextId++;

  self._id = id;
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

  store.emit('textureStartLoad', tile);
  if (debug) {
    console.log('loading', id, tile);
  }

  self._cancel = fn(stage, tile, function(err, _tile, asset, texture) {

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
        store.emit('textureCancel', tile);
        if (debug) {
          console.log('cancel', id, tile);
        }
      } else {
        store.emit('textureError', tile, err);
        if (debug) {
          console.log('error', id, tile);
        }
      }

      return;
    }

    // Save a local reference to the texture.
    self._texture = texture;

    // If the asset is dynamic, save a local reference to it and set up a
    // handler to be called whenever it changes. Otherwise, destroy the asset
    // as we won't be needing it any longer.
    if (asset.isDynamic()) {
      self._asset = asset;
      asset.addEventListener('change', self._changeHandler);
    } else {
      asset.destroy();
    }

    // Emit event.
    store.emit('textureLoad', tile);
    if (debug) {
      console.log('load', id, tile);
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
  var id = this._id;
  var store = this._store;
  var tile = this._tile;
  var asset = this._asset;
  var texture = this._texture;
  var cancel = this._cancel;

  if (cancel) {
    // The texture is still loading, so cancel it.
    cancel(new CancelError('Texture load cancelled'));
    return;
  }

  // Destroy asset.
  if (asset) {
    asset.removeEventListener('change', this._changeHandler);
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

  clearOwnProperties(this);
};

eventEmitter(TextureStoreItem);

/**
 * Signals that a texture has started to load.
 *
 * This event is followed by either {@link TextureStore#textureLoad},
 * {@link TextureStore#textureError} or {@link TextureStore#textureCancel}.
 *
 * @event TextureStore#textureStartLoad
 * @param {Tile} tile The tile for which the texture has started to load.
 */

/**
 * Signals that a texture has been loaded.
 *
 * @event TextureStore#textureLoad
 * @param {Tile} tile The tile for which the texture was loaded.
 */

/**
 * Signals that a texture has been unloaded.
 *
 * @event TextureStore#textureUnload
 * @param {Tile} tile The tile for which the texture was unloaded.
 */

/**
 * Signals that a texture has been invalidated.
 *
 * This event may be raised for a texture with an underlying dynamic asset. It
 * may only occur while the texture is loaded, i.e., in between
 * {@link TextureStore#textureLoad} and {@link TextureStore#textureUnload}.
 *
 * @event TextureStore#textureInvalid
 * @param {Tile} tile The tile for which the texture was invalidated.
 */

/**
 * Signals that loading a texture has been cancelled.
 *
 * This event may follow {@link TextureStore#textureStartLoad} if the texture
 * becomes unnecessary before it finishes loading.
 *
 * @event TextureStore#textureCancel
 * @param {Tile} tile The tile for which the texture loading was cancelled.
 */

/**
 * Signals that loading a texture has failed.
 *
 * This event may follow {@link TextureStore#textureStartLoad} if the texture
 * fails to load.
 *
 * @event TextureStore#textureError
 * @param {Tile} tile The tile for which the texture loading has failed.
 */

/**
 * @class TextureStore
 * @classdesc
 *
 * A TextureStore maintains a cache of textures used to render a {@link Layer}.
 *
 * A {@link Stage} communicates with the TextureStore through the startFrame(),
 * markTile() and endFrame() methods, which indicate the tiles that are visible
 * in the current frame. Textures for visible tiles are loaded and retained
 * as long as the tiles remain visible. A limited amount of textures whose
 * tiles were previously visible are cached according to an LRU policy. Tiles
 * may be pinned to keep their respective textures cached even when they are
 * invisible; these textures do not count towards the previously visible limit.
 *
 * Multiple layers belonging to the same underlying {@link WebGlStage} may
 * share the same TextureStore. Layers belonging to distinct {@link WebGlStage}
 * instances may not do so due to restrictions on the use of textures across
 * stages.
 *
 * @param {Source} source The underlying source.
 * @param {Stage} stage The underlying stage.
 * @param {Object} opts Options.
 * @param {Number} [opts.previouslyVisibleCacheSize=32] The maximum number of
 *     previously visible textures to cache according to an LRU policy.
 */
function TextureStore(source, stage, opts) {
  opts = defaults(opts || {}, defaultOptions);

  this._source = source;
  this._stage = stage;

  // The current state.
  this._state = State.IDLE;

  // The number of startFrame calls yet to be matched by endFrame calls during
  // the current frame.
  this._delimCount = 0;

  // The cache proper: map cached tiles to their respective textures/assets.
  this._itemMap = new Map();

  // The subset of cached tiles that are currently visible.
  this._visible = new Set();

  // The subset of cached tiles that were visible recently, but are not
  // visible right now. Newly inserted tiles replace older ones.
  this._previouslyVisible = new LruSet(opts.previouslyVisibleCacheSize);

  // The subset of cached tiles that should never be evicted from the cache.
  // A tile may be pinned more than once; map each tile into a reference count.
  this._pinMap = new Map();

  // Temporary variables.
  this._newVisible = new Set();
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
  clearOwnProperties(this);
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
  self._itemMap.forEach(function(tile) {
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
  self._itemMap.forEach(function(tile) {
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
  // Check that we are in an appropriate state.
  if (this._state !== State.IDLE && this._state !== State.START) {
    throw new Error('TextureStore: startFrame called out of sequence');
  }

  // Enter the START state, if not already there.
  this._state = State.START;

  // Expect one more endFrame call.
  this._delimCount++;
};


/**
 * Mark a tile as visible within the current frame. Called from {@link Stage}.
 * @param {Tile} tile The tile to mark.
 */
TextureStore.prototype.markTile = function(tile) {
  // Check that we are in an appropriate state.
  if (this._state !== State.START && this._state !== State.MARK) {
    throw new Error('TextureStore: markTile called out of sequence');
  }

  // Enter the MARK state, if not already there.
  this._state = State.MARK;

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
  // Check that we are in an appropriate state.
  if (this._state !== State.START && this._state !== State.MARK && this._state !== State.END) {
    throw new Error('TextureStore: endFrame called out of sequence');
  }

  // Enter the END state, if not already there.
  this._state = State.END;

  // Expect one less call to endFrame.
  this._delimCount--;

  // If no further calls are expected, process frame and enter the IDLE state.
  if (!this._delimCount) {
    this._update();
    this._state = State.IDLE;
  }
};


TextureStore.prototype._update = function() {
  var self = this;

  // Calculate the set of tiles that used to be visible but no longer are.
  self._noLongerVisible.length = 0;
  self._visible.forEach(function(tile) {
    if (!self._newVisible.has(tile)) {
      self._noLongerVisible.push(tile);
    }
  });

  // Calculate the set of tiles that were visible recently and have become
  // visible again.
  self._visibleAgain.length = 0;
  self._newVisible.forEach(function(tile) {
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
  self._newVisible.forEach(function(tile) {
    var item = self._itemMap.get(tile);
    if (!item) {
      self._loadTile(tile);
    }
  });

  // Swap the old visible set with the new one.
  var tmp = self._visible;
  self._visible = self._newVisible;
  self._newVisible = tmp;

  // Clear the new visible set.
  self._newVisible.clear();

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
 * Return type for {@link TextureStore#query}.
 * @typedef {Object} TileState
 * @property {boolean} visible Whether the tile is in the visible set.
 * @property {boolean} previouslyVisible Whether the tile is in the previously
 *     visible set.
 * @property {boolean} hasAsset Whether the asset for the tile is present.
 * @property {boolean} hasTexture Whether the texture for the tile is present.
 * @property {boolean} pinned Whether the tile is in the pinned set.
 * @property {number} pinCount The pin reference count for the tile.
 */


/**
 * Return the state of a tile.
 * @param {Tile} tile The tile to query.
 * @return {TileState}
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


export default TextureStore;
