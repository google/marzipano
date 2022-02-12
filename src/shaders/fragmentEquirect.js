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

export default [
'#ifdef GL_FRAGMENT_PRECISION_HIGH',
'precision highp float;',
'#else',
'precision mediump float',
'#endif',

'uniform sampler2D uSampler;',
'uniform float uOpacity;',
'uniform float uTextureX;',
'uniform float uTextureY;',
'uniform float uTextureWidth;',
'uniform float uTextureHeight;',
'uniform vec4 uColorOffset;',
'uniform mat4 uColorMatrix;',

'varying vec4 vRay;',

'const float PI = 3.14159265358979323846264;',

'void main(void) {',
'  float r = inversesqrt(vRay.x * vRay.x + vRay.y * vRay.y + vRay.z * vRay.z);',
'  float phi  = acos(vRay.y * r);',
'  float theta = atan(vRay.x, -1.0*vRay.z);',
'  float s = 0.5 + 0.5 * theta / PI;',
'  float t = 1.0 - phi / PI;',

'  s = s * uTextureWidth + uTextureX;',
'  t = t * uTextureHeight + uTextureY;',

'  vec4 color = texture2D(uSampler, vec2(s, t)) * uColorMatrix + uColorOffset;',
'  gl_FragColor = vec4(color.rgba * uOpacity);',
'}'
].join('\n');
