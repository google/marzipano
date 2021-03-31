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

var colorEffects = {

  brightness: function(amount, result) {
    result = Marzipano.colorEffects.identity(result);

    result.colorOffset[0] = amount;
    result.colorOffset[1] = amount;
    result.colorOffset[2] = amount;

    return result;
  },

  sepia: function(amount, result) {
    result = Marzipano.colorEffects.identity(result);

    result.colorMatrix[0] = 1.0 - (0.607 * amount);
    result.colorMatrix[1] = 0.769 * amount;
    result.colorMatrix[2] = 0.189 * amount;
    result.colorMatrix[3] = 0;

    result.colorMatrix[4] = 0.349 * amount;
    result.colorMatrix[5] = 1.0 - (0.314 * amount);
    result.colorMatrix[6] = 0.168 * amount;
    result.colorMatrix[7] = 0;

    result.colorMatrix[8] = 0.272 * amount;
    result.colorMatrix[9] = 0.534 * amount;
    result.colorMatrix[10] = 1.0 - (0.869 * amount);
    result.colorMatrix[11] = 0;

    result.colorMatrix[12] = 0;
    result.colorMatrix[13] = 0;
    result.colorMatrix[14] = 0;
    result.colorMatrix[15] = 1;

    result.colorOffset[0] = 0;
    result.colorOffset[1] = 0;
    result.colorOffset[2] = 0;

    return result;
  },

  saturation: function(amount, result) {
    result = Marzipano.colorEffects.identity(result);

    var lumR = 0.3086;
    var lumG = 0.6094;
    var lumB = 0.0820;

    var sr = (1 - amount) * lumR;
    var sg = (1 - amount) * lumG;
    var sb = (1 - amount) * lumB;

    result.colorMatrix[0] = sr + amount;
    result.colorMatrix[1] = sg;
    result.colorMatrix[2] = sb;
    result.colorMatrix[3] = 0;

    result.colorMatrix[4] = sr;
    result.colorMatrix[5] = sg + amount;
    result.colorMatrix[6] = sb;
    result.colorMatrix[7] = 0;

    result.colorMatrix[8] = sr;
    result.colorMatrix[9] = sg;
    result.colorMatrix[10] = sb + amount;
    result.colorMatrix[11] = 0;

    result.colorMatrix[12] = 0;
    result.colorMatrix[13] = 0;
    result.colorMatrix[14] = 0;
    result.colorMatrix[15] = 1;

    result.colorOffset[0] = 0;
    result.colorOffset[1] = 0;
    result.colorOffset[2] = 0;

    return result;
  },

  contrast: function(amount, result) {
    result = Marzipano.colorEffects.identity(result);

    result.colorMatrix[0] = amount;
    result.colorMatrix[1] = 0;
    result.colorMatrix[2] = 0;
    result.colorMatrix[3] = 0;

    result.colorMatrix[4] = 0;
    result.colorMatrix[5] = amount;
    result.colorMatrix[6] = 0;
    result.colorMatrix[7] = 0;

    result.colorMatrix[8] = 0;
    result.colorMatrix[9] = 0;
    result.colorMatrix[10] = amount;
    result.colorMatrix[11] = 0;

    result.colorMatrix[12] = 0;
    result.colorMatrix[13] = 0;
    result.colorMatrix[14] = 0;
    result.colorMatrix[15] = 1;

    result.colorOffset[0] = (1 - amount)/2;
    result.colorOffset[1] = (1 - amount)/2;
    result.colorOffset[2] = (1 - amount)/2;

    return result;
  }

};
