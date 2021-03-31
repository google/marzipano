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

// CanvasHackVideoElementWrapper is a wrapper around an HTML video element that
// copies each video frame into an HTML canvas element for rendering. This is a
// workaround for IE 11, which doesn't support WebGL video textures. Note,
// however, that the workaround won't work if the video is cross-domain. See:
// https://connect.microsoft.com/IE/feedbackdetail/view/941984/webgl-video-upload-to-texture-not-supported
// https://connect.microsoft.com/IE/feedback/details/967946/support-crossorigin-cors-for-drawing-video-to-canvas-both-2d-and-webgl
function CanvasHackVideoElementWrapper(videoElement) {
  this._videoElement = videoElement;
  this._drawElement = document.createElement('canvas');
}

CanvasHackVideoElementWrapper.prototype.videoElement = function() {
  return this._videoElement;
};

CanvasHackVideoElementWrapper.prototype.drawElement = function() {
  this._drawElement.width = this._videoElement.videoWidth;
  this._drawElement.height = this._videoElement.videoHeight;
  this._drawElement.getContext("2d").drawImage(this._videoElement, 0, 0);
  return this._drawElement;
};

CanvasHackVideoElementWrapper.prototype.destroy = function() {
  // TODO: This cleanup logic should be somewhere else, since the analogous
  // setup logic occurs outside this class.
  this._videoElement.pause();
  this._videoElement.volume = 0;
  this._videoElement.removeAttribute('src');
};
