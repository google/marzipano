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

var eventEmitter = require('minimal-event-emitter');
var WorkQueue = require('../collections/WorkQueue');
var calcRect = require('../calcRect');
var async = require('../util/async');
var cancelize = require('../util/cancelize');

var RendererRegistry = require('./RendererRegistry');


// Time to wait before creating successive textures, in milliseconds.
// We wait for at least one frame to be rendered between assets.
// This improves performance significantly on older iOS devices.
var createTextureDelay = 20;


function reverseTileCmp(t1, t2) {
  return -t1.cmp(t2);
}


/**
 * @interface
 * @classdesc A Stage is a container with the ability to render a stack of
 * {@Layer layers}.
 *
 * This is a superclass containing logic that is common to all implementations;
 * it should never be instantiated directly. Instead, use one of the
 * subclasses: {@link WebGlStage}, {@link CssStage}, {@link FlashStage}.
 */
function Stage(opts) {

  // Must be set by subclasses.
  this._domElement = null;

  this._layers = [];
  this._renderers = [];

  this._visibleTiles = [];
  this._fallbackTiles = {
    children: [],
    parents: []
  };

  this._tmpTiles = [];

  // Cached stage dimensions.
  this._width = null;
  this._height = null;

  // Temporary variable for rect.
  this._rect = {};

  // Work queue for createTexture.
  this._createTextureWorkQueue = new WorkQueue({
    delay: createTextureDelay
  });

  // Function to emit event when render parameters have changed.
  this.emitRenderInvalid = this.emitRenderInvalid.bind(this);

  // The renderer registry maps each geometry/view pair into the respective
  // Renderer class.
  this._rendererRegistry = new RendererRegistry();
}

eventEmitter(Stage);


/**
 * Destructor.
 */
Stage.prototype.destroy = function() {
  this.removeAllLayers();
  this._layers = null;
  this._renderers = null;
  this._visibleTiles = null;
  this._fallbackTiles = null;
  this._tmpTiles = null;
  this._width = null;
  this._height = null;
  this._createTextureWorkQueue = null;
  this.emitRenderInvalid = null;
  this._rendererRegistry = null;
};


Stage.prototype.registerRenderer = function(geometryType, viewType, Renderer) {
  return this._rendererRegistry.set(geometryType, viewType, Renderer);
};


/**
 * @return {HTMLElement} DOM element where layers are rendered
 */
Stage.prototype.domElement = function() {
  return this._domElement;
};


/**
 * Get the stage width.
 * @return {number}
 */
Stage.prototype.width = function() {
  return this._width;
};


/**
 * Get the stage height.
 * @return {number}
 */
Stage.prototype.height = function() {
  return this._height;
};


/**
 * Get the stage dimensions. If an object argument is supplied, the object is
 * filled in with the result and returned. Otherwise, a fresh object is
 * returned.
 *
 * @param {Object} obj
 * @param {number} obj.width
 * @param {number} obj.height
 */
Stage.prototype.size = function(obj) {
  obj = obj || {};
  obj.width = this._width;
  obj.height = this._height;
  return obj;
};


/**
 * Set the stage dimensions.
 *
 * This contains the size update logic common to all stage types. Subclasses
 * define the _setSize() method to perform their own logic, if required.
 *
 * @param {Object} obj
 * @param {number} obj.width
 * @param {number} obj.height
 *
 */
Stage.prototype.setSize = function(size) {
  this._width = size.width;
  this._height = size.height;

  this._setSize(); // must be defined by subclasses.

  this.emit('resize');
  this.emitRenderInvalid();
};


Stage.prototype.emitRenderInvalid = function() {
  this.emit('renderInvalid');
};


/**
 * Add a {@link Layer} into the stage.
 * @param {Layer} layer
 * @throws Throws an error if the layer already belongs to the stage.
 */
Stage.prototype.addLayer = function(layer) {
  if (this._layers.indexOf(layer) >= 0) {
    throw new Error('Layer already in stage');
  }

  this._validateLayer(layer);

  this._layers.push(layer);
  this._renderers.push(null);

  // Listeners for render invalid.
  layer.addEventListener('viewChange', this.emitRenderInvalid);
  layer.addEventListener('effectsChange', this.emitRenderInvalid);
  layer.addEventListener('fixedLevelChange', this.emitRenderInvalid);
  layer.addEventListener('textureStoreChange', this.emitRenderInvalid);

  this.emitRenderInvalid();
};


/**
 * Remove a {@link Layer} from the stage.
 * @param {Layer} layer
 * @throws Throws an error if the layer does not belong to the stage.
 */
