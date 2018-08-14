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

var eventEmitter = require('minimal-event-emitter');
var pixelRatio = require('../util/pixelRatio');
var convertFov = require('../util/convertFov');
var rotateVector = require('../util/rotateVector');
var mod = require('../util/mod');
var real = require('../util/real');
var clamp = require('../util/clamp');
var decimal = require('../util/decimal');
var compose = require('../util/compose');
var mat4 = require('gl-matrix/src/gl-matrix/mat4');
var vec4 = require('gl-matrix/src/gl-matrix/vec4');

// Default viewport dimensions.
// Start with zero to ensure that those values are handled correctly.
var defaultWidth = 0;
var defaultHeight = 0;

// Default view parameters.
var defaultYaw = 0;
var defaultPitch = 0;
var defaultRoll = 0;
var defaultFov = Math.PI/4;
var defaultProjectionCenterX = 0;
var defaultProjectionCenterY = 0;

// A fov of exactly 0 or π breaks some computations, so we constrain it to the
// [fovLimitEpsilon, π - fovLimitEpsilon] interval. We use 6 decimal places for
// the epsilon value to avoid broken rendering due to loss of precision in
// floating point computations.
var fovLimitEpsilon = 0.000001;


/**
 * @class
 * @classdesc A view implementing a rectilinear projection for 360° images.
 * @implements View
 *
 * @param {Object} params the initial view parameters.
 *
 * @param {number} [params.yaw=0] the yaw angle, in the [-π, π] range.
 * When `params.yaw < 0`, the view rotates left.
 * When `params.yaw > 0`, the view rotates right.
 *
 * @param {number} [params.pitch=0] the pitch angle, in the [-π, π] range.
 * When `params.pitch < 0`, the view rotates downwards.
 * When `params.pitch > 0`, the view rotates upwards.
 *
 * @param {number} [params.roll=0] the roll angle, in the [-π, π] range.
 * When `params.roll < 0`, the view rotates clockwise.
 * When `params.roll > 0`, the view rotates counter-clockwise.
 *
 * @param {number} [params.fov=π/4] the vertical field of view, in the
 * [0, π] range.
 *
 * @param {Function} limiter the view limiting function.
 */
function RectilinearView(params, limiter) {
  // The initial values for the view parameters.
  this._yaw = params && params.yaw != null ? params.yaw : defaultYaw;
  this._pitch = params && params.pitch != null ? params.pitch : defaultPitch;
  this._roll = params && params.roll != null ? params.roll : defaultRoll;
  this._fov = params && params.fov != null ? params.fov : defaultFov;
  this._width = params && params.width != null ?
    params.width : defaultWidth;
  this._height = params && params.height != null ?
    params.height : defaultHeight;
  this._projectionCenterX = params && params.projectionCenterX != null ?
    params.projectionCenterX : defaultProjectionCenterX;
  this._projectionCenterY = params && params.projectionCenterY != null ?
    params.projectionCenterY : defaultProjectionCenterY;

  // The initial value for the view limiter.
  this._limiter = limiter || null;

  // The last calculated projection matrix.
  this._projectionMatrix = mat4.create();

  // Whether the projection matrix needs to be updated.
  this._projectionChanged = true;

  // The last calculated view frustum.
  this._viewFrustum = [
    vec4.create(), // left
    vec4.create(), // right
    vec4.create(), // bottom
    vec4.create(), // top
    vec4.create()  // camera
  ];

  // Temporary variables used for calculations.
  this._params = {};
  this._fovs = {};
  this._vertex = vec4.create();
  this._invProj = mat4.create();

  // Force view limiting on initial parameters.
  this._update();
}

eventEmitter(RectilinearView);


/**
 * Destructor.
 */
RectilinearView.prototype.destroy = function() {
  this._yaw = null;
  this._pitch = null;
  this._roll = null;
  this._fov = null;
  this._width = null;
  this._height = null;
  this._limiter = null;
  this._projectionChanged = null;
  this._projectionMatrix = null;
  this._viewFrustum = null;
  this._params = null;
  this._vertex = null;
  this._invProj = null;
};


