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

// Custom control method to alter the view according to the device orientation.
function DeviceOrientationControlMethod() {
  this._dynamics = {
    yaw: new Marzipano.Dynamics(),
    pitch: new Marzipano.Dynamics()
  };

  this._deviceOrientationHandler = this._handleData.bind(this);

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', this._deviceOrientationHandler);
  }

  this._previous = {};
  this._current = {};
  this._tmp = {};

  this._getPitchCallbacks = [];
}

Marzipano.dependencies.eventEmitter(DeviceOrientationControlMethod);


DeviceOrientationControlMethod.prototype.destroy = function() {
  this._dynamics = null;
  if (window.DeviceOrientationEvent) {
    window.removeEventListener('deviceorientation', this._deviceOrientationHandler);
  }
  this._deviceOrientationHandler = null;
  this._previous = null;
  this._current = null;
  this._tmp = null;
  this._getPitchCallbacks = null;
};


DeviceOrientationControlMethod.prototype.getPitch = function(cb) {
  this._getPitchCallbacks.push(cb);
};


DeviceOrientationControlMethod.prototype._handleData = function(data) {
  var previous = this._previous,
      current = this._current,
      tmp = this._tmp;

  tmp.yaw = Marzipano.util.degToRad(data.alpha);
  tmp.pitch = Marzipano.util.degToRad(data.beta);
  tmp.roll = Marzipano.util.degToRad(data.gamma);

  rotateEuler(tmp, current);

  // Report current pitch value.
  this._getPitchCallbacks.forEach(function(callback) {
    callback(null, current.pitch);
  });
  this._getPitchCallbacks.length = 0;

  // Emit control offsets.
  if (previous.yaw != null && previous.pitch != null && previous.roll != null) {
    this._dynamics.yaw.offset = -(current.yaw - previous.yaw);
    this._dynamics.pitch.offset = (current.pitch - previous.pitch);

    this.emit('parameterDynamics', 'yaw', this._dynamics.yaw);
    this.emit('parameterDynamics', 'pitch', this._dynamics.pitch);
  }

  previous.yaw = current.yaw;
  previous.pitch = current.pitch;
  previous.roll = current.roll;
};

// Taken from krpano's gyro plugin by Aldo Hoeben:
// https://github.com/fieldOfView/krpano_fovplugins/tree/master/gyro/
// For the math, see references:
// http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToMatrix/index.htm
// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToEuler/index.htm
function rotateEuler(euler, result) {
  var heading, bank, attitude,
    ch = Math.cos(euler.yaw),
    sh = Math.sin(euler.yaw),
    ca = Math.cos(euler.pitch),
    sa = Math.sin(euler.pitch),
    cb = Math.cos(euler.roll),
    sb = Math.sin(euler.roll),

    matrix = [
      sh*sb - ch*sa*cb,   -ch*ca,    ch*sa*sb + sh*cb,
      ca*cb,              -sa,      -ca*sb,
      sh*sa*cb + ch*sb,    sh*ca,   -sh*sa*sb + ch*cb
    ]; // Includes 90-degree rotation around z axis

  /* [m00 m01 m02] 0 1 2
   * [m10 m11 m12] 3 4 5
   * [m20 m21 m22] 6 7 8 */

  if (matrix[3] > 0.9999)
  {
    // Deal with singularity at north pole
    heading = Math.atan2(matrix[2],matrix[8]);
    attitude = Math.PI/2;
    bank = 0;
  }
  else if (matrix[3] < -0.9999)
  {
    // Deal with singularity at south pole
    heading = Math.atan2(matrix[2],matrix[8]);
    attitude = -Math.PI/2;
    bank = 0;
  }
  else
  {
    heading = Math.atan2(-matrix[6],matrix[0]);
    bank = Math.atan2(-matrix[5],matrix[4]);
    attitude = Math.asin(matrix[3]);
  }

  result.yaw = heading;
  result.pitch = attitude;
  result.roll = bank;
}