Stage.prototype.removeLayer = function(layer) {
  var index = this._layers.indexOf(layer);
  if (index < 0) {
    throw new Error('No such layer in stage');
  }

  var removedLayer = this._layers.splice(index, 1)[0];
  var renderer = this._renderers.splice(index, 1)[0];

  // Renderer is created by _updateRenderer(), so it may not always exist.
  if (renderer) {
    this.destroyRenderer(renderer);
  }

  removedLayer.removeEventListener('viewChange', this.emitRenderInvalid);
  removedLayer.removeEventListener('effectsChange', this.emitRenderInvalid);
  removedLayer.removeEventListener('fixedLevelChange', this.emitRenderInvalid);
  removedLayer.removeEventListener('textureStoreChange', this.emitRenderInvalid);

  this.emitRenderInvalid();
};


/**
 * Remove all {@link Layer layers} from the stage.
 */
Stage.prototype.removeAllLayers = function() {
  while (this._layers.length > 0) {
    this.removeLayer(this._layers[0]);
  }
};


/**
 * Return a list of all {@link Layer layers} contained in the stage.
 * @return {Layer[]}
 */
Stage.prototype.listLayers = function() {
  // Return a copy to prevent unintended mutation by the caller.
  return [].concat(this._layers);
};


/**
 * Return whether the stage contains a {@link Layer}.
 * @param {Layer} layer
 * @return {boolean}
 */
Stage.prototype.hasLayer = function(layer) {
  return this._layers.indexOf(layer) >= 0;
};


/**
 * Move a {@link Layer} to the given position in the stack.
 * @param {Layer} layer
 * @param {Number} i
 * @throws Throws an error if the layer does not belong to the stage or the
 *         new position is invalid.
 */
Stage.prototype.moveLayer = function(layer, i) {
  if (i < 0 || i >= this._layers.length) {
    throw new Error('Cannot move layer out of bounds');
  }

  var index = this._layers.indexOf(layer);
  if (index < 0) {
    throw new Error('No such layer in stage');
  }

  layer = this._layers.splice(index, 1)[0];
  var renderer = this._renderers.splice(index, 1)[0];

  this._layers.splice(i, 0, layer);
  this._renderers.splice(i, 0, renderer);

  this.emitRenderInvalid();
};


/**
 * Render the current frame. Usually called from a {@link RenderLoop}.
 *
 * This contains the rendering logic common to all stage types. Subclasses
 * define the startFrame() and endFrame() methods to perform their own logic.
 */
Stage.prototype.render = function() {

  var i;

  var visibleTiles = this._visibleTiles;
  var fallbackTiles = this._fallbackTiles;

  // Get the stage dimensions.
  var width = this._width;
  var height = this._height;

  var rect = this._rect;

  if (width <= 0 || height <= 0) {
    return;
  }

  this.startFrame(); // defined by subclasses

  // Signal start of frame to the texture stores.
  for (i = 0; i < this._layers.length; i++) {
    this._layers[i].textureStore().startFrame();
  }

  // Render layers.
  for (i = 0; i < this._layers.length; i++) {
    var layer = this._layers[i];
    var effects = layer.effects();
    var view = layer.view();
    var renderer = this._updateRenderer(i);
    var depth = this._layers.length - i;
    var textureStore = layer.textureStore();

    // Update the view size.
    // TODO: avoid doing this on every frame.
    calcRect(width, height, effects && effects.rect, rect);
    if (rect.width <= 0 || rect.height <= 0) {
      // Skip rendering on a null viewport.
      continue;
    }
    view.setSize(rect);

    // Get the visible tiles for the current layer.
    visibleTiles.length = 0;
    layer.visibleTiles(visibleTiles);

    // Signal start of layer to the renderer.
    renderer.startLayer(layer, rect);

    // Because of the way in which WebGl blending works, children tiles which
    // overlap with their parents must to be rendered before their parents for
    // transparent layers to work properly.
    //
    // Once something is rendered, whenever something rendered after that
    // fails the depth buffer test, it is discarded. We want the sections of
    // tiles that are below their children to be discarded, so that we don't
    // see both parent and child when a layer is transparent.
    //
    // Hence, children fallbacks must be rendered before parent fallbacks.

    var parentFallbacks = fallbackTiles.parents;
    var childrenFallbacks = fallbackTiles.children;

    // Clear the fallback tile sets.
    childrenFallbacks.length = 0;
    parentFallbacks.length = 0;

    // Render the visible tiles and collect fallback tiles.
    this._renderTiles(visibleTiles, textureStore, renderer, layer, depth, true);

    // Render the fallback tiles.
    this._renderTiles(childrenFallbacks, textureStore, renderer, layer, depth, false);

    // Parent tiles have to be sorted to be drawn from front to back, so that
    // higher level parents hide the sections of lower level parents behind
    // them by virtue of depth testing.
    parentFallbacks.sort(reverseTileCmp);
    this._renderTiles(parentFallbacks, textureStore, renderer, layer, depth, false);

    // Signal end of layer to the renderer.
    renderer.endLayer(layer, rect);
  }

  // Signal end of frame to the texture stores.
  for (i = 0; i < this._layers.length; i++) {
    this._layers[i].textureStore().endFrame();
  }

  this.endFrame(); // defined by subclasses

};


