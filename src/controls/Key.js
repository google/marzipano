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

var Dynamics = require('./Dynamics');
var eventEmitter = require('minimal-event-emitter');

/**
 * @class
 * @classdesc Set the velocity and friction of a single parameter by pressing
 * and unpressing a key.
 *
 * @implements ControlMethod
 *
 * @param {Number} keyCode Key which activates the method when pressed
 * @param {String} parameter The parameter to be controlled (e.g. `x`, `y` or `zoom`)
 * @param {Number} velocity Velocity at which the parameter changes. Use a
 * negative number for opposite direction
 * @param {Number} friction Friction at which the parameter stops
 * @param {Element} [element=document] DOM element where the key events are listened to
*/
function KeyControlMethod(keyCode, parameter, velocity, friction, element) {
  if(!keyCode) {
    throw new Error("KeyControlMethod: keyCode must be defined");
  }
  if(!parameter) {
    throw new Error("KeyControlMethod: parameter must be defined");
  }
  if(!velocity) {
    throw new Error("KeyControlMethod: velocity must be defined");
  }
  if(!friction) {
    throw new Error("KeyControlMethod: friction must be defined");
  }

  element = element || document;

  this._keyCode = keyCode;
  this._parameter = parameter;
  this._velocity = velocity;
  this._friction = friction;
  this._element = element;

  this._keydownHandler = this._handlePress.bind(this);
  this._keyupHandler = this._handleRelease.bind(this);
  this._blurHandler = this._handleBlur.bind(this);

  this._element.addEventListener('keydown', this._keydownHandler);
  this._element.addEventListener('keyup', this._keyupHandler);
  window.addEventListener('blur',this._blurHandler);

  this._dynamics = new Dynamics();
  this._pressing = false;
}
eventEmitter(KeyControlMethod);

/**
  Destroy the instance
*/
KeyControlMethod.prototype.destroy = function() {
  this._element.removeEventListener('keydown', this._keydownHandler);
  this._element.removeEventListener('keyup', this._keyupHandler);
  window.removeEventListener('blur', this._blurHandler);
};

KeyControlMethod.prototype._handlePress = function(e) {
  if(e.keyCode !== this._keyCode) { return; }

  this._pressing = true;

  this._dynamics.velocity = this._velocity;
  this._dynamics.friction = 0;
  this.emit('parameterDynamics', this._parameter, this._dynamics);
  this.emit('active');
};

KeyControlMethod.prototype._handleRelease = function(e) {
  if(e.keyCode !== this._keyCode) { return; }

  if(this._pressing) {
    this._dynamics.friction = this._friction;
    this.emit('parameterDynamics', this._parameter, this._dynamics);
    this.emit('inactive');
  }

  this._pressing = false;
};

KeyControlMethod.prototype._handleBlur = function() {
  this._dynamics.velocity = 0;
  this.emit('parameterDynamics', this._parameter, this._dynamics);
  this.emit('inactive');

  this._pressing = false;
};

module.exports = KeyControlMethod;