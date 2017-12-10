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
var Hotspot = require('./Hotspot');
var calcRect = require('./calcRect');
var positionAbsolutely = require('./positionAbsolutely');
var cssPointerEventsSupported = require('./support/cssPointerEvents');
var setAbsolute = require('./util/dom').setAbsolute;
var setOverflowHidden = require('./util/dom').setOverflowHidden;
var setOverflowVisible = require('./util/dom').setOverflowVisible;
var setNullSize = require('./util/dom').setNullSize;
var setPixelSize = require('./util/dom').setPixelSize;
var setPointerEvents = require('./util/dom').setWithVendorPrefix('pointer-events');

/**
 * Signals that a hotspot has been created or destroyed on the container.
 * @event HotspotContainer#hotspotsChange
 */

/**
  * @class
  * @classdesc Creates a DOM element to hold {@link Hotspots} and updates their
  * position when necessary.
  *
  * @param {Element} parentDomElement DOM element inside which the
  * container is created
  * @param {Stage} stage Used to calculate the size and position of the container.
  *
  * Usually hotspots are associated to a {@link Layer}. That layer's stage
  * should be passed in here.
  *
  * @param {View} view View with which Hotspots are positioned
  *
  * @param {RenderLoop} renderLoop HotspotContainer and Hotspots will be
  * updated when this renderLoop renders.
  *
  * @param {Object} opts
  * @param {Rect} opts.rect Area that the container occupies. This is similar
  * to {@link Effects#rect} and relative to stage's size.
  */
function HotspotContainer(parentDomElement, stage, view, renderLoop, opts) {
  opts = opts || {};

  this._parentDomElement = parentDomElement;
  this._stage = stage;
  this._view = view;
  this._renderLoop = renderLoop;

  this._rect = opts.rect;

  // Wrapper around this._hotspotContainer. The wrapper may have a size
  // and `pointer-events: none` so that hotspots are hidden with `rect`.
  this._hotspotContainerWrapper = document.createElement('div');
  setAbsolute(this._hotspotContainerWrapper);
  setPointerEvents(this._hotspotContainerWrapper, 'none');
  this._parentDomElement.appendChild(this._hotspotContainerWrapper);

  // Hotspot container for scene.
  // This has size 0 and `pointer-events: all;` to overwrite the `none` on the
  // wrapper and allow hotspots to be interacted with.
  this._hotspotContainer = document.createElement('div');
  setAbsolute(this._hotspotContainer);
  setPointerEvents(this._hotspotContainer, 'all');
  this._hotspotContainerWrapper.appendChild(this._hotspotContainer);

  // Hotspot list.
  this._hotspots = [];

  // Whether the hotspot container is visible.
  // The hotspot container may still be hidden if an unsupported rect effect
  // has been set.
  this._visible = true;

  // This will be false when an unsupported rect effect has been set.
  this._supported = true;

  // Store state to prevent DOM accesses.
  this._isVisible = true;
  this._positionAndSize = {};
  this._hasRect = null;

  // Temporary variable used to calculate the updated position and size.
  this._newPositionAndSize = {};

  // Update when the hotspots change or scene is re-rendered.
  this._updateHandler = this._update.bind(this);
  this._renderLoop.addEventListener('afterRender', this._updateHandler);
}

eventEmitter(HotspotContainer);


/**
 * Destroy the instance
*/
HotspotContainer.prototype.destroy = function() {
  var self = this;

  while (this._hotspots.length) {
    this.destroyHotspot(this._hotspots[0]);
  }

  this._parentDomElement.removeChild(this._hotspotContainerWrapper);

  this._renderLoop.removeEventListener('afterRender', this._updateHandler);

  this._parentDomElement = null;
  this._stage = null;
  this._view = null;
  this._renderLoop  = null;
  this._rect = null;
};


/**
 * @return {Element}
 */
HotspotContainer.prototype.domElement = function() {
  return this._hotspotContainer;
};


/**
 * @param {Rect} rect
 */
HotspotContainer.prototype.setRect = function(rect) {
  this._rect = rect;
};


/**
 * @return {Rect}
 */
HotspotContainer.prototype.rect = function() {
  return this._rect;
};


/**
 * Add a hotspot to this container.
 * @param {Element} domElement DOM element to use for the hotspot
 * @param {Object} position View parameters with the hotspot position.
 * For {@link RectilinearView} it should have `{ pitch, yaw }`.
 *
 * @return {Hotspot}
 */
