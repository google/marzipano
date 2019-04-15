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

var Map = require('../collections/Map');
var decimal = require('../util/decimal');
var setOverflowHidden = require('../util/dom').setOverflowHidden;
var setNoPointerEvents = require('../util/dom').setNoPointerEvents;
var setNullTransform = require('../util/dom').setNullTransform;
var setTransform = require('../util/dom').setTransform;
var clearOwnProperties = require('../util/clearOwnProperties');

var debug = typeof MARZIPANODEBUG !== 'undefined' && MARZIPANODEBUG.css;


function tileCmp(a, b) {
  return a.cmp(b);
}


function CssBaseRenderer(root, quirks, tileClass) {

  this._root = root;

  this._browserQuirks = quirks;

  // Create a container for this renderer's tiles, so we can style them
  // as a whole separately from other renderers in the same stage.
  var domElement = document.createElement('div');
  root.appendChild(domElement);

  domElement.style.position = 'absolute';

  // For some weird reason, this prevents flickering on Safari Desktop.
  setOverflowHidden(domElement);

  // Prevent touch events on tiles from messing up pinching gestures on iOS.
  setNoPointerEvents(domElement);

  if (this._browserQuirks.useNullTransform) {
    setNullTransform(domElement);
  }

  this.domElement = domElement;

  this._oldTileList = [];
  this._newTileList = [];

  this._textureMap = new Map();
}


CssBaseRenderer.prototype.destroy = function() {
  this._root.removeChild(this.domElement);
  clearOwnProperties(this);
};


CssBaseRenderer.prototype.startLayer = function(layer, rect) {
  var domElement = this.domElement;

  // Set viewport effect.
  var stageWidth = this._root.clientWidth;
  var stageHeight = this._root.clientHeight;
  domElement.style.left = decimal(stageWidth * rect.left) + 'px';
  domElement.style.top = decimal(stageHeight * rect.top) + 'px';
  domElement.style.width = decimal(stageWidth * rect.width) + 'px';
  domElement.style.height = decimal(stageHeight * rect.height) + 'px';

  // Set opacity effect.
  var opacity = 1.0;
  var effects = layer.effects();
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }
  domElement.style.opacity = opacity;

  // Clear temporary variables.
  this._newTileList.length = 0;
  this._textureMap.clear();
};


CssBaseRenderer.prototype.renderTile = function(tile, texture) {
  this._newTileList.push(tile);
  this._textureMap.set(tile, texture);
};


CssBaseRenderer.prototype.endLayer = function(layer, rect) {

  var domElement = this.domElement;
  var oldTileList = this._oldTileList;
  var newTileList = this._newTileList;
  var textureMap = this._textureMap;
  var oldIndex, newIndex, oldTile, newTile;
  var texture, canvas;
  var currentNode, nextNode;

  var view = layer.view();

  // Iterate the old and new tile lists in a consistent order and perform
  // insertions and removals as we go. This minimizes the number of DOM
  // operations performed.

  // Neither the tile list nor the texture list may contain duplicates,
  // otherwise this logic will fail.

  // Consistency check.
  if (domElement.children.length !== oldTileList.length) {
    throw new Error('DOM not in sync with tile list');
  }

  newTileList.sort(tileCmp);

  oldIndex = 0;
  oldTile = oldTileList[oldIndex];
  currentNode = domElement.firstChild;

  for (newIndex = 0; newIndex < newTileList.length; newIndex++) {

    newTile = newTileList[newIndex];

    // Iterate old list until it catches up with the new list.
    while (oldIndex < oldTileList.length) {

      if (oldTile.cmp(newTile) >= 0) {
        // Caught up.
        break;
      }

      // Tile is no longer visible.
      // Remove it from the DOM.
      nextNode = currentNode.nextSibling;
      domElement.removeChild(currentNode);
      currentNode = nextNode;
      oldTile = oldTileList[++oldIndex];
    }

    // Get the texture for the current tile.
    texture = textureMap.get(newTile);
    canvas = texture ? texture._canvas : null;

    // Consistency check.
    if (!canvas) {
      throw new Error('Rendering tile with missing texture');
    }

    if (oldTile && oldTile.cmp(newTile) === 0) {
      // The old and new tile are the same.

      // Consistency check.
      if (canvas != currentNode) {
        throw new Error('DOM not in sync with tile list');
      }

      currentNode = currentNode.nextSibling;
      oldTile = oldTileList[++oldIndex];

    } else {
      // The new tile comes before the old tile.
      // Insert it into the DOM.
      domElement.insertBefore(canvas, currentNode);
    }

    // Set the CSS transform on the current tile.
    setTransform(canvas, this.calculateTransform(newTile, texture, view));

    if (debug) {
      canvas.setAttribute('data-tile', newTile.str());
    }
  }

  // Remove trailing tiles that are no longer visible from the DOM.
  while (currentNode) {
    nextNode = currentNode.nextSibling;
    domElement.removeChild(currentNode);
    currentNode = nextNode;
  }

  // Consistenty check.
  if (domElement.children.length !== newTileList.length) {
    throw new Error('DOM not in sync with tile list');
  }

  // The old and new tile lists swap roles between iterations.
  var tmp = this._oldTileList;
  this._oldTileList = this._newTileList;
  this._newTileList = tmp;
};


module.exports = CssBaseRenderer;
