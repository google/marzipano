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
import Hotspot from "./Hotspot";
import calcRect from "./util/calcRect";
import positionAbsolutely from "./util/positionAbsolutely";
import { setAbsolute as setAbsolute } from "./util/dom";
import { setOverflowHidden as setOverflowHidden } from "./util/dom";
import { setOverflowVisible as setOverflowVisible } from "./util/dom";
import { setNullSize as setNullSize } from "./util/dom";
import { setPixelSize as setPixelSize } from "./util/dom";
import dom from "./util/dom";
const  setPointerEvents = dom.setWithVendorPrefix('pointer-events');
import clearOwnProperties from "./util/clearOwnProperties";


/**
 * Signals that a hotspot has been created or destroyed on the container.
 * @event HotspotContainer#hotspotsChange
 */

/**
 * @class HotspotContainer
 * @classdesc
 *
 * Creates a DOM element to hold {@link Hotspot hotspots} and updates their
 * position when necessary.
 *
 * @param {Element} parentDomElement The DOM element inside which the container
 *     should be created.
 * @param {Stage} stage The underlying stage.
 * @param {View} view The view according to which the hotspots are positioned.
 * @param {RenderLoop} renderLoop The render loop indicating when the hotspots
 *     must be rendered.
 * @param {Object} opts
 * @param {RectSpec} opts.rect Rectangular region covered by the container. See
 *    {@link Effects#rect}.
 */
function HotspotContainer(parentDomElement, stage, view, renderLoop, opts) {
  opts = opts || {};

  this._parentDomElement = parentDomElement;
  this._stage = stage;
  this._view = view;
  this._renderLoop = renderLoop;

  // Hotspot list.
  this._hotspots = [];

  // Whether the hotspot container should be visible.
  this._visible = true;

  // The current rect.
  this._rect = opts.rect;

  // Whether the visibility or the rect have changed since the last DOM update.
  this._visibilityOrRectChanged = true;

  // The last seen stage dimensions.
  this._stageWidth = null;
  this._stageHeight = null;

  // Temporary variable to hold the calculated position and size.
  this._tmpRect = {};

  // Wrapper element. When the rect effect is set, the wrapper will have nonzero
  // dimensions and `pointer-events: none` so that hotspots outside the rect are
  // hidden, but no mouse events are hijacked.
  this._hotspotContainerWrapper = document.createElement('div');
  setAbsolute(this._hotspotContainerWrapper);
  setPointerEvents(this._hotspotContainerWrapper, 'none');
  this._parentDomElement.appendChild(this._hotspotContainerWrapper);

  // Hotspot container element. It has zero dimensions and `pointer-events: all`
  // to override the `pointer-events: none` on the wrapper and allow hotspots to
  // be interacted with.
  this._hotspotContainer = document.createElement('div');
  setAbsolute(this._hotspotContainer);
  setPointerEvents(this._hotspotContainer, 'all');
  this._hotspotContainerWrapper.appendChild(this._hotspotContainer);

  // Update when the hotspots change or scene is re-rendered.
  this._updateHandler = this._update.bind(this);
  this._renderLoop.addEventListener('afterRender', this._updateHandler);
}

eventEmitter(HotspotContainer);


/**
 * Destructor.
 */
HotspotContainer.prototype.destroy = function() {
  while (this._hotspots.length) {
    this.destroyHotspot(this._hotspots[0]);
  }

  this._parentDomElement.removeChild(this._hotspotContainerWrapper);

  this._renderLoop.removeEventListener('afterRender', this._updateHandler);

  clearOwnProperties(this);
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
  this._visibilityOrRectChanged = true;
};


/**
 * @return {Rect}
 */
HotspotContainer.prototype.rect = function() {
  return this._rect;
};


/**
 * Creates a new hotspot in this container.
 *
 * @param {Element} domElement DOM element to use for the hotspot
 * @param {Object} coords The hotspot coordinates.
 *     Use {@link RectilinearViewCoords}` for a {@link RectilinearView} or
 *     {@link FlatViewCoords} for a {@link FlatView}.
 * @param {Object} opts Options in the same format as the `opts` argument to
 *     the {@link Hotspot} constructor.
 * @return {Hotspot}
 */
HotspotContainer.prototype.createHotspot = function(domElement, coords, opts) {
  coords = coords || {};

  var hotspot = new Hotspot(
      domElement, this._hotspotContainer, this._view, coords, opts);
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
 * Removes a hotspot from the container.
 *
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
 * Hide the container's DOM element, causing every contained {@link Hotspot} to
 * be hidden.
 */
HotspotContainer.prototype.hide = function() {
  if (this._visible) {
    this._visible = false;
    this._visibilityOrRectChanged = true;
    this._update();
  }
};


/**
 * Show the container's DOM element, causing every contained {@link Hotspot} to
 * be shown.
 */
HotspotContainer.prototype.show = function() {
  if (!this._visible) {
    this._visible = true;
    this._visibilityOrRectChanged = true;
    this._update();
  }
};


HotspotContainer.prototype._update = function() {
  var wrapper = this._hotspotContainerWrapper;
  var width = this._stage.width();
  var height = this._stage.height();
  var tmpRect = this._tmpRect;

  // Avoid updating the wrapper DOM unless necessary.
  if (this._visibilityOrRectChanged ||
      (this._rect && (width !== this._stageWidth || height !== this._stageHeight))) {
    var visible = this._visible;
    wrapper.style.display = visible ? 'block' : 'none';

    if (visible) {
      if (this._rect) {
        calcRect(width, height, this._rect, tmpRect);
        positionAbsolutely(wrapper, width * tmpRect.x, height * tmpRect.y);
        setPixelSize(wrapper, width * tmpRect.width, height * tmpRect.height);
        setOverflowHidden(wrapper);
      } else {
        positionAbsolutely(wrapper, 0, 0);
        setNullSize(wrapper);
        setOverflowVisible(wrapper);
      }
    }

    this._stageWidth = width;
    this._stageHeight = height;
    this._visibilityOrRectChanged = false;
  }

  // Update hotspots unconditionally, as the view parameters may have changed.
  for (var i = 0; i < this._hotspots.length; i++) {
    this._hotspots[i]._update();
  }
};


export default HotspotContainer;
