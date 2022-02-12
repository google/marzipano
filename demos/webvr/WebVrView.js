/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
import Marzipano from '../../src/index.js';

var clearOwnProperties = Marzipano.util.clearOwnProperties;
var eventEmitter = Marzipano.dependencies.eventEmitter;
var mat4 = Marzipano.dependencies.glMatrix.mat4;
var vec4 = Marzipano.dependencies.glMatrix.vec4;

// A minimal View implementation for use with WebVR.
//
// Note that RectilinearView cannot be used because the WebVR API exposes a view
// matrix instead of view parameters (yaw, pitch and roll).
//
// Most of the code has been copied verbatim from RectilinearView, but some
// methods are missing (e.g. screenToCoordinates and coordinatesToScreen).
// If we ever graduate this class to the core library, we'll need to figure out
// the best way to share code between the two.
function WebVrView() {
  this._width = 0;
  this._height = 0;

  this._proj = mat4.create();
  this._invProj = mat4.create();

  this._frustum = [
    vec4.create(), // left
    vec4.create(), // right
    vec4.create(), // bottom
    vec4.create(), // top
    vec4.create()  // camera
  ];

  this._tmpVec = vec4.create();
};

eventEmitter(WebVrView);

WebVrView.prototype.destroy = function() {
  clearOwnProperties(this);
};

WebVrView.prototype.size = function(size) {
  size = size || {};
  size.width = this._width;
  size.height = this._height;
  this.emit('change');
  this.emit('resize');
  return size;
};

WebVrView.prototype.setSize = function(size) {
  this._width = size.width;
  this._height = size.height;
};

WebVrView.prototype.projection = function() {
  return this._proj;
};

WebVrView.prototype.inverseProjection = function() {
  return this._invProj;
};

WebVrView.prototype.setProjection = function(proj) {
  var p = this._proj;
  var invp = this._invProj;
  var f = this._frustum;

  mat4.copy(p, proj);
  mat4.invert(invp, proj);

  // Extract frustum planes from projection matrix.
  // http://www8.cs.umu.se/kurser/5DV051/HT12/lab/plane_extraction.pdf
  vec4.set(f[0], p[3] + p[0], p[7] + p[4], p[11] + p[8],  0); // left
  vec4.set(f[1], p[3] - p[0], p[7] - p[4], p[11] - p[8],  0); // right
  vec4.set(f[2], p[3] + p[1], p[7] + p[5], p[11] + p[9],  0); // top
  vec4.set(f[3], p[3] - p[1], p[7] - p[5], p[11] - p[9],  0); // bottom
  vec4.set(f[4], p[3] + p[2], p[7] + p[6], p[11] + p[10], 0); // camera

  this.emit('change');
};

WebVrView.prototype.selectLevel = function(levelList) {
  // TODO: Figure out how to determine the most appropriate resolution.
  // For now, always default to the highest resolution level.
  return levelList[levelList.length-1];
};

WebVrView.prototype.intersects = function(rectangle) {
  // Check whether the rectangle is on the outer side of any of the frustum
  // planes. This is a sufficient condition, though not necessary, for the
  // rectangle to be completely outside the frustum.
  var frustum = this._frustum;
  var vertex = this._tmpVec;
  for (var i = 0; i < frustum.length; i++) {
    var plane = frustum[i];
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

// Pretend to be a RectilinearView so that an appropriate renderer can be found.
WebVrView.type = WebVrView.prototype.type = 'rectilinear';

export default WebVrView;