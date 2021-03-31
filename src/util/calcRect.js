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

/**
 * Converts a {@link RectSpec} into an equivalent {@link Rect}.
 *
 * A {@link RectSpec} is a convenient user API format, providing default values
 * and the flexibility of specifying absolute, relative or mixed dimensions.
 *
 * A {@link Rect} is a more convenient format for the rendering pipeline. It is
 * always expressed in normalized coordinates, and all its properties are
 * guaranteed to be present.
 *
 * @param {number} totalWidth The total width of the rendering area in pixels.
 * @param {number} totalHeight The total height of the rendering area in pixels.
 * @param {RectSpec} spec The input spec, defaulting to the full rendering area
 *     if null or undefined.
 * @param {Rect} result The output spec. If the argument is present, it is
 *     filled in and returned; otherwise, a fresh object is returned.
 */
function calcRect(totalWidth, totalHeight, spec, result) {

  result = result || {};

  var width;
  if (spec != null && spec.absoluteWidth != null) {
    width = spec.absoluteWidth / totalWidth;
  } else if (spec != null && spec.relativeWidth != null) {
    width = spec.relativeWidth;
  } else {
    width = 1;
  }

  var height;
  if (spec && spec.absoluteHeight != null) {
    height = spec.absoluteHeight / totalHeight;
  } else if (spec != null && spec.relativeHeight != null) {
    height = spec.relativeHeight;
  } else {
    height = 1;
  }

  var x;
  if (spec != null && spec.absoluteX != null) {
    x = spec.absoluteX / totalWidth;
  } else if (spec != null && spec.relativeX != null) {
    x = spec.relativeX;
  } else {
    x = 0;
  }

  var y;
  if (spec != null && spec.absoluteY != null) {
    y = spec.absoluteY / totalHeight;
  } else if (spec != null && spec.relativeY != null) {
    y = spec.relativeY;
  } else {
    y = 0;
  }

  result.x = x;
  result.y = y;
  result.width = width;
  result.height = height;

  return result;
}

module.exports = calcRect;
