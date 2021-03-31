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

module.exports = [
'#ifdef GL_FRAGMENT_PRECISION_HIGH',
'precision highp float;',
'#else',
'precision mediump float;',
'#endif',

'uniform sampler2D uSampler;',
'uniform float uOpacity;',
'uniform vec4 uColorOffset;',
'uniform mat4 uColorMatrix;',

'varying vec2 vTextureCoord;',

'void main(void) {',
'  vec4 color = texture2D(uSampler, vTextureCoord) * uColorMatrix + uColorOffset;',
'  gl_FragColor = vec4(color.rgba * uOpacity);',
'}'
].join('\n');
