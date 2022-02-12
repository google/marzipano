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
import defaults from "../util/defaults";
import { maxFriction as maxFriction } from "./util";
import clearOwnProperties from "../util/clearOwnProperties";


var defaultOptions = {
  speed: 8,
  friction: 6,
  maxFrictionTime: 0.3
};


/**
 * @class QtvrControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Controls the view by holding the mouse button down and moving it.
 * Also known as "QTVR" control mode.
 *
 * @param {Element} element Element to listen for events.
 * @param {string} pointerType Which Hammer.js pointer type to use (e.g.
 * `mouse` or `touch`).
 * @param {Object} opts
 * @param {number} opts.speed
 * @param {number} opts.friction
 * @param {number} opts.maxFrictionTime
 */
// TODO: allow speed not change linearly with distance to click spot.
// Quadratic or other would allow a larger speed range.
function QtvrControlMethod(element, pointerType, opts) {
  this._element = element;

  this._opts = defaults(opts || {}, defaultOptions);

  this._active = false;

  this._hammer = HammerGestures.get(element, pointerType);

  this._dynamics = {
    x: new Dynamics(),
    y: new Dynamics()
  };

  this._hammer.on('panstart', this._handleStart.bind(this));
  this._hammer.on('panmove', this._handleMove.bind(this));
  this._hammer.on('panend', this._handleRelease.bind(this));
  this._hammer.on('pancancel', this._handleRelease.bind(this));
}

eventEmitter(QtvrControlMethod);

/**
 * Destructor.
 */
QtvrControlMethod.prototype.destroy = function() {
  this._hammer.release();
  clearOwnProperties(this);
};


QtvrControlMethod.prototype._handleStart = function(e) {
  // Prevent event dragging other DOM elements and causing strange behavior on Chrome
  e.preventDefault();

  if (!this._active) {
    this._active = true;
    this.emit('active');
  }
};


QtvrControlMethod.prototype._handleMove = function(e) {
  // Prevent event dragging other DOM elements and causing strange behavior on Chrome
  e.preventDefault();

  this._updateDynamics(e, false);
};


QtvrControlMethod.prototype._handleRelease = function(e) {
  // Prevent event dragging other DOM elements and causing strange behavior on Chrome
  e.preventDefault();

  this._updateDynamics(e, true);

  if (this._active) {
    this._active = false;
    this.emit('inactive');
  }
};


var tmpReleaseFriction = [ null, null ];
QtvrControlMethod.prototype._updateDynamics = function(e, release) {
  var elementRect = this._element.getBoundingClientRect();
  var width = elementRect.right - elementRect.left;
  var height = elementRect.bottom - elementRect.top;
  var maxDim = Math.max(width, height);

  var x = e.deltaX / maxDim * this._opts.speed;
  var y = e.deltaY / maxDim * this._opts.speed;

  this._dynamics.x.reset();
  this._dynamics.y.reset();
  this._dynamics.x.velocity = x;
  this._dynamics.y.velocity = y;

  if (release) {
    maxFriction(this._opts.friction, this._dynamics.x.velocity, this._dynamics.y.velocity, this._opts.maxFrictionTime, tmpReleaseFriction);
    this._dynamics.x.friction = tmpReleaseFriction[0];
    this._dynamics.y.friction = tmpReleaseFriction[1];
  }

  this.emit('parameterDynamics', 'x', this._dynamics.x);
  this.emit('parameterDynamics', 'y', this._dynamics.y);
};


export default QtvrControlMethod;