Stage.prototype._updateRenderer = function(layerIndex) {
  var layer = this._layers[layerIndex];

  var stageType = this.type;
  var geometryType = layer.geometry().type;
  var viewType = layer.view().type;

  var Renderer = this._rendererRegistry.get(geometryType, viewType);
  if (!Renderer) {
    throw new Error('No ' + stageType + ' renderer avaiable for ' + geometryType + ' geometry and ' + viewType + ' view');
  }

  var currentRenderer = this._renderers[layerIndex];

  if (!currentRenderer) {
    // If layer does not have a renderer, create it now.
    this._renderers[layerIndex] = this.createRenderer(Renderer);
  }
  else if (!(currentRenderer instanceof Renderer)) {
    // If the existing renderer is of the wrong type, replace it.
    this._renderers[layerIndex] = this.createRenderer(Renderer);
    this.destroyRenderer(currentRenderer);
  }

  return this._renderers[layerIndex];
};


Stage.prototype._renderTiles = function(tiles, textureStore, renderer, layer, depth, fallback) {
  for (var tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    var tile = tiles[tileIndex];

    // Mark tile as visible in this frame. This forces a texture refresh.
    textureStore.markTile(tile);

    // If there is a texture for the tile, send the pair into the renderer.
    // Otherwise, if we are collecting fallbacks, try to get one.
    var texture = textureStore.texture(tile);
    if (texture) {
      renderer.renderTile(tile, texture, layer, depth, tileIndex);
    } else if (fallback) {
      this._fallback(tile, textureStore);
    }
  }
};


Stage.prototype._fallback = function(tile, textureStore) {
  // Fallback to children if available, otherwise fall back to parent.
  return (this._childrenFallback(tile, textureStore) ||
          this._parentFallback(tile, textureStore));
};


Stage.prototype._parentFallback = function(tile, textureStore) {
  var result = this._fallbackTiles.parents;
  // Find the closest parent with a loaded texture.
  while ((tile = tile.parent()) != null) {
    if (tile && textureStore.texture(tile)) {
      // Make sure we do not add duplicate tiles.
      for (var i = 0; i < result.length; i++) {
        if (tile.equals(result[i])) {
          // Use the already present parent as a fallback.
          return true;
        }
      }
      // Use this parent as a fallback.
      result.push(tile);
      return true;
    }
  }

  // No parent fallback available.
  return false;
};


Stage.prototype._childrenFallback = function(tile, textureStore) {

  // Recurse into children until a level with available textures is found.
  // However, do not recurse any further when the number of children exceeds 1,
  // event if we still haven't found a viable fallback; this prevents falling
  // back on an exponential number of tiles.
  //
  // In practice, this means that equirectangular geometries (where there is
  // a single tile per level) will fall back to any level, while cube/flat
  // geometries (where the number of children typically, though not necessarily,
  // doubles per level) will only fallback into the immediate next level.

  var result = this._fallbackTiles.children;

  var tmp = this._tmpTiles;
  tmp.length = 0;

  // If we are on the last level, there are no children to fall back to.
  if (!tile.children(tmp)) {
    return false;
  }

  // If tile has a single child with no texture, recurse into next level.
  if (tmp.length === 1 && !textureStore.texture(tmp[0])) {
    return this._childrenFallback(tmp[0], textureStore, result);
  }

  // Copy tiles into result set and check whether level is complete.
  var incomplete = false;
  for (var i = 0; i < tmp.length; i++) {
    if (textureStore.texture(tmp[i])) {
      result.push(tmp[i]);
    } else {
      incomplete = true;
    }
  }

  // If at least one child texture is not available, we still need
  // the parent fallback. A false return value indicates this.
  return !incomplete;

};


/**
 * Create a texture for the given tile and asset. Called by {@link TextureStore}.
 * @param {Tile} tile
 * @param {Asset} asset
 * @param {Function} done
 */
Stage.prototype.createTexture = function(tile, asset, done) {

  var self = this;

  function makeTexture() {
    return new self.TextureClass(self, tile, asset);
  }

  var fn = cancelize(async(makeTexture));

  return this._createTextureWorkQueue.push(fn, function(err, texture) {
    done(err, tile, asset, texture);
  });

};


module.exports = Stage;