/**
 * Get the yaw angle.
 * @return {number}
 */
RectilinearView.prototype.yaw = function() {
  return this._yaw;
};


/**
 * Get the pitch angle.
 * @return {number}
 */
RectilinearView.prototype.pitch = function() {
  return this._pitch;
};


/**
 * Get the roll angle.
 * @return {number}
 */
RectilinearView.prototype.roll = function() {
  return this._roll;
};


RectilinearView.prototype.projectionCenterX = function() {
  return this._projectionCenterX;
};


RectilinearView.prototype.projectionCenterY = function() {
  return this._projectionCenterY;
};


/**
 * Get the fov value.
 * @return {number}
 */
RectilinearView.prototype.fov = function() {
  return this._fov;
};


/**
 * Get the viewport width.
 * @return {number}
 */
RectilinearView.prototype.width = function() {
  return this._width;
};


/**
 * Get the viewport height.
 * @return {number}
 */
RectilinearView.prototype.height = function() {
  return this._height;
};


/**
 * Get the viewport dimensions. If an object argument is supplied, the object
 * is filled in with the result and returned. Otherwise, a fresh object is
 * returned.
 * @return {Object} obj
 * @return {number} obj.width
 * @return {number} obj.height
 */
RectilinearView.prototype.size = function(obj) {
  if (!obj) {
    obj = {};
  }
  obj.width = this._width;
  obj.height = this._height;
  return obj;
};


/**
 * Get the view parameters. If an object argument is supplied, the object is
 * filled in with the result and returned. Otherwise, a fresh object is
 * returned.
 * @return {Object} obj
 * @return {number} obj.yaw
 * @return {number} obj.pitch
 * @return {number} obj.roll
 * @return {number} obj.fov
 */
RectilinearView.prototype.parameters = function(obj) {
  if (!obj) {
    obj = {};
  }
  obj.yaw = this._yaw;
  obj.pitch = this._pitch;
  obj.roll = this._roll;
  obj.fov = this._fov;
  return obj;
};


/**
 * Get the view limiter.
 * @return {Function} limiter
 */
RectilinearView.prototype.limiter = function() {
  return this._limiter;
};


/**
 * Set the yaw angle.
 * @param {number} yaw
 */
RectilinearView.prototype.setYaw = function(yaw) {
  this._resetParams();
  this._params.yaw = yaw;
  this._update(this._params);
};


/**
 * Set the pitch angle.
 * @param {number} pitch
 */
RectilinearView.prototype.setPitch = function(pitch) {
  this._resetParams();
  this._params.pitch = pitch;
  this._update(this._params);
};


/**
 * Set the roll angle.
 * @param {number} roll
 */
RectilinearView.prototype.setRoll = function(roll) {
  this._resetParams();
  this._params.roll = roll;
  this._update(this._params);
};


/**
 * Set the fov value.
 * @param {number} fov
 */
RectilinearView.prototype.setFov = function(fov) {
  this._resetParams();
  this._params.fov = fov;
  this._update(this._params);
};


RectilinearView.prototype.setProjectionCenterX = function(projectionCenterX) {
  this._resetParams();
  this._params.projectionCenterX = projectionCenterX;
  this._update(this._params);
};


RectilinearView.prototype.setProjectionCenterY = function(projectionCenterY) {
  this._resetParams();
  this._params.projectionCenterY = projectionCenterY;
  this._update(this._params);
};


/**
 * Add yawOffset to the current yaw value.
 * @param {number} yawOffset
 */
RectilinearView.prototype.offsetYaw = function(yawOffset) {
  this.setYaw(this._yaw + yawOffset);
};


/**
 * Add pitchOffset to the current pitch value.
 * @param {number} pitchOffset
 */
RectilinearView.prototype.offsetPitch = function(pitchOffset) {
  this.setPitch(this._pitch + pitchOffset);
};


/**
 * Add rollOffset to the current roll value.
 * @param {number} rollOffset
 */
RectilinearView.prototype.offsetRoll = function(rollOffset) {
  this.setRoll(this._roll + rollOffset);
};


/**
 * Add fovOffset to the current fov value.
 * @param {number} fovOffset
 */
