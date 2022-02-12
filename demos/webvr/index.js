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
// TODO: verify with VR headset
import Marzipano from '../../src/index.js';
import WebVrView from './WebVrView.js';

var mat4 = Marzipano.dependencies.glMatrix.mat4;
var quat = Marzipano.dependencies.glMatrix.quat;

var degToRad = Marzipano.util.degToRad;

var viewerElement = document.querySelector("#pano");
var enterVrElement = document.querySelector("#enter-vr");
var noVrElement = document.querySelector("#no-vr");

// Install the WebVR polyfill, which makes the demo functional on "fake" WebVR
// displays such as Google Cardboard.
var polyfill = new WebVRPolyfill();

// Create stage and register renderers.
var stage = new Marzipano.WebGlStage();
Marzipano.registerDefaultRenderers(stage);

// Insert stage into the DOM.
viewerElement.appendChild(stage.domElement());

// Update the stage size whenever the window is resized.
function updateSize() {
  stage.setSize({
    width: viewerElement.clientWidth,
    height: viewerElement.clientHeight
  });
}
updateSize();
window.addEventListener('resize', updateSize);

// Create geometry.
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(4096, 110*Math.PI/180);
var viewLeft = new WebVrView();
var viewRight = new WebVrView();

// Create layers.
var layerLeft = createLayer(stage, viewLeft, geometry, 'left',
  { relativeWidth: 0.5, relativeX: 0 });
var layerRight = createLayer(stage, viewRight, geometry, 'right',
  { relativeWidth: 0.5, relativeX: 0.5 });

// Add layers into stage.
stage.addLayer(layerLeft);
stage.addLayer(layerRight);

// Check for an available VR device and initialize accordingly.
var vrDisplay = null;
navigator.getVRDisplays().then(function(vrDisplays) {
  if (vrDisplays.length > 0) {
    vrDisplay = vrDisplays[0];
    vrDisplay.requestAnimationFrame(render);
  }
  enterVrElement.style.display = vrDisplay ? 'block' : 'none';
  noVrElement.style.display = vrDisplay ? 'none' : 'block';
});

// Enter WebVR mode when the button is clicked.
enterVrElement.addEventListener('click', function() {
  vrDisplay.requestPresent([{source: stage.domElement()}]);
});

var proj = mat4.create();
var pose = mat4.create();

function render() {
  var frameData = new VRFrameData;
  vrDisplay.getFrameData(frameData);

  // Update the view.
  // The panorama demo at https://github.com/toji/webvr.info/tree/master/samples
  // recommends computing the view matrix from `frameData.pose.orientation`
  // instead of using `frameData.{left,right}ViewMatrix.
  if (frameData.pose.orientation) {
    mat4.fromQuat(pose, frameData.pose.orientation);
    mat4.invert(pose, pose);

    mat4.copy(proj, frameData.leftProjectionMatrix);
    mat4.multiply(proj, proj, pose);
    viewLeft.setProjection(proj);

    mat4.copy(proj, frameData.rightProjectionMatrix);
    mat4.multiply(proj, proj, pose);
    viewRight.setProjection(proj);
  }

  // Render and submit to WebVR display.
  stage.render();
  vrDisplay.submitFrame();

  // Render again on the next frame.
  vrDisplay.requestAnimationFrame(render);
}

function createLayer(stage, view, geometry, eye, rect) {
  var urlPrefix = "//www.marzipano.net/media/music-room";
  var source = new Marzipano.ImageUrlSource.fromString(
    urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg",
    { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

  var textureStore = new Marzipano.TextureStore(source, stage);
  var layer = new Marzipano.Layer(source, geometry, view, textureStore,
    { effects: { rect: rect }});

  layer.pinFirstLevel();

  return layer;
}
