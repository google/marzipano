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

module.exports = {

  // Stages.
  WebGlStage: require('./stages/WebGl'),

  // Renderers.
  WebGlCubeRenderer: require('./renderers/WebGlCube'),
  WebGlFlatRenderer: require('./renderers/WebGlFlat'),
  WebGlEquirectRenderer: require('./renderers/WebGlEquirect'),
  registerDefaultRenderers: require('./renderers/registerDefaultRenderers'),

  // Geometries.
  CubeGeometry: require('./geometries/Cube'),
  FlatGeometry: require('./geometries/Flat'),
  EquirectGeometry: require('./geometries/Equirect'),

  // Views.
  RectilinearView: require('./views/Rectilinear'),
  FlatView: require('./views/Flat'),

  // Sources.
  ImageUrlSource: require('./sources/ImageUrl'),
  SingleAssetSource: require('./sources/SingleAsset'),

  // Assets.
  StaticAsset: require('./assets/Static'),
  DynamicAsset: require('./assets/Dynamic'),

  // Texture store.
  TextureStore: require('./TextureStore'),

  // Layer.
  Layer: require('./Layer'),

  // Render loop.
  RenderLoop: require('./RenderLoop'),

  // Controls.
  KeyControlMethod: require('./controls/Key'),
  DragControlMethod: require('./controls/Drag'),
  QtvrControlMethod: require('./controls/Qtvr'),
  ScrollZoomControlMethod: require('./controls/ScrollZoom'),
  PinchZoomControlMethod: require('./controls/PinchZoom'),
  VelocityControlMethod: require('./controls/Velocity'),
  ElementPressControlMethod: require('./controls/ElementPress'),
  Controls: require('./controls/Controls'),
  Dynamics: require('./controls/Dynamics'),

  // High-level API.
  Viewer: require('./Viewer'),
  Scene: require('./Scene'),

  // Hotspots.
  Hotspot: require('./Hotspot'),
  HotspotContainer: require('./HotspotContainer'),

  // Effects.
  colorEffects: require('./colorEffects'),

  // Miscellaneous functions.
  registerDefaultControls: require('./controls/registerDefaultControls'),
  autorotate: require('./autorotate'),

  // Utility functions.
  util: {
    async: require('./util/async'),
    cancelize: require('./util/cancelize'),
    chain: require('./util/chain'),
    clamp: require('./util/clamp'),
    clearOwnProperties: require('./util/clearOwnProperties'),
    cmp: require('./util/cmp'),
    compose: require('./util/compose'),
    convertFov: require('./util/convertFov'),
    decimal: require('./util/decimal'),
    defaults: require('./util/defaults'),
    defer: require('./util/defer'),
    degToRad: require('./util/degToRad'),
    delay: require('./util/delay'),
    dom: require('./util/dom'),
    extend: require('./util/extend'),
    hash: require('./util/hash'),
    inherits: require('./util/inherits'),
    mod: require('./util/mod'),
    noop: require('./util/noop'),
    now: require('./util/now'),
    once: require('./util/once'),
    pixelRatio: require('./util/pixelRatio'),
    radToDeg: require('./util/radToDeg'),
    real: require('./util/real'),
    retry: require('./util/retry'),
    tween: require('./util/tween'),
    type: require('./util/type')
  },

  // Expose dependencies for clients to use.
  dependencies: {
    bowser: require('bowser'),
    glMatrix: require('gl-matrix'),
    eventEmitter: require('minimal-event-emitter'),
    hammerjs: require('hammerjs')
  }
};