RectilinearView.prototype.offsetFov = function(fovOffset) {
  this.setFov(this._fov + fovOffset);
};


/**
 * Set the viewport dimensions.
 * @param {Object} obj
 * @param {number} obj.width
 * @param {number} obj.height
 */
RectilinearView.prototype.setSize = function(obj) {
  this._resetParams();
  this._params.width = obj.width;
  this._params.height = obj.height;
  this._update(this._params);
};


/**
 * Set the view parameters. Unspecified parameters are left unchanged.
 * @param {Object} obj
 * @param {number} obj.yaw
 * @param {number} obj.pitch
 * @param {number} obj.roll
 * @param {number} obj.fov
 */
RectilinearView.prototype.setParameters = function(obj) {
  this._resetParams();
  var params = this._params;
  params.yaw = obj.yaw;
  params.pitch = obj.pitch;
  params.roll = obj.roll;
  params.fov = obj.fov;
  params.projectionCenterX = obj.projectionCenterX;
  params.projectionCenterY = obj.projectionCenterY;
  this._update(params);
};


/**
 * Set the view limiter.
 * @param {Function} limiter
 */
RectilinearView.prototype.setLimiter = function(limiter) {
  this._limiter = limiter || null;
  this._update();
};


RectilinearView.prototype._resetParams = function() {
  var params = this._params;
  params.yaw = null;
  params.pitch = null;
  params.roll = null;
  params.fov = null;
  params.width = null;
  params.height = null;
};


RectilinearView.prototype._update = function(params) {

  // Avoid object allocation when no parameters are supplied.
  if (params == null) {
    this._resetParams();
    params = this._params;
  }

  // Save old parameters for later comparison.
  var oldYaw = this._yaw;
  var oldPitch = this._pitch;
  var oldRoll = this._roll;
  var oldFov = this._fov;
  var oldProjectionCenterX = this._projectionCenterX;
  var oldProjectionCenterY = this._projectionCenterY;
  var oldWidth = this._width;
  var oldHeight = this._height;

  // Fill in object with the new set of parameters to pass into the limiter.
  params.yaw = params.yaw != null ? params.yaw : oldYaw;
  params.pitch = params.pitch != null ? params.pitch : oldPitch;
  params.roll = params.roll != null ? params.roll : oldRoll;
  params.fov = params.fov != null ? params.fov : oldFov;
  params.width = params.width != null ? params.width : oldWidth;
  params.height = params.height != null ? params.height : oldHeight;
  params.projectionCenterX = params.projectionCenterX != null ?
    params.projectionCenterX : oldProjectionCenterX;
  params.projectionCenterY = params.projectionCenterY != null ?
    params.projectionCenterY : oldProjectionCenterY;

  // Apply view limiting when defined.
  if (this._limiter) {
    params = this._limiter(params);
    if (!params) {
      throw new Error('Bad view limiter');
    }
  }

  // Normalize parameters.
  params = this._normalize(params);

  // Grab the limited parameters.
  var newYaw = params.yaw;
  var newPitch = params.pitch;
  var newRoll = params.roll;
  var newFov = params.fov;
  var newWidth = params.width;
  var newHeight = params.height;
  var newProjectionCenterX = params.projectionCenterX;
  var newProjectionCenterY = params.projectionCenterY;

  // Consistency check.
  if (!real(newYaw) || !real(newPitch) || !real(newRoll) ||
      !real(newFov) || !real(newWidth) || !real(newHeight) ||
      !real(newProjectionCenterX) || !real(newProjectionCenterY)) {
    throw new Error('Bad view - suspect a broken limiter');
  }

  // Update parameters.
  this._yaw = newYaw;
  this._pitch = newPitch;
  this._roll = newRoll;
  this._fov = newFov;
  this._width = newWidth;
  this._height = newHeight;
  this._projectionCenterX = newProjectionCenterX;
  this._projectionCenterY = newProjectionCenterY;

  // Check whether the parameters changed and emit the corresponding events.
  if (newYaw !== oldYaw || newPitch !== oldPitch || newRoll !== oldRoll ||
      newFov !== oldFov || newWidth !== oldWidth || newHeight !== oldHeight ||
      newProjectionCenterX !== oldProjectionCenterX ||
      newProjectionCenterY !== oldProjectionCenterY) {
    this._projectionChanged = true;
    this.emit('change');
  }
  if (newWidth !== oldWidth || newHeight !== oldHeight) {
    this.emit('resize');
  }

};


