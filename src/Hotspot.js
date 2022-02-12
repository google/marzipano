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
import positionAbsolutely from "./util/positionAbsolutely";
import { setTransform as setTransform } from "./util/dom";
import clearOwnProperties from "./util/clearOwnProperties";

/**
 * @class Hotspot
 * @classdesc
 *
 * A Hotspot allows a DOM element to be placed at a fixed position in the
 * image. The position is updated automatically when the {@link View view}
 * changes.
 *
 * Positioning is performed with the `transform` CSS property when available,
 * falling back to the `position`, `left` and `top` properties when not.
 * In both cases, the top left corner of the element is placed in the requested
 * position; clients are expected to use additional children elements or other
 * CSS properties to achieve more sophisticated layouts.
 *
 * There are two kinds of hotspots: regular and embedded. A regular hotspot
 * does not change size depending on the zoom level. An embedded hotspot is
 * displayed at a fixed size relative to the panorama, always covering the
 * same portion of the image.
 *
 * Clients should call {@link HotspotContainer#createHotspot} instead of
 * invoking the constructor directly.
 *
 * @param {Element} domElement The DOM element.
 * @param {View} view The view.
 * @param {Object} coords The hotspot coordinates.
 *     Use {@link RectilinearViewCoords} for a {@link RectilinearView} or
 *     {@link FlatViewCoords} for a {@link FlatView}.
 * @param {Object} opts Additional options.
 * @param {Object} opts.perspective Perspective options for embedded hotspots.
 * @param {number} [opts.perspective.radius=null] If set, embed the hotspot
 *     into the image by transforming it into the surface of a sphere with this
 *     radius.
 * @param {string} [opts.perspective.extraTransforms=null] If set, append this
 *     value to the CSS `transform` property used to position the hotspot. This
 *     may be used to rotate an embedded hotspot.
 */
function Hotspot(domElement, parentDomElement, view, coords, opts) {

  opts = opts || {};
  opts.perspective = opts.perspective || {};
  opts.perspective.extraTransforms =
      opts.perspective.extraTransforms != null ? opts.perspective.extraTransforms : "";

  this._domElement = domElement;
  this._parentDomElement = parentDomElement;
  this._view = view;
  this._coords = {};
  this._perspective = {};

  this.setPosition(coords);

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
 * Destructor.
 * Clients should call {@link HotspotContainer#destroyHotspot} instead.
 */
Hotspot.prototype.destroy = function() {
  this._parentDomElement.removeChild(this._domElement);
  clearOwnProperties(this);
};


/**
 * @return {Element}
 */
Hotspot.prototype.domElement = function() {
  return this._domElement;
};


/**
 * @return {Object}
 */
Hotspot.prototype.position = function() {
  return this._coords;
};


/**
 * @param {Object} coords
 */
Hotspot.prototype.setPosition = function(coords) {
  for (var key in coords) {
    this._coords[key] = coords[key];
  }
  this._update();
  // TODO: We should probably emit a hotspotsChange event on the parent
  // HotspotContainer. What's the best way to do so?
};


/**
 * @return {Object}
 */
Hotspot.prototype.perspective = function() {
  return this._perspective;
};


/**
 * @param {Object}
 */
Hotspot.prototype.setPerspective = function(perspective) {
  for (var key in perspective) {
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

  var params = this._coords;
  var position = this._position;
  var x, y;

  var isVisible = false;

  if (this._visible) {
    var view = this._view;

    if (this._perspective.radius) {
      // Hotspots that are embedded in the panorama may be visible even when
      // positioned behind the camera.
      isVisible = true;
      this._setEmbeddedPosition(view, params);
    } else {
      // Regular hotspots are only visible when positioned in front of the
      // camera. Note that they may be partially visible when positioned outside
      // the viewport.
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
  var transform = view.coordinatesToPerspectiveTransform(
      params, this._perspective.radius, this._perspective.extraTransforms);
  setTransform(this._domElement, transform);
};


Hotspot.prototype._setPosition = function(x, y) {
  positionAbsolutely(this._domElement, x, y, this._perspective.extraTransforms);
};


export default Hotspot;
