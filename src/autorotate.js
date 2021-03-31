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

var defaults = require('./util/defaults');

var defaultSpeed = 0.1;
var defaultAccel = 0.01;

var defaultOptions = {
  yawSpeed: defaultSpeed,
  pitchSpeed: defaultSpeed,
  fovSpeed: defaultSpeed,
  yawAccel: defaultAccel,
  pitchAccel: defaultAccel,
  fovAccel: defaultAccel,
  targetPitch: 0,
  targetFov: null
};

/**
 * @param {Object} opts
 * @param {Number} [opts.yawSpeed=0.1] Yaw maximum speed
 * @param {Number} [opts.pitchSpeed=0.1] Pitch maximum speed
 * @param {Number} [opts.fovSpeed=0.1] Fov maximum speed
 * @param {Number} [opts.yawAccel=0.01] Yaw acceleration
 * @param {Number} [opts.pitchAccel=0.01] Pitch acceleration
 * @param {Number} [opts.fovAccel=0.01] Fov acceleration
 * @param {Number} [opts.targetPitch=0] Value that pitch converges to. `null` means that the pitch will not change.
 * @param {Number} [opts.targetFov=null] Value that fov converges to. `null` means that the fov will not change.
 * @returns Movement function that can be passed to {@link Viewer#setIdleMovement} or {@link Scene#startMovement}
*/
function autorotate(opts) {

  opts = defaults(opts || {}, defaultOptions);

  var yawSpeed = opts.yawSpeed;
  var pitchSpeed = opts.pitchSpeed;
  var fovSpeed = opts.fovSpeed;
  var yawAccel = opts.yawAccel;
  var pitchAccel = opts.pitchAccel;
  var fovAccel = opts.fovAccel;
  var targetPitch = opts.targetPitch;
  var targetFov = opts.targetFov;

  return function start() {

    var lastTime = 0;
    var lastYawSpeed = 0;
    var lastPitchSpeed = 0;
    var lastFovSpeed = 0;

    var currentYawSpeed = 0;
    var currentPitchSpeed = 0;
    var currentFovSpeed = 0;

    var timeDelta;
    var yawDelta;
    var pitchDelta;
    var fovDelta;

    return function step(params, currentTime) {

      timeDelta = (currentTime - lastTime) / 1000;
      currentYawSpeed = Math.min(lastYawSpeed + timeDelta * yawAccel, yawSpeed);
      yawDelta = currentYawSpeed * timeDelta;
      params.yaw = params.yaw + yawDelta;

      if (targetPitch != null && params.pitch !== targetPitch) {
        var pitchThresh = 0.5 * lastPitchSpeed * lastPitchSpeed / pitchAccel;
        if (Math.abs(targetPitch - params.pitch) > pitchThresh) {
          // Acceleration phase
          currentPitchSpeed = Math.min(lastPitchSpeed + timeDelta * pitchAccel, pitchSpeed);
        } else {
          // Deceleration phase
          currentPitchSpeed = Math.max(lastPitchSpeed - timeDelta * pitchAccel, 0);
        }
        // currentPitchSpeed is the absolute value (>= 0)
        pitchDelta = currentPitchSpeed * timeDelta;
        if (targetPitch < params.pitch) {
          params.pitch = Math.max(targetPitch, params.pitch - pitchDelta);
        }
        if (targetPitch > params.pitch) {
          params.pitch = Math.min(targetPitch, params.pitch + pitchDelta);
        }
      }

      if (targetFov != null && params.fov !== targetPitch) {
        var fovThresh = 0.5 * lastFovSpeed * lastFovSpeed / fovAccel;
        if (Math.abs(targetFov - params.fov) > fovThresh) {
          // Acceleration phase
          currentFovSpeed = Math.min(lastFovSpeed + timeDelta * fovAccel, fovSpeed);
        } else {
          // Deceleration phase
          currentFovSpeed = Math.max(lastFovSpeed - timeDelta * fovAccel, 0);
        }
        // currentFovSpeed is the absolute value (>= 0)
        fovDelta = currentFovSpeed * timeDelta;
        if (targetFov < params.fov) {
          params.fov = Math.max(targetFov, params.fov - fovDelta);
        }
        if (targetFov > params.fov) {
          params.fov = Math.min(targetFov, params.fov + fovDelta);
        }
      }

      lastTime = currentTime;
      lastYawSpeed = currentYawSpeed;
      lastPitchSpeed = currentPitchSpeed;
      lastFovSpeed = currentFovSpeed;

      return params;

    };

  };

}

module.exports = autorotate;