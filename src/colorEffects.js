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

import { vec4 as vec4 } from "gl-matrix";
import { mat4 as mat4 } from "gl-matrix";

/**
 * Helper functions for color transformation {@link Effects}.
 *
 * References:
 *
 *   - [ColorMatrix Guide](http://docs.rainmeter.net/tips/colormatrix-guide)
 *   - [Matrix Operations for Image Processing](http://www.graficaobscura.com/matrix/index.html)
 *   - [WebGLImageFilter](https://github.com/phoboslab/WebGLImageFilter)
 *   - [glfx.js](https://github.com/evanw/glfx.js)
 *
 * @namespace colorEffects
 */

/**
 * A vector and matrix corresponding to an identity transformation.
 *
 * @param {Object} result Object to store result
 * @param {vec4} result.colorOffset Array with zeroes.
 * @param {mat4} result.colorMatrix Identity matrix.
 *
 * @memberof colorEffects
 */
function identity(resultArg) {
  var result = resultArg || {};
  result.colorOffset = result.colorOffset || vec4.create();
  result.colorMatrix = result.colorMatrix || mat4.create();
  return result;
}

/**
 * Apply color effects to a single pixel
 *
 * @param {vec4} pixel Values in range [0,1]
 * @param {Object} effect
 * @param {vec4} effect.colorOffset
 * @param {mat4} effect.colorMatrix
 * @param {vec4} result Object to store result
 *
 * @memberof colorEffects
 */
function applyToPixel(pixel, effect, result) {
  vec4TransformMat4Transposed(result, pixel, effect.colorMatrix);
  vec4.add(result, result, effect.colorOffset);
}

// Oddly, the colorTransform matrix needs to be transposed to be used with
// vec4.transformMat4. It is strange that transformMat4 dosn't work the same
// way as multiplying on the shader.
// TODO: investigate this further
function vec4TransformMat4Transposed(out, a, m) {
  var x = a[0], y = a[1], z = a[2], w = a[3];
  out[0] = m[0] * x + m[1] * y + m[2] * z + m[3] * w;
  out[1] = m[4] * x + m[5] * y + m[6] * z + m[7] * w;
  out[2] = m[8] * x + m[9] * y + m[10] * z + m[11] * w;
  out[3] = m[12] * x + m[13] * y + m[14] * z + m[15] * w;
  return out;
}

/**
 * Apply color effects to an ImageData
 *
 * @param {ImageData} imageData This object will be mutated
 * @param {Object} effect
 * @param {vec4} effect.colorOffset
 * @param {mat4} effect.colorMatrix
 *
 * @memberof colorEffects
 */
var tmpPixel = vec4.create();
function applyToImageData(imageData, effect) {
  var width = imageData.width;
  var height = imageData.height;
  var data = imageData.data;

  for(var i = 0; i < width * height; i++) {
    vec4.set(tmpPixel, data[i*4+0]/255, data[i*4+1]/255, data[i*4+2]/255, data[i*4+3]/255);
    applyToPixel(tmpPixel, effect, tmpPixel);
    data[i*4+0] = tmpPixel[0]*255;
    data[i*4+1] = tmpPixel[1]*255;
    data[i*4+2] = tmpPixel[2]*255;
    data[i*4+3] = tmpPixel[3]*255;
  }
}

// TODO: refactor to named exports
export default {
  identity: identity,
  applyToPixel: applyToPixel,
  applyToImageData: applyToImageData
};
