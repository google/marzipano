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

// Dynamic asset containing a video element.
// Note that this won't work on IE 11 because of lack of support for video
// textures. Refer to the video-multi-res demo for a possible workaround.
function VideoAsset(videoElement) {
  this._videoElement = null;
  this._destroyed = false;
  this._emitChange = this.emit.bind(this, 'change');
  this._lastTimestamp = -1;

  this._emptyCanvas = document.createElement('canvas');
  this._emptyCanvas.width = 1;
  this._emptyCanvas.height = 1;

  this.setVideo(videoElement);
}

Marzipano.dependencies.eventEmitter(VideoAsset);

VideoAsset.prototype.setVideo = function(videoElement) {
  var self = this;

  if (this._videoElement) {
    this._videoElement.removeEventListener('timeupdate', this._emitChange);
  }

  this._videoElement = videoElement;

  if (!this._videoElement) {
    return;
  }

  this._videoElement.addEventListener('timeupdate', this._emitChange);

  // Emit a change event on every frame while the video is playing.
  // TODO: make the loop sleep when video is not playing.
  if (this._emitChangeIfPlayingLoop) {
    cancelAnimationFrame(this._emitChangeIfPlayingLoop);
    this._emitChangeIfPlayingLoop = null;
  }

  function emitChangeIfPlaying() {
    if (!self._videoElement.paused) {
      self.emit('change');
    }
    if (!self._destroyed) {
      self._emitChangeIfPlayingLoop = requestAnimationFrame(emitChangeIfPlaying);
    }
  }
  emitChangeIfPlaying();

  this.emit('change');
};

VideoAsset.prototype.width = function() {
  if (this._videoElement) {
    return this._videoElement.videoWidth;
  } else {
    return this._emptyCanvas.width;
  }
};

VideoAsset.prototype.height = function() {
  if (this._videoElement) {
    return this._videoElement.videoHeight;
  } else {
    return this._emptyCanvas.height;
  }
};

VideoAsset.prototype.element = function() {
  // If element is null, show an empty canvas. This will cause a transparent
  // image to be rendered when no video is present.
  if (this._videoElement) {
    return this._videoElement;
  } else {
    return this._emptyCanvas;
  }
};

VideoAsset.prototype.isDynamic = function() {
  return true;
};

VideoAsset.prototype.timestamp = function() {
  if (this._videoElement) {
    this._lastTimestamp = this._videoElement.currentTime;
  }
  return this._lastTimestamp;
};

VideoAsset.prototype.destroy = function() {
  this._destroyed = true;
  if (this._videoElement) {
    this._videoElement.removeEventListener('timeupdate', this._emitChange);
  }
  if (this._emitChangeIfPlayingLoop) {
    cancelAnimationFrame(this._emitChangeIfPlayingLoop);
    this._emitChangeIfPlayingLoop = null;
  }
};
