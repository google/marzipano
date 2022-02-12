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

/**
 * @class RendererRegistry
 * @classdesc
 *
 * A RendererRegistry maps pairs of {@link Geometry} and {@link View} type into
 * the appropriate {@link Renderer} class. It is used by a {@link Stage} to
 * determine the appropriate renderer for a {@link Layer}.
 *
 * See also {@link Stage#registerRenderer}.
 */
class RendererRegistry {
  constructor() {
    this._renderers = {};
  }
  /**
   * Registers a renderer for the given geometry and view type.
   * @param {string} geometryType The geometry type, as given by
   *     {@link Geometry#type}.
   * @param {string} viewType The view type, as given by {@link View#type}.
   * @param {*} Renderer The renderer class.
   */
  set(geometryType, viewType, Renderer) {
    if (!this._renderers[geometryType]) {
      this._renderers[geometryType] = {};
    }
    this._renderers[geometryType][viewType] = Renderer;
  }
  /**
   * Retrieves the renderer for the given geometry and view type.
   * @param {string} geometryType The geometry type, as given by
   *     {@link Geometry#type}.
   * @param {string} viewType The view type, as given by {@link View#type}.
   * @param {*} Renderer The renderer class, or null if no such renderer has been
   * registered.
   */
  get(geometryType, viewType) {
    var Renderer = this._renderers[geometryType] &&
      this._renderers[geometryType][viewType];
    return Renderer || null;
  }
}

export default RendererRegistry;
