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
// TODO: re-structure imports
import WebGlStage from "./stages/WebGl";

// Renderers.
import WebGlCubeRenderer from "./renderers/WebGlCube";
import WebGlFlatRenderer from "./renderers/WebGlFlat";
import WebGlEquirectRenderer from "./renderers/WebGlEquirect";
import registerDefaultRenderers from "./renderers/registerDefaultRenderers";

// Geometries.
import CubeGeometry from "./geometries/Cube";
import FlatGeometry from "./geometries/Flat";
import EquirectGeometry from "./geometries/Equirect";

// Views.
import RectilinearView from "./views/Rectilinear";
import FlatView from "./views/Flat";

// Sources.
import ImageUrlSource from "./sources/ImageUrl";
import SingleAssetSource from "./sources/SingleAsset";

// Assets.
import StaticAsset from "./assets/Static";
import DynamicAsset from "./assets/Dynamic";

// Texture store.
import TextureStore from "./TextureStore";

// Layer.
import Layer from "./Layer";

// Render loop.
import RenderLoop from "./RenderLoop";

// Controls.
import KeyControlMethod from "./controls/Key";
import DragControlMethod from "./controls/Drag";
import QtvrControlMethod from "./controls/Qtvr";
import ScrollZoomControlMethod from "./controls/ScrollZoom";
import PinchZoomControlMethod from "./controls/PinchZoom";
import VelocityControlMethod from "./controls/Velocity";
import ElementPressControlMethod from "./controls/ElementPress";
import Controls from "./controls/Controls";
import Dynamics from "./controls/Dynamics";

// High-level API.
import Viewer from "./Viewer";
import Scene from "./Scene";

// Hotspots.
import Hotspot from "./Hotspot";
import HotspotContainer from "./HotspotContainer";

// Effects.
import colorEffects from "./colorEffects";

// Miscellaneous functions.
import registerDefaultControls from "./controls/registerDefaultControls";
import autorotate from "./autorotate";

// Utility functions.
import async from "./util/async";
import cancelize from "./util/cancelize";
import chain from "./util/chain";
import clamp from "./util/clamp";
import clearOwnProperties from "./util/clearOwnProperties";
import cmp from "./util/cmp";
import compose from "./util/compose";
import convertFov from "./util/convertFov";
import decimal from "./util/decimal";
import defaults from "./util/defaults";
import defer from "./util/defer";
import degToRad from "./util/degToRad";
import delay from "./util/delay";
import dom from "./util/dom";
import extend from "./util/extend";
import hash from "./util/hash";
import mod from "./util/mod";
import noop from "./util/noop";
import now from "./util/now";
import once from "./util/once";
import pixelRatio from "./util/pixelRatio";
import radToDeg from "./util/radToDeg";
import real from "./util/real";
import retry from "./util/retry";
import tween from "./util/tween";
import type from "./util/type";

// Expose dependencies for clients to use.
import bowser from "bowser";
import * as glMatrix from "gl-matrix";
import eventEmitter from "minimal-event-emitter";
import hammerjs from "hammerjs";

export default {
  // Stages.
  WebGlStage,

  // Renderers.
  WebGlCubeRenderer,
  WebGlFlatRenderer,
  WebGlEquirectRenderer,
  registerDefaultRenderers,

  // Geometries.
  CubeGeometry,
  FlatGeometry,
  EquirectGeometry,

  // Views.
  RectilinearView,
  FlatView,

  // Sources.
  ImageUrlSource,
  SingleAssetSource,

  // Assets.
  StaticAsset,
  DynamicAsset,

  // Texture store.
  TextureStore,

  // Layer.
  Layer,

  // Render loop.
  RenderLoop,

  // Controls.
  KeyControlMethod,
  DragControlMethod,
  QtvrControlMethod,
  ScrollZoomControlMethod,
  PinchZoomControlMethod,
  VelocityControlMethod,
  ElementPressControlMethod,
  Controls,
  Dynamics,

  // High-level API.
  Viewer,
  Scene,

  // Hotspots.
  Hotspot,
  HotspotContainer,

  // Effects.
  colorEffects,

  // Miscellaneous functions.
  registerDefaultControls,
  autorotate,

  // Utility functions.
  util: {
    async,
    cancelize,
    chain,
    clamp,
    clearOwnProperties,
    cmp,
    compose,
    convertFov,
    decimal,
    defaults,
    defer,
    degToRad,
    delay,
    dom,
    extend,
    hash,
    mod,
    noop,
    now,
    once,
    pixelRatio,
    radToDeg,
    real,
    retry,
    tween,
    type,
  },

  // Expose dependencies for clients to use.
  dependencies: {
    bowser,
    glMatrix,
    eventEmitter,
    hammerjs,
  },
};
