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
var cssSupported = require('./support/Css');
var positionAbsolutely = require('./positionAbsolutely');
var setTransform = require('./util/dom').setTransform;

/**
 * Use {@link HotspotContainer#createHotspot} instead of this constructor
 * @class
 * @classdesc HTML object positioned at certain coordinates
 * @param {Element} domElement Element that will be positioned

  Positioning will be done using CSS Transforms when available and with the
  `top` and `left` properties when not.

  The `top` and `left` properties always position the top left corner of an
  element. Therefore, the content of `domElement` must be centered around
  its top left corner.

 * @param {Element} parentDomElement Usually the DOM element of a {@link HotspotContainer}
 * @param {View} view
 * @param {Object} params
 * @param {Object} opts
 * @param {Object} opts.perspective

 * @param {Number} [opts.perspective.radius=null] Transform hotspot as if it were on
 the surface of a sphere. The hotspot will then always cover the same part of the
 360° image.

 This feature will only work on browsers with CSS 3D Transforms.

 When `radius` is enabled the hotspots are automatically centered.

 This value represents the radius of the sphere where the hotspot is. Therefore,
 the smaller this value, the larger the hotspot will appear on the screen.

 * @param {String} opts.perspective.extraRotations This value will be added to the
 `transform` CSS rule that places the hotspot in its position.

 This enables transforming the hotspot to overlay a certain surface on the panorama.
 For instance, one possible value would be `rotateX(0.5rad) rotateY(-0.1rad)`.
*/
function Hotspot(domElement, parentDomElement, view, params, opts) {

  opts = opts || {};
  opts.perspective = opts.perspective || {};
  opts.perspective.extraRotations = opts.perspective.extraRotations != null ? opts.perspective.extraRotations : "";

  if (opts.perspective.radius && !cssSupported()) {
    throw new Error('Hotspot cannot not be embedded in sphere for lack of browser support');
  }

  this._domElement = domElement;
  this._parentDomElement = parentDomElement;
  this._view = view;
  this._params = {};
  this._perspective = {};

  this.setPosition(params);

  // Add hotspot into the DOM.
  this._parentDomElement.appendChild(this._domElement);

  this.setPerspective(opts.perspective);

  // Whether the hotspot is visible.
  // The hotspot may still be hidden if it's inside a hidden HotspotContainer.
  this._visible = true;

  // The current calculated screen position.
  this._position = { x: 0, y: 0 };
}

eventEmitter(Hotspot);

/**
 * Destructor. Clients should call {@link HotspotContainer#destroyHotspot}
 * instead.
 */
Hotspot.prototype.destroy = function() {
  this._parentDomElement.removeChild(this._domElement);

  this._domElement = null;
  this._parentDomElement = null;
  this._params = null;
  this._view = null;

  this._position = null;
  this._visible = false;
};


/**
 * @return {Element}
 */
Hotspot.prototype.domElement = function() {
  return this._domElement;
};


/**
 * @return {Object} Position params
 */
Hotspot.prototype.position = function() {
  return this._params;
};


/**
 *  @param {Object} params Position params
 */
Hotspot.prototype.setPosition = function(params) {
  for(var key in params) {
    this._params[key] = params[key];
  }
  this._update();
  // TODO: We should probably emit a hotspotsChange event on the parent
  // HotspotContainer. What's the best way to do so?
};


/**
 * @return {Object} Perspective
 */
Hotspot.prototype.perspective = function() {
  return this._perspective;
};


/**
 *  @param {Object} params Perspective params
 */
Hotspot.prototype.setPerspective = function(perspective) {
  for(var key in perspective) {
    this._perspective[key] = perspective[key];
  }
  this._update();
};


/**
 * Show the hotspot
 */
Hotspot.prototype.show = function() {
  if (!this._visible) {
    this._visible = true;
    this._update();
  }
};


/**
 * Hide the hotspot
 */
Hotspot.prototype.hide = function() {
  if (this._visible) {
    this._visible = false;
    this._update();
  }
};


Hotspot.prototype._update = function() {
  var element = this._domElement;

  var params = this._params;
  var position = this._position;
  var x, y;

  var isVisible = false;

  if (this._visible) {
    var view = this._view;

    if (this._perspective.radius) {
      // Hotspots which are embedded in the sphere should always be displayed. Even
      // if they are behind the camera they can still be visible (e.g. a face-sized hotspot at yaw=91º)
      isVisible = true;
      this._setEmbeddedPosition(view, params);
    }
    else {
      // Regular hotspots need only be displayed if they are not behind the camera
      view.coordinatesToScreen(params, position);
      x = position.x;
      y = position.y;

      if (x != null && y != null) {
        isVisible = true;
        this._setPosition(x, y);
      }
    }
  }

  // Show if visible, hide if not.
  if (isVisible) {
    element.style.display = 'block';
    element.style.position = 'absolute';
  }
  else {
    element.style.display = 'none';
    element.style.position = '';
  }

};


Hotspot.prototype._setEmbeddedPosition = function(view, params) {
  var transform = view.coordinatesToPerspectiveTransform(params, this._perspective.radius, this._perspective.extraRotations);
  setTransform(this._domElement, transform);
};


Hotspot.prototype._setPosition = function(x, y) {
  positionAbsolutely(this._domElement, x, y);
};


module.exports = Hotspot;
