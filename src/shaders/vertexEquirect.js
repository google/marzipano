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
'attribute vec3 aVertexPosition;',

'uniform float uDepth;',
'uniform mat4 uViewportMatrix;',
'uniform mat4 uInvProjMatrix;',

'varying vec4 vRay;',

'void main(void) {',
'  vRay = uInvProjMatrix * vec4(aVertexPosition.xy, 1.0, 1.0);',
'  gl_Position = uViewportMatrix * vec4(aVertexPosition.xy, uDepth, 1.0);',
'}'
].join('\n');
