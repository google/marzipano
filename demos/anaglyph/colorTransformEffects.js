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

// Anaglyph methods from http://www.3dtv.at/knowhow/anaglyphcomparison_en.aspx.
//
// An anaglyph is produced by the additive composition of two images taken from
// slightly different vantage points, where the left image only contains the red
// channel and the right image only contains the green and blue channels.
//
// Each of the functions below returns a pair of color matrices that compute the
// left and right components when applied to the original (full-color) images.
//
// The alpha coefficients of the color matrices were chosen so that the blend
// function used by Marzipano, glBlend(ONE, ONE_MINUS_SRC_ALPHA), results in
// additive composition when the left image is rendered on top of the right one.

// Luminance values.
var lumR = 0.3086;
var lumG = 0.6094;
var lumB = 0.0820;

function gray() {
  var leftEffects = Marzipano.colorEffects.identity();
  var leftMatrix = leftEffects.colorMatrix;

  leftMatrix[0] = lumR;
  leftMatrix[1] = lumG;
  leftMatrix[2] = lumB;
  leftMatrix[3] = 0;

  leftMatrix[4] = 0;
  leftMatrix[5] = 0;
  leftMatrix[6] = 0;
  leftMatrix[7] = 0;

  leftMatrix[8] = 0;
  leftMatrix[9] = 0;
  leftMatrix[10] = 0;
  leftMatrix[11] = 0;

  leftMatrix[12] = 0;
  leftMatrix[13] = 0;
  leftMatrix[14] = 0;
  leftMatrix[15] = 0;

  var rightEffects = Marzipano.colorEffects.identity();
  var rightMatrix = rightEffects.colorMatrix;

  rightMatrix[0] = 0;
  rightMatrix[1] = 0;
  rightMatrix[2] = 0;
  rightMatrix[3] = 0;

  rightMatrix[4] = lumR;
  rightMatrix[5] = lumG;
  rightMatrix[6] = lumB;
  rightMatrix[7] = 0;

  rightMatrix[8] = lumR;
  rightMatrix[9] = lumG;
  rightMatrix[10] = lumB;
  rightMatrix[11] = 0;

  rightMatrix[12] = 0;
  rightMatrix[13] = 0;
  rightMatrix[14] = 0;
  rightMatrix[15] = 1;

  return { left: leftEffects, right: rightEffects };
}

function color() {
  var leftEffects = Marzipano.colorEffects.identity();
  var leftMatrix = leftEffects.colorMatrix;

  leftMatrix[0] = 1;
  leftMatrix[1] = 0;
  leftMatrix[2] = 0;
  leftMatrix[3] = 0;

  leftMatrix[4] = 0;
  leftMatrix[5] = 0;
  leftMatrix[6] = 0;
  leftMatrix[7] = 0;

  leftMatrix[8] = 0;
  leftMatrix[9] = 0;
  leftMatrix[10] = 0;
  leftMatrix[11] = 0;

  leftMatrix[12] = 0;
  leftMatrix[13] = 0;
  leftMatrix[14] = 0;
  leftMatrix[15] = 0;

  var rightEffects = Marzipano.colorEffects.identity();
  var rightMatrix = rightEffects.colorMatrix;

  rightMatrix[0] = 0;
  rightMatrix[1] = 0;
  rightMatrix[2] = 0;
  rightMatrix[3] = 0;

  rightMatrix[4] = 0;
  rightMatrix[5] = 1;
  rightMatrix[6] = 0;
  rightMatrix[7] = 0;

  rightMatrix[8] = 0;
  rightMatrix[9] = 0;
  rightMatrix[10] = 1;
  rightMatrix[11] = 0;

  rightMatrix[12] = 0;
  rightMatrix[13] = 0;
  rightMatrix[14] = 0;
  rightMatrix[15] = 1;

  return { left: leftEffects, right: rightEffects };
}

function halfcolor() {
  var leftEffects = Marzipano.colorEffects.identity();
  var leftMatrix = leftEffects.colorMatrix;

  leftMatrix[0] = lumR;
  leftMatrix[1] = lumG;
  leftMatrix[2] = lumB;
  leftMatrix[3] = 0;

  leftMatrix[4] = 0;
  leftMatrix[5] = 0;
  leftMatrix[6] = 0;
  leftMatrix[7] = 0;

  leftMatrix[8] = 0;
  leftMatrix[9] = 0;
  leftMatrix[10] = 0;
  leftMatrix[11] = 0;

  leftMatrix[12] = 0;
  leftMatrix[13] = 0;
  leftMatrix[14] = 0;
  leftMatrix[15] = 0;

  var rightEffects = Marzipano.colorEffects.identity();
  var rightMatrix = rightEffects.colorMatrix;

  rightMatrix[0] = 0;
  rightMatrix[1] = 0;
  rightMatrix[2] = 0;
  rightMatrix[3] = 0;

  rightMatrix[4] = 0;
  rightMatrix[5] = 1;
  rightMatrix[6] = 0;
  rightMatrix[7] = 0;

  rightMatrix[8] = 0;
  rightMatrix[9] = 0;
  rightMatrix[10] = 1;
  rightMatrix[11] = 0;

  rightMatrix[12] = 0;
  rightMatrix[13] = 0;
  rightMatrix[14] = 0;
  rightMatrix[15] = 1;

  return { left: leftEffects, right: rightEffects };
}

function optimized() {
  var leftEffects = Marzipano.colorEffects.identity();
  var leftMatrix = leftEffects.colorMatrix;

  leftMatrix[0] = 0;
  leftMatrix[1] = 0.7;
  leftMatrix[2] = 0.3;
  leftMatrix[3] = 0;

  leftMatrix[4] = 0;
  leftMatrix[5] = 0;
  leftMatrix[6] = 0;
  leftMatrix[7] = 0;

  leftMatrix[8] = 0;
  leftMatrix[9] = 0;
  leftMatrix[10] = 0;
  leftMatrix[11] = 0;

  leftMatrix[12] = 0;
  leftMatrix[13] = 0;
  leftMatrix[14] = 0;
  leftMatrix[15] = 0;

  var rightEffects = Marzipano.colorEffects.identity();
  var rightMatrix = rightEffects.colorMatrix;

  rightMatrix[0] = 0;
  rightMatrix[1] = 0;
  rightMatrix[2] = 0;
  rightMatrix[3] = 0;

  rightMatrix[4] = 0;
  rightMatrix[5] = 1;
  rightMatrix[6] = 0;
  rightMatrix[7] = 0;

  rightMatrix[8] = 0;
  rightMatrix[9] = 0;
  rightMatrix[10] = 1;
  rightMatrix[11] = 0;

  rightMatrix[12] = 0;
  rightMatrix[13] = 0;
  rightMatrix[14] = 0;
  rightMatrix[15] = 1;

  return { left: leftEffects, right: rightEffects };
}

var colorTransformEffects = {
  gray: gray,
  color: color,
  halfcolor: halfcolor,
  optimized: optimized
};
