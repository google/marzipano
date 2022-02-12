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
 * @class VelocityControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Sets the velocity and friction of a single parameter.
 *
 * The user should emit 'active' and 'inactive' events if required.
 *
 * @param {String} parameter The parameter to be controlled (e.g. `x`, `y` or `zoom`)
*/
function VelocityControlMethod(parameter) {
  if(!parameter) {
    throw new Error("VelocityControlMethod: parameter must be defined");
  }

  this._parameter = parameter;
  this._dynamics = new Dynamics();
}
eventEmitter(VelocityControlMethod);

/**
 * Destructor.
 */
VelocityControlMethod.prototype.destroy = function() {
  clearOwnProperties(this);
};

/**
 * Set the parameter's velocity.
 * @param {Number} velocity
 */
VelocityControlMethod.prototype.setVelocity = function(velocity) {
  this._dynamics.velocity = velocity;
  this.emit('parameterDynamics', this._parameter, this._dynamics);
};

/**
 * Set the parameter's friction.
 * @param {Number} friction
 */
VelocityControlMethod.prototype.setFriction = function(friction) {
  this._dynamics.friction = friction;
  this.emit('parameterDynamics', this._parameter, this._dynamics);
};

export default VelocityControlMethod;
