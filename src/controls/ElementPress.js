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
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class ElementPressControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Sets the velocity and friction of a single parameter by pressing and
 * unpressing a DOM element.
 *
 * @param {Element} element Element which activates the method when pressed
 * @param {string} parameter The parameter to be controlled (e.g. `x`, `y` or `zoom`)
 * @param {number} velocity Velocity at which the parameter changes. Use a
 * negative number for opposite direction
 * @param {number} friction Friction at which the parameter stops
*/
function ElementPressControlMethod(element, parameter, velocity, friction) {
  if(!element) {
    throw new Error("ElementPressControlMethod: element must be defined");
  }
  if(!parameter) {
    throw new Error("ElementPressControlMethod: parameter must be defined");
  }
  if(!velocity) {
    throw new Error("ElementPressControlMethod: velocity must be defined");
  }
  if(!friction) {
    throw new Error("ElementPressControlMethod: friction must be defined");
  }

  this._element = element;

  this._pressHandler = this._handlePress.bind(this);
  this._releaseHandler = this._handleRelease.bind(this);

  element.addEventListener('mousedown', this._pressHandler);
  element.addEventListener('mouseup', this._releaseHandler);
  element.addEventListener('mouseleave', this._releaseHandler);
  element.addEventListener('touchstart', this._pressHandler);
  element.addEventListener('touchmove', this._releaseHandler);
  element.addEventListener('touchend', this._releaseHandler);

  this._parameter = parameter;
  this._velocity = velocity;
  this._friction = friction;
  this._dynamics = new Dynamics();

  this._pressing = false;
}
eventEmitter(ElementPressControlMethod);

/**
 * Destructor.
 */
ElementPressControlMethod.prototype.destroy = function() {
  this._element.removeEventListener('mousedown', this._pressHandler);
  this._element.removeEventListener('mouseup', this._releaseHandler);
  this._element.removeEventListener('mouseleave', this._releaseHandler);
  this._element.removeEventListener('touchstart', this._pressHandler);
  this._element.removeEventListener('touchmove', this._releaseHandler);
  this._element.removeEventListener('touchend', this._releaseHandler);
  clearOwnProperties(this);
};

ElementPressControlMethod.prototype._handlePress = function() {
  this._pressing = true;

  this._dynamics.velocity = this._velocity;
  this._dynamics.friction = 0;
  this.emit('parameterDynamics', this._parameter, this._dynamics);
  this.emit('active');
};

ElementPressControlMethod.prototype._handleRelease = function() {
  if(this._pressing) {
    this._dynamics.friction = this._friction;
    this.emit('parameterDynamics', this._parameter, this._dynamics);
    this.emit('inactive');
  }

  this._pressing = false;
};

export default ElementPressControlMethod;
