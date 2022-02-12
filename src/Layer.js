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


import eventEmitter from "minimal-event-emitter";
import extend from "./util/extend";
import clearOwnProperties from "./util/clearOwnProperties";

/**
 * Signals that the layer has been rendered.
 *
 * @param {boolean} stable Whether all tiles were successfully rendered without
 *     missing textures or resorting to fallbacks.
 * @event Layer#renderComplete
 */

/**
 * @class Layer
 * @classdesc
 *
 * A Layer is a combination of {@link Source}, {@link Geometry}, {@link View}
 * and {@link TextureStore} that may be added into a {@link Stage} and rendered
 * with {@link Effects}.
 *
 * @param {Source} source
 * @param {Geometry} geometry
 * @param {View} view
 * @param {TextureStore} textureStore
 * @param {Object} opts
 * @param {Effects} opts.effects
*/
class Layer {
  constructor(source, geometry, view, textureStore, opts) {
    opts = opts || {};

    var self = this;

    this._source = source;
    this._geometry = geometry;
    this._view = view;
    this._textureStore = textureStore;

    this._effects = opts.effects || {};

    this._fixedLevelIndex = null;

    this._viewChangeHandler = function () {
      self.emit('viewChange', self.view());
    };

    this._view.addEventListener('change', this._viewChangeHandler);

    this._textureStoreChangeHandler = function () {
      self.emit('textureStoreChange', self.textureStore());
    };

    this._textureStore.addEventListener('textureLoad',
      this._textureStoreChangeHandler);
    this._textureStore.addEventListener('textureError',
      this._textureStoreChangeHandler);
    this._textureStore.addEventListener('textureInvalid',
      this._textureStoreChangeHandler);
  }
  /**
   * Destructor.
   */
  destroy() {
    this._view.removeEventListener('change', this._viewChangeHandler);
    this._textureStore.removeEventListener('textureLoad',
      this._textureStoreChangeHandler);
    this._textureStore.removeEventListener('textureError',
      this._textureStoreChangeHandler);
    this._textureStore.removeEventListener('textureInvalid',
      this._textureStoreChangeHandler);
    clearOwnProperties(this);
  }
  /**
   * Returns the underlying {@link Source source}.
   * @return {Source}
   */
  source() {
    return this._source;
  }
  /**
   * Returns the underlying {@link Geometry geometry}.
   * @return {Geometry}
   */
  geometry() {
    return this._geometry;
  }
  /**
   * Returns the underlying {@link View view}.
   * @return {View}
   */
  view() {
    return this._view;
  }
  /**
   * Returns the underlying {@link TextureStore texture store}.
   * @return {TextureStore}
   */
  textureStore() {
    return this._textureStore;
  }
  /**
   * Returns the currently set {@link Effects effects}.
   * @return {Effects}
   */
  effects() {
    return this._effects;
  }
  /**
   * Sets the {@link Effects effects}.
   * @param {Effects} effects
   */
  setEffects(effects) {
    this._effects = effects;
    this.emit('effectsChange', this._effects);
  }
  /**
   * Merges effects into the currently set ones. The merge is non-recursive; for
   * instance, if current effects are `{ rect: { relativeWidth: 0.5 } }`,
   * calling this method with `{ rect: { relativeX: 0.5 }}` will reset
   * `rect.relativeWidth`.
   *
   * @param {Effects} effects
   */
  mergeEffects(effects) {
    extend(this._effects, effects);
    this.emit('effectsChange', this._effects);
  }
  /**
   * Returns the fixed level index.
   * @return {(number|null)}
   */
  fixedLevel() {
    return this._fixedLevelIndex;
  }
  /**
   * Sets the fixed level index. When set, the corresponding level will be
   * used regardless of the view parameters. Unset with a null argument.
   *
   * @param {(number|null)} levelIndex
   * @throws An error if the level index is out of range.
   */
  setFixedLevel(levelIndex) {
    if (levelIndex !== this._fixedLevelIndex) {
      if (levelIndex != null && (levelIndex >= this._geometry.levelList.length ||
        levelIndex < 0)) {
        throw new Error("Level index out of range: " + levelIndex);
      }
      this._fixedLevelIndex = levelIndex;
      this.emit('fixedLevelChange', this._fixedLevelIndex);
    }
  }
  _selectLevel() {
    var level;
    if (this._fixedLevelIndex != null) {
      level = this._geometry.levelList[this._fixedLevelIndex];
    } else {
      level = this._view.selectLevel(this._geometry.selectableLevelList);
    }
    return level;
  }
  visibleTiles(result) {
    var level = this._selectLevel();
    return this._geometry.visibleTiles(this._view, level, result);
  }
  /**
   * Pin a whole level into the texture store.
   * @param {Number} levelIndex
   */
  pinLevel(levelIndex) {
    var level = this._geometry.levelList[levelIndex];
    var tiles = this._geometry.levelTiles(level);
    for (var i = 0; i < tiles.length; i++) {
      this._textureStore.pin(tiles[i]);
    }
  }
  /**
   * Unpin a whole level from the texture store.
   * @param {Number} levelIndex
   */
  unpinLevel(levelIndex) {
    var level = this._geometry.levelList[levelIndex];
    var tiles = this._geometry.levelTiles(level);
    for (var i = 0; i < tiles.length; i++) {
      this._textureStore.unpin(tiles[i]);
    }
  }
  /**
   * Pin the first level. Equivalent to `pinLevel(0)`.
   */
  pinFirstLevel() {
    return this.pinLevel(0);
  }
  /**
   * Unpin the first level. Equivalent to `unpinLevel(0)`.
   */
  unpinFirstLevel() {
    return this.unpinLevel(0);
  }
}

eventEmitter(Layer);

export default Layer;