RectilinearView.prototype._normalize = function(params) {

  this._normalizeCoordinates(params);

  // Make sure that neither the horizontal nor the vertical fields of view
  // exceed π - fovLimitEpsilon.
  var hfovPi = convertFov.htov(Math.PI, params.width, params.height);
  var maxFov = isNaN(hfovPi) ? Math.PI : Math.min(Math.PI, hfovPi);
  params.fov = clamp(params.fov, fovLimitEpsilon, maxFov - fovLimitEpsilon);

  return params;
};


RectilinearView.prototype._normalizeCoordinates = function(params) {
  // Constrain yaw, pitch and roll to the [-π, π] interval.
  if ('yaw' in params) {
    params.yaw = mod(params.yaw - Math.PI, -2*Math.PI) + Math.PI;
  }
  if ('pitch' in params) {
    params.pitch = mod(params.pitch - Math.PI, -2*Math.PI) + Math.PI;
  }
  if ('roll' in params) {
    params.roll = mod(params.roll - Math.PI, -2*Math.PI) + Math.PI;
  }
  return params;
};


/**
 * Normalize view coordinates so that they are the closest to the current view.
 * Useful for tweening the view through the shortest path. If a result argument
 * is supplied, the object is filled in with the result and returned.
 * Otherwise, a fresh object is returned.
 *
 * @param {Object} coords
 * @param {number} coords.yaw
 * @param {number} coords.pitch
 * @return {Object} result
 * @return {number} result.yaw
 * @return {number} result.pitch
 */
RectilinearView.prototype.normalizeToClosest = function(coords, result) {

  var viewYaw = this._yaw;
  var viewPitch = this._pitch;

  var coordYaw = coords.yaw;
  var coordPitch = coords.pitch;

  // Check if the yaw is closer after subtracting or adding a full circle.
  var prevYaw = coordYaw - 2*Math.PI;
  var nextYaw = coordYaw + 2*Math.PI;
  if (Math.abs(prevYaw - viewYaw) < Math.abs(coordYaw - viewYaw)) {
    coordYaw = prevYaw;
  }
  else if (Math.abs(nextYaw - viewYaw) < Math.abs(coordYaw - viewYaw)) {
    coordYaw = nextYaw;
  }

  // Check if the pitch is closer after subtracting or adding a full circle.
  var prevPitch = coordPitch - 2*Math.PI;
  var nextPitch = coordPitch + 2*Math.PI;
  if (Math.abs(prevPitch - viewPitch) < Math.abs(coordPitch - viewPitch)) {
    coordPitch = prevPitch;
  }
  else if (Math.abs(prevPitch - viewPitch) < Math.abs(coordPitch - viewPitch)) {
    coordPitch = nextPitch;
  }

  result = result || {};
  result.yaw = coordYaw;
  result.pitch = coordPitch;
  return result;

};


RectilinearView.prototype.updateWithControlParameters = function(parameters) {
  // axisScaledX and axisScaledY are scaled according to their own axis
  // x and y are scaled by the same value

  // If the viewport dimensions are zero, assume a square viewport
  // when converting from hfov to vfov.
  var vfov = this._fov;
  var hfov = convertFov.vtoh(vfov, this._width, this._height);
  if (isNaN(hfov)) {
    hfov = vfov;
  }

  // TODO: revisit this after we rethink the control parameters.
  this.offsetYaw(parameters.axisScaledX * hfov + parameters.x * 2 * hfov + parameters.yaw);
  this.offsetPitch(parameters.axisScaledY * vfov + parameters.y * 2 * hfov + parameters.pitch);
  this.offsetRoll(-parameters.roll);
  this.offsetFov(parameters.zoom * vfov);
};


