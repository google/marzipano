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
function convert(fov: number, fromDimension: number, toDimension: number) {
  return 2 * Math.atan(toDimension * Math.tan(fov / 2) / fromDimension);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function htov(fov: number, width: number, height: number) {
  return convert(fov, width, height);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function htod(fov: number, width: number, height: number) {
  return convert(fov, width, Math.sqrt(width * width + height * height));
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function vtoh(fov: number, width: number, height: number) {
  return convert(fov, height, width);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function vtod(fov: number, width: number, height: number) {
  return convert(fov, height, Math.sqrt(width * width + height * height));
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function dtoh(fov: number, width: number, height: number) {
  return convert(fov, Math.sqrt(width * width + height * height), width);
}

/**
 * @param {number} fov
 * @param {number} fromDimension
 * @param {number} toDimension
 * @return {number}
 * @memberof util.convertFov
 */
function dtov(fov: number, width: number, height: number) {
  return convert(fov, Math.sqrt(width * width + height * height), height);
}

export {
  convert,
  htov,
  htod,
  vtoh,
  vtod,
  dtoh,
  dtov
};

// TODO: rethink these exports
/**
 * @namespace util.convertFov
 */
export default {
  convert: convert,
  htov: htov,
  htod: htod,
  vtoh: vtoh,
  vtod: vtod,
  dtoh: dtoh,
  dtov: dtov
};
