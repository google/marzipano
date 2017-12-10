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

var WebGlCommon = require('./WebGlCommon');
var createConstantBuffers = WebGlCommon.createConstantBuffers;
var createShaderProgram = WebGlCommon.createShaderProgram;
var setViewport = WebGlCommon.setViewport;
var destroyConstantBuffers = WebGlCommon.destroyConstantBuffers;
var destroyShaderProgram = WebGlCommon.destroyShaderProgram;
var setupPixelEffectUniforms = WebGlCommon.setupPixelEffectUniforms;

var setDepth = WebGlCommon.setDepth;
var setTexture = WebGlCommon.setTexture;

var glslify = require('glslify');
var vertexSrc = glslify('../shaders/vertexEquirect');
var fragmentSrc = glslify('../shaders/fragmentEquirect');

var vertexIndices = [0, 1, 2, 0, 2, 3];
var vertexPositions = [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0];
var textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];

var attribList = ['aVertexPosition', 'aTextureCoord'];
var uniformList = [
  'uDepth', 'uOpacity', 'uSampler', 'uInvProjMatrix', 'uViewportMatrix',
  'uColorOffset', 'uColorMatrix', 'uTextureX', 'uTextureY', 'uTextureWidth',
  'uTextureHeight'
];

var mat4 = require('gl-matrix/src/gl-matrix/mat4');


/**
 * @class
 * @classdesc A renderer for {@link EquirectGeometry} and
 *     {@link RectilinearView}, appropriate for {@link WebGlStage}.
 * @implements Renderer
 */
function WebGlEquirectRenderer(gl) {
  this.gl = gl;

  // The inverse projection matrix.
  this.invProjMatrix = mat4.create();

  // The viewport matrix responsible for viewport clamping.
  // See setViewport() for an explanation of how it works.
  this.viewportMatrix = mat4.create();

  this.constantBuffers = createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords);

  this.shaderProgram = createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList);
}

WebGlEquirectRenderer.prototype.destroy = function() {
  destroyConstantBuffers(this.gl, this.constantBuffers);
  this.constantBuffers = null;

  destroyShaderProgram(this.gl, this.shaderProgram);
  this.shaderProgram = null;

  this.invProjMatrix = null;
  this.viewportMatrix = null;

  this.gl = null;
};


WebGlEquirectRenderer.prototype.startLayer = function(layer, rect) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;
  var invProjMatrix = this.invProjMatrix;
  var viewportMatrix = this.viewportMatrix;

  gl.useProgram(shaderProgram);

  setViewport(gl, layer, rect, viewportMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewportMatrix, false, viewportMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.vertexPositions);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.textureCoords);
  gl.vertexAttribPointer(shaderProgram.aTextureCoord, 2, gl.FLOAT, gl.FALSE, 0, 0);

  // Compute and set the inverse projection matrix.
  mat4.copy(invProjMatrix, layer.view().projection());
  mat4.invert(invProjMatrix, invProjMatrix);

  gl.uniformMatrix4fv(shaderProgram.uInvProjMatrix, false, invProjMatrix);

  // Compute and set the texture scale and crop offsets.
  var textureCrop = layer.effects().textureCrop || {};
  var textureX = textureCrop.x != null ? textureCrop.x : 0;
  var textureY = textureCrop.y != null ? textureCrop.y : 0;
  var textureWidth = textureCrop.width != null ? textureCrop.width : 1;
  var textureHeight = textureCrop.height != null ? textureCrop.height : 1;

  gl.uniform1f(shaderProgram.uTextureX, textureX);
  gl.uniform1f(shaderProgram.uTextureY, textureY);
  gl.uniform1f(shaderProgram.uTextureWidth, textureWidth);
  gl.uniform1f(shaderProgram.uTextureHeight, textureHeight);

  setupPixelEffectUniforms(gl, layer.effects(), {
    opacity: shaderProgram.uOpacity,
    colorOffset: shaderProgram.uColorOffset,
    colorMatrix: shaderProgram.uColorMatrix
  });
};


WebGlEquirectRenderer.prototype.endLayer = function() {};


WebGlEquirectRenderer.prototype.renderTile = function(tile, texture, layer, layerZ) {
  var gl = this.gl;
  var shaderProgram = this.shaderProgram;
  var constantBuffers = this.constantBuffers;

  setDepth(gl, shaderProgram, layerZ, tile.z);

  setTexture(gl, shaderProgram, texture);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, constantBuffers.vertexIndices);
  gl.drawElements(gl.TRIANGLES, vertexIndices.length, gl.UNSIGNED_SHORT, 0);
};


module.exports = WebGlEquirectRenderer;