/**
 * Compute and return the projection matrix for the current view.
 * @returns {mat4}
 */
RectilinearView.prototype.projection = function() {

  var p = this._projectionMatrix;
  var f = this._viewFrustum;

  if (this._projectionChanged) {

    // Recalculate the projection matrix.

    var width = this._width;
    var height = this._height;

    var vfov = this._fov;
    var hfov = convertFov.vtoh(vfov, width, height);
    var aspect = width / height;

    var projectionCenterX = this._projectionCenterX;
    var projectionCenterY = this._projectionCenterY;

    if (projectionCenterX !== 0 || projectionCenterY !== 0) {
      var offsetAngleX = Math.atan(projectionCenterX * 2 * Math.tan(hfov/2));
      var offsetAngleY = Math.atan(projectionCenterY * 2 * Math.tan(vfov/2));
      var fovs = this._fovs;
      fovs.leftDegrees = (hfov/2 + offsetAngleX) * 180/Math.PI;
      fovs.rightDegrees = (hfov/2 - offsetAngleX) * 180/Math.PI;
      fovs.upDegrees = (vfov/2 + offsetAngleY) * 180/Math.PI;
      fovs.downDegrees = (vfov/2 - offsetAngleY) * 180/Math.PI;
      mat4.perspectiveFromFieldOfView(p, fovs, -1, 1);
    } else {
      mat4.perspective(p, vfov, aspect, -1, 1);
    }

    mat4.rotateZ(p, p, this._roll);
    mat4.rotateX(p, p, this._pitch);
    mat4.rotateY(p, p, this._yaw);

    // Extract frustum planes from projection matrix.
    // http://www8.cs.umu.se/kurser/5DV051/HT12/lab/plane_extraction.pdf

    vec4.set(f[0], p[3] + p[0], p[7] + p[4], p[11] + p[8],  0); // left
    vec4.set(f[1], p[3] - p[0], p[7] - p[4], p[11] - p[8],  0); // right
    vec4.set(f[2], p[3] + p[1], p[7] + p[5], p[11] + p[9],  0); // top
    vec4.set(f[3], p[3] - p[1], p[7] - p[5], p[11] - p[9],  0); // bottom
    vec4.set(f[4], p[3] + p[2], p[7] + p[6], p[11] + p[10], 0); // camera

    this._projectionChanged = false;
  }

  return p;

};


/**
 * Return whether the view frustum intersects the given rectangle.
 * This function may return false positives, but never false negatives.
 * It is used for frustum culling, i.e., excluding invisible tiles from the
 * rendering process.
 * @param {vec4[]} rectangle
 * @return whether the rectangle intersects the view frustum.
 */
RectilinearView.prototype.intersects = function(rectangle) {

  var planes = this._viewFrustum;
  var vertex = this._vertex;

  // Call projection() for the side effect of updating the view frustum.
  this.projection();

  // Check whether the rectangle is on the outer side of any of the frustum
  // planes. This is a sufficient condition, though not necessary, for the
  // rectangle to be completely outside the frustum.
  for (var i = 0; i < planes.length; i++) {
    var plane = planes[i];
    var inside = false;
    for (var j = 0; j < rectangle.length; j++) {
      var corner = rectangle[j];
      vec4.set(vertex, corner[0], corner[1], corner[2], 0);
      if (vec4.dot(plane, vertex) >= 0) {
        inside = true;
      }
    }
    if (!inside) {
      return false;
    }
  }
  return true;

};


/**
 * Select the level that should be used to render the view.
 * @param {Level[]} levelList the list of levels from which to select.
 * @return {Level} the selected level.
 */
RectilinearView.prototype.selectLevel = function(levelList) {

  // Multiply the viewport width by the device pixel ratio to get the required
  // horizontal resolution in pixels.
  //
  // Calculate the fraction of a cube face that would be visible given the
  // current vertical field of view. Then, for each level, multiply by the
  // level height to get the height in pixels of the portion that would be
  // visible.
  //
  // Search for the smallest level that satifies the the required height,
  // falling back on the largest level if none do.

  var requiredPixels = pixelRatio() * this._height;
  var coverFactor = Math.tan(0.5 * this._fov);

  for (var i = 0; i < levelList.length; i++) {
    var level = levelList[i];
    if (coverFactor * level.height() >= requiredPixels) {
      return level;
    }
  }

  return levelList[levelList.length - 1];

};


