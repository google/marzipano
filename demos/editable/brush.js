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

(function() {
  var viewerElement = document.querySelector('#pano');

  var brush = {
    radius: 30,
    updateCursor: updateCursor
  };

  // Brush DOM element
  var element = document.createElement('div');
  element.style.width = (brush.radius * 2) + 'px';
  element.style.height = (brush.radius * 2) + 'px';
  element.style.marginTop = (-brush.radius) + 'px';
  element.style.marginLeft = (-brush.radius) + 'px';
  element.style.position = 'absolute';
  element.style.pointerEvents = 'none';
  element.style.borderStyle = 'solid';
  element.style.borderWidth = '1px';
  element.style.borderColor = '#333333';
  element.style.borderRadius = '50%';
  element.style.display = 'none';
  document.body.appendChild(element);

  var mousePosition = null;
  var displayingBrush = false;

  // Update mousePosition variable for fake cursor
  viewerElement.addEventListener('mousemove', function(e) {
    mousePosition = { x: e.clientX, y: e.clientY };
    updateCursor();
  });
  window.addEventListener('blur', function() {
    mousePosition = null;
    updateCursor();
  });

  function updateCursor() {
    if (mousePosition && editMode.get()) {
      element.style.transform = "translateX(" + mousePosition.x + "px) " +
                                "translateY(" + mousePosition.y + "px) " +
                                "translateZ(0)";
      if (!displayingBrush) {
        viewerElement.style.cursor = 'none';
        element.style.display = 'block';
        displayingBrush = true;
      }
    } else {
      if (displayingBrush) {
        element.style.display = 'none';
        viewerElement.style.cursor = null;
        displayingBrush = false;
      }
    }
  }

  window.brush = brush;
})();
