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

// These are used to set the WebGl depth for a tile.
var MAX_LAYERS = 256; // Max number of layers per stage.
var MAX_LEVELS = 256; // Max number of levels per layer.

var clamp = require('../util/clamp');
var vec4 = require('gl-matrix').vec4;
var vec3 = require('gl-matrix').vec3;
var mat4 = require('gl-matrix').mat4;


function createShader(gl, type, src) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }
  return shader;
}


function createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList) {

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

  var shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(shaderProgram);
  }

  for (var i = 0; i < attribList.length; i++) {
    var attrib = attribList[i];
    shaderProgram[attrib] = gl.getAttribLocation(shaderProgram, attrib);
    if (shaderProgram[attrib] === -1) {
      throw new Error('Shader program has no ' + attrib + ' attribute');
    }
  }

  for (var j = 0; j < uniformList.length; j++) {
    var uniform = uniformList[j];
    shaderProgram[uniform] = gl.getUniformLocation(shaderProgram, uniform);
    if (shaderProgram[uniform] === -1) {
      throw new Error('Shader program has no ' + uniform + ' uniform');
    }
  }

  return shaderProgram;
}


function destroyShaderProgram(gl, shaderProgram) {
  var shaderList = gl.getAttachedShaders(shaderProgram);
  for (var i = 0; i < shaderList.length; i++) {
    var shader = shaderList[i];
    gl.detachShader(shaderProgram, shader);
    gl.deleteShader(shader);
  }
  gl.deleteProgram(shaderProgram);
}


function createConstantBuffer(gl, target, usage, value) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, value, usage);
  return buffer;
}


function createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords) {
  return {
    vertexIndices: createConstantBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, new Uint16Array(vertexIndices)),
    vertexPositions: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertexPositions)),
    textureCoords: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(textureCoords))
  };
}


function destroyConstantBuffers(gl, constantBuffers) {
  gl.deleteBuffer(constantBuffers.vertexIndices);
  gl.deleteBuffer(constantBuffers.vertexPositions);
  gl.deleteBuffer(constantBuffers.textureCoords);
}


function enableAttributes(gl, shaderProgram) {
  var numAttrs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
  for (var i = 0; i < numAttrs; i++) {
    gl.enableVertexAttribArray(i);
  }
}


function disableAttributes(gl, shaderProgram) {
  var numAttrs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
  for (var i = 0; i < numAttrs; i++) {
    gl.disableVertexAttribArray(i);
  }
}


function setTexture(gl, shaderProgram, texture) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture._texture);
  gl.uniform1i(shaderProgram.uSampler, 0);
}


function setDepth(gl, shaderProgram, layerZ, tileZ) {
  var depth = (((layerZ + 1) * MAX_LEVELS) - tileZ) / (MAX_LEVELS * MAX_LAYERS);
  gl.uniform1f(shaderProgram.uDepth, depth);
}


var defaultOpacity = 1.0;
var defaultColorOffset = vec4.create();
var defaultColorMatrix = mat4.create();
mat4.identity(defaultColorMatrix);

function setupPixelEffectUniforms(gl, effects, uniforms) {
  var opacity = defaultOpacity;
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }
  gl.uniform1f(uniforms.opacity, opacity);

  var colorOffset = defaultColorOffset;
  if (effects && effects.colorOffset) {
    colorOffset = effects.colorOffset;
  }
  gl.uniform4fv(uniforms.colorOffset, colorOffset);

  var colorMatrix = defaultColorMatrix;
  if (effects && effects.colorMatrix) {
    colorMatrix = effects.colorMatrix;
  }
  gl.uniformMatrix4fv(uniforms.colorMatrix, false, colorMatrix);
}


// Temporary vectors for setViewport.
var translateVector = vec3.create();
var scaleVector = vec3.create();


// Sets the WebGL viewport and returns a viewport clamping compensation matrix.
//
// Negative viewport origin coordinates cause rendering issues. Letting the
// viewport dimensions extend beyond the visible area do not seem to cause
// rendering issues, but they may still have an impact on performance.
// Therefore, when the scene's rect is not fully contained in the rendering
// area, we clamp the viewport to the rendering area, and return a compensation
// matrix to scale and translate vertices accordingly.
function setViewport(gl, layer, rect, viewportMatrix) {
  if (rect.x === 0 && rect.width === 1 && rect.y === 0 && rect.height === 1) {
    // Fast path for full rect.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.identity(viewportMatrix);
    return;
  }

  var offsetX = rect.x;
  var clampedOffsetX = clamp(offsetX, 0, 1);
  var leftExcess = clampedOffsetX - offsetX;
  var maxClampedWidth = 1 - clampedOffsetX;
  var clampedWidth = clamp(rect.width - leftExcess, 0, maxClampedWidth);
  var rightExcess = rect.width - clampedWidth;

  var offsetY = 1 - rect.height - rect.y;
  var clampedOffsetY = clamp(offsetY, 0, 1);
  var bottomExcess = clampedOffsetY - offsetY;
  var maxClampedHeight = 1 - clampedOffsetY;
  var clampedHeight = clamp(rect.height - bottomExcess, 0, maxClampedHeight);
  var topExcess = rect.height - clampedHeight;

  vec3.set(
    scaleVector,
    rect.width / clampedWidth,
    rect.height / clampedHeight,
    1);

  vec3.set(
    translateVector,
    (rightExcess - leftExcess) / clampedWidth,
    (topExcess - bottomExcess) / clampedHeight,
    0);

  mat4.identity(viewportMatrix);
  mat4.translate(viewportMatrix, viewportMatrix, translateVector);
  mat4.scale(viewportMatrix, viewportMatrix, scaleVector);

  gl.viewport(gl.drawingBufferWidth * clampedOffsetX,
              gl.drawingBufferHeight * clampedOffsetY,
              gl.drawingBufferWidth * clampedWidth,
              gl.drawingBufferHeight * clampedHeight);
}

module.exports = {
  createShaderProgram: createShaderProgram,
  destroyShaderProgram: destroyShaderProgram,
  createConstantBuffers: createConstantBuffers,
  destroyConstantBuffers: destroyConstantBuffers,
  enableAttributes: enableAttributes,
  disableAttributes: disableAttributes,
  setTexture: setTexture,
  setDepth: setDepth,
  setViewport: setViewport,
  setupPixelEffectUniforms: setupPixelEffectUniforms
};