/**
 * Convert view coordinates into screen position. If a result argument is
 * supplied, the object is filled in with the result and returned. Otherwise,
 * a fresh object is returned.
 * @param {Object} coords
 * @param {number} coords.yaw
 * @param {number} coords.pitch
 * @param {number} coords.roll
 * @return {Object} result
 * @return {number} result.x
 * @return {number} result.y
 */
RectilinearView.prototype.coordinatesToScreen = function(coords, result) {
  var ray = this._vertex;

  if (!result) {
    result = {};
  }

  var width = this._width;
  var height = this._height;

  // Undefined on a null viewport.
  if (width <= 0 || height <= 0) {
    result.x = null;
    result.y = null;
    return null;
  }

  // Extract coordinates from argument, filling in default values.
  var yaw = coords && coords.yaw != null ? coords.yaw : defaultYaw;
  var pitch = coords && coords.pitch != null ? coords.pitch : defaultPitch;
  var roll = coords && coords.roll != null ? coords.roll : defaultRoll;

  // Project view ray onto clip space.
  vec4.set(ray, 0, 0, -1, 1);
  rotateVector(ray, ray, -yaw, -pitch, -roll);
  vec4.transformMat4(ray, ray, this.projection());

  // w in clip space equals -z in camera space.
  if (ray[3] >= 0) {
    // Point is in front of camera.
    // Convert to viewport coordinates.
    result.x = width * (ray[0] / ray[3] + 1) / 2;
    result.y = height * (1 - ray[1] / ray[3]) / 2;
  } else {
    // Point is behind camera.
    result.x = null;
    result.y = null;
    return null;
  }

  return result;
};


/**
 * Convert screen position into view coordinates. If a result argument is
 * supplied, the object is filled in with the result and returned. Otherwise,
 * a fresh object is returned.
 * @param {Object} screen
 * @param {number} screen.x
 * @param {number} screen.y
 * @return {Object} result
 * @return {Object} result.yaw
 * @return {Object} result.pitch
 */
RectilinearView.prototype.screenToCoordinates = function(screen, result) {
  var ray = this._vertex;
  var invProj = this._invProj;

  if (!result) {
    result = {};
  }

  var width = this._width;
  var height = this._height;

  // Calculate the inverse projection matrix.
  // TODO: cache result?
  mat4.invert(invProj, this.projection());

  // Convert viewport coordinates to clip space.
  var vecx = 2.0 * screen.x / width - 1.0;
  var vecy = 1.0 - 2.0 * screen.y / height;
  vec4.set(ray, vecx, vecy, 1, 1);

  // Project back to world space.
  vec4.transformMat4(ray, ray, invProj);

  // Convert to spherical coordinates.
  var r = Math.sqrt(ray[0] * ray[0] + ray[1] * ray[1] + ray[2] * ray[2]);
  result.yaw = Math.atan2(ray[0], -ray[2]);
  result.pitch = Math.acos(ray[1] / r) - Math.PI/2;

  this._normalizeCoordinates(result);

  return result;
};


/**
  * Calculate the perspective transform required to position an element with
  * perspective.
  *
  * @param {Object} coords
  * @param {number} coords.yaw
  * @param {number} coords.pitch
  * @param {Number} radius Radius of the imaginary sphere where the element is
  * @param {String} extraTransforms Extra transformations to be applied at the end of
  the transformation. Can be used to rotate the element.
  * @return {String} The CSS transform to be applied on the element
  */
