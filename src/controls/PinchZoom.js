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
import Dynamics from "./Dynamics";
import HammerGestures from "./HammerGestures";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class PinchZoomControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Control the view fov/zoom by pinching with two fingers.
 *
 * @param {Element} element Element to listen for events.
 * @param {string} pointerType Which Hammer.js pointer type to use
 * @param {Object} opts
 */
class PinchZoomControlMethod {
  constructor(element, pointerType, opts) {
    this._hammer = HammerGestures.get(element, pointerType);

    this._lastEvent = null;

    this._active = false;

    this._dynamics = new Dynamics();

    this._hammer.on('pinchstart', this._handleStart.bind(this));
    this._hammer.on('pinch', this._handleEvent.bind(this));
    this._hammer.on('pinchend', this._handleEnd.bind(this));
    this._hammer.on('pinchcancel', this._handleEnd.bind(this));
  }
  /**
   * Destructor.
   */
  destroy() {
    this._hammer.release();
    clearOwnProperties(this);
  }
  _handleStart() {
    if (!this._active) {
      this._active = true;
      this.emit('active');
    }
  }
  _handleEnd() {
    this._lastEvent = null;

    if (this._active) {
      this._active = false;
      this.emit('inactive');
    }
  }
  _handleEvent(e) {
    var scale = e.scale;

    if (this._lastEvent) {
      scale /= this._lastEvent.scale;
    }

    this._dynamics.offset = (scale - 1) * -1;
    this.emit('parameterDynamics', 'zoom', this._dynamics);

    this._lastEvent = e;
  }
}

eventEmitter(PinchZoomControlMethod);

export default PinchZoomControlMethod;
