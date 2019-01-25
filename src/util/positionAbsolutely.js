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

var cssSupported = require('../support/Css');
var setTransform = require('./dom').setTransform;
var setPixelPosition = require('./dom').setPixelPosition;
var decimal = require('./decimal');

// This cannot belong in util/dom.js because support/Css also depends on it
// and it would cause a circular dependency.

function positionAbsolutely(element, x, y, extraTransforms) {
  if (cssSupported()) {
    // Use CSS 3D transforms when the browser supports them.
    // A translateZ(0) transform improves performance on Chrome by creating a
    // new layer for the element, which prevents unnecessary repaints.
    var transform = 'translateX(' + decimal(x) + 'px) translateY(' + decimal(y) + 'px) translateZ(0) ' + extraTransforms;
    setTransform(element, transform);
  } else {
    // Fall back to absolute positioning.
    setPixelPosition(element, x, y);
  }
}

module.exports = positionAbsolutely;