RectilinearView.prototype.coordinatesToPerspectiveTransform = function(coords, radius, extraTransforms) {
  extraTransforms = extraTransforms || "";

  var height = this._height;
  var width = this._width;
  var fov = this._fov;
  var perspective = 0.5 * height / Math.tan(fov / 2);

  var transform = '';

  // Center hotspot in screen.
  transform += 'translateX(' + decimal(width/2) + 'px) translateY(' + decimal(height/2) + 'px) ';
  transform += 'translateX(-50%) translateY(-50%) ';

  // Set the perspective depth.
  transform += 'perspective(' + decimal(perspective) + 'px) ';
  transform += 'translateZ(' + decimal(perspective) + 'px) ';

  // Set the camera rotation.
  transform += 'rotateZ(' + decimal(-this._roll) + 'rad) ';
  transform += 'rotateX(' + decimal(-this._pitch) + 'rad) ';
  transform += 'rotateY(' + decimal(this._yaw) + 'rad) ';

  // Set the hotspot rotation.
  transform += 'rotateY(' + decimal(-coords.yaw) + 'rad) ';
  transform += 'rotateX(' + decimal(coords.pitch) + 'rad) ';

  // Move back to sphere.
  transform += 'translateZ(' + decimal(-radius) + 'px) ';

  // Apply the extra transformations
  transform += extraTransforms + ' ';

  return transform;
};


/**
 * View limiting functions.
 * @namespace
 */
RectilinearView.limit = {

  /**
   * Return a view limiter that constrains the yaw angle.
   * @param {number} min the minimum yaw value
   * @param {number} max the maximum yaw value
   * @return {Function} view limiter
   */
  yaw: function(min, max) {
    return function limitYaw(params) {
      params.yaw = clamp(params.yaw, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the pitch angle.
   * @param {number} min the minimum pitch value
   * @param {number} max the maximum pitch value
   * @return {Function} view limiter
   */
  pitch: function(min, max) {
    return function limitPitch(params) {
      params.pitch = clamp(params.pitch, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the roll angle.
   * @param {number} min the minimum roll value
   * @param {number} max the maximum roll value
   * @return {Function} view limiter
   */
  roll: function(min, max) {
    return function limitRoll(params) {
      params.roll = clamp(params.roll, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the horizontal field of view.
   * @param {number} min the minimum horizontal field of view
   * @param {number} max the maximum horizontal field of view
   * @return {Function} view limiter
   */
  hfov: function(min, max) {
    return function limitHfov(params) {
      var width = params.width;
      var height = params.height;
      if (width > 0 && height > 0) {
        var vmin = convertFov.htov(min, width, height);
        var vmax = convertFov.htov(max, width, height);
        params.fov = clamp(params.fov, vmin, vmax);
      }
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the vertical field of view.
   * @param {number} min the minimum vertical field of view
   * @param {number} max the maximum vertical field of view
   * @return {Function} view limiter
   */
  vfov: function(min, max) {
    return function limitVfov(params) {
      params.fov = clamp(params.fov, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that prevents zooming in beyond the given
   * resolution.
   * @param {number} size the cube face width in pixels
   * @return {Function} view limiter
   */
  resolution: function(size) {
    return function limitResolution(params) {
      var height = params.height;
      if (height) {
        var requiredPixels = pixelRatio() * height;
        var minFov = 2 * Math.atan(requiredPixels / size);
        params.fov = clamp(params.fov, minFov, Infinity);
      }
      return params;
    };
  },

  /**
   * Return a view limiter that limits horizontal and vertical fov, prevents
   * zooming in past the image resolution, and limits the pitch range to
   * prevent the camera wrapping around at the poles. These are the most
   * common view restrictions for 360 panorama.
   * @param {number} maxResolution the cube face width in pixels
   * @param {number} maxVFov maximum vertical field of view
   * @param {number} [maxHFov=maxVFov] maximum horizontal field of view
   * @return {Function} view limiter
   */
  traditional: function(maxResolution, maxVFov, maxHFov) {
    maxHFov = maxHFov != null ? maxHFov : maxVFov;

    return compose(
      RectilinearView.limit.resolution(maxResolution),
      RectilinearView.limit.vfov(0, maxVFov),
      RectilinearView.limit.hfov(0, maxHFov),
      RectilinearView.limit.pitch(-Math.PI/2, Math.PI/2));
  }

};


RectilinearView.type = RectilinearView.prototype.type = 'rectilinear';


module.exports = RectilinearView;