HotspotContainer.prototype.createHotspot = function(domElement, position, opts) {

  position = position || {};

  var hotspot = new Hotspot(domElement, this._hotspotContainer, this._view, position, opts);
  this._hotspots.push(hotspot);
  hotspot._update();

  this.emit('hotspotsChange');

  return hotspot;

};


/**
 * @param {Hotspot} hotspot
 * @return {boolean}
 */
HotspotContainer.prototype.hasHotspot = function(hotspot) {
  return this._hotspots.indexOf(hotspot) >= 0;
};


/**
 * @return {Hotspot[]}
 */
HotspotContainer.prototype.listHotspots = function() {
  return [].concat(this._hotspots);
};


/**
 * @param {Hotspot} hotspot
 */
HotspotContainer.prototype.destroyHotspot = function(hotspot) {
  var i = this._hotspots.indexOf(hotspot);
  if (i < 0) {
    throw new Error('No such hotspot');
  }
  this._hotspots.splice(i, 1);

  hotspot.destroy();
  this.emit('hotspotsChange');
};


/**
 * Hide the container's DOM element. This hides all {@link Hotspot} it contains.
 */
HotspotContainer.prototype.hide = function() {
  this._visible = false;
  this._updateVisibility();
};


/**
 * Show the container's DOM element.
 */
HotspotContainer.prototype.show = function() {
  this._visible = true;
  this._updateVisibility();
};


HotspotContainer.prototype._updateVisibility = function() {
  var shouldBeVisible = this._visible && this._supported;

  if(shouldBeVisible && !this._isVisible) {
    this._hotspotContainerWrapper.style.display = 'block';
    this._isVisible = true;
  }
  else if(!shouldBeVisible && this._isVisible) {
    this._hotspotContainerWrapper.style.display = 'none';
    this._isVisible = false;
  }
};


// Update the position of the hotspot container taking into account rect
HotspotContainer.prototype._update = function() {
  this._updatePositionAndSize();

  for(var i = 0; i < this._hotspots.length; i++) {
    this._hotspots[i]._update();
  }
};


HotspotContainer.prototype._updatePositionAndSize = function() {
  // The hotspot container has `pointer-events: none` if the browser supports it
  if(this._rect) {

    if(!cssPointerEventsSupported() && this._hotspots.length > 0) {
      console.warn("HotspotContainer: this browser does not support using effects.rect with hotspots. Hotspots will be hidden.")
      this._supported = false;
    }
    else {
      calcRect(this._stage.width(), this._stage.height(), this._rect, this._newPositionAndSize);
      this._setPositionAndSizeWithRect(this._newPositionAndSize);
      this._supported = true;
    }
  }
  else {
    // No rect, just set the hotspot container to empty with overflow visible
    this._setPositionAndSizeWithoutRect();
    this._supported = true;
  }

  this._updateVisibility();
};


HotspotContainer.prototype._setPositionAndSizeWithRect = function(newPositionAndSize) {
  // Only update the DOM if something has changed.
  var wrapper = this._hotspotContainerWrapper;
  if (this._hasRect !== true) {
    setOverflowHidden(wrapper);
  }

  if (this._hasRect !== true ||
     newPositionAndSize.left !== this._positionAndSize.left ||
     newPositionAndSize.top !== this._positionAndSize.top) {
    positionAbsolutely(wrapper, newPositionAndSize.left, newPositionAndSize.top);
  }

  if (this._hasRect !== true || +
     newPositionAndSize.width !== this._positionAndSize.width ||
     newPositionAndSize.height !== this._positionAndSize.height) {
    setPixelSize(wrapper, newPositionAndSize.width, newPositionAndSize.height);
  }

  this._positionAndSize.left = newPositionAndSize.left;
  this._positionAndSize.top = newPositionAndSize.top;
  this._positionAndSize.width = newPositionAndSize.width;
  this._positionAndSize.height = newPositionAndSize.height;
  this._hasRect = true;
};


HotspotContainer.prototype._setPositionAndSizeWithoutRect = function() {
  if (this._hasRect !== false) {
    positionAbsolutely(this._hotspotContainerWrapper, 0, 0);
    setNullSize(this._hotspotContainerWrapper);
    setOverflowVisible(this._hotspotContainerWrapper);
    this._hasRect = false;
  }
};


module.exports = HotspotContainer;
