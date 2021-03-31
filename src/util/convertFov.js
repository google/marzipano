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
 * Convert fov
 *
 * For example, to convert from hfov to vfov one would call 
 * `convert(hfov, width, height)`
 *
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function convert(fov, fromDimension, toDimension) {
  return 2 * Math.atan(toDimension * Math.tan(fov / 2) / fromDimension);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function htov(fov, width, height) {
  return convert(fov, width, height);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function htod(fov, width, height) {
  return convert(fov, width, Math.sqrt(width * width + height * height));
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function vtoh(fov, width, height) {
  return convert(fov, height, width);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function vtod(fov, width, height) {
  return convert(fov, height, Math.sqrt(width * width + height * height));
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function dtoh(fov, width, height) {
  return convert(fov, Math.sqrt(width * width + height * height), width);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function dtov(fov, width, height) {
  return convert(fov, Math.sqrt(width * width + height * height), height);
}

/**
 * @namespace util.convertFov
 */
module.exports = {
  convert: convert,
  htov: htov,
  htod: htod,
  vtoh: vtoh,
  vtod: vtod,
  dtoh: dtoh,
  dtov: dtov
};
