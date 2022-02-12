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
import Marzipano from '../../src/index.js';

// Dynamic asset containing a video element.
//
// The wrappedVideo argument should be an object exposing two methods:
//   - videoElement() returning the actual HTML video element;
//   - drawElement() returning the HTML element to be used as a WebGL texture.
//
// The two available implementations are NullVideoElementWrapper and
// CanvasHackVideoElementWrapper. See the respective files for an explanation.
class VideoAsset {
  constructor(wrappedVideo) {
    this._wrappedVideo = null;
    this._destroyed = false;
    this._emitChange = this.emit.bind(this, 'change');
    this._lastTimestamp = -1;

    this.setVideo(wrappedVideo);

    this.emptyCanvas = document.createElement('canvas');
    this.emptyCanvas.width = 1;
    this.emptyCanvas.height = 1;
  }
  setVideo(wrappedVideo) {
    var self = this;

    this._wrappedVideo = wrappedVideo;

    if (this._wrappedVideo) {
      this._wrappedVideo.videoElement().removeEventListener('timeupdate', this._emitChange);
    }

    if (wrappedVideo == null) {
      return;
    }

    var videoElement = wrappedVideo.videoElement();

    videoElement.addEventListener('timeupdate', this._emitChange);

    // Emit a change event on every frame while the video is playing.
    // TODO: make the loop sleep when video is not playing.
    if (this._emitChangeIfPlayingLoop) {
      cancelAnimationFrame(this._emitChangeIfPlayingLoop);
      this._emitChangeIfPlayingLoop = null;
    }

    function emitChangeIfPlaying() {
      if (!videoElement.paused) {
        self.emit('change');
      }
      if (!self._destroyed) {
        self._emitChangeIfPlayingLoop = requestAnimationFrame(emitChangeIfPlaying);
      }
    }
    emitChangeIfPlaying();

    this.emit('change');
  }
  width() {
    if (this._wrappedVideo) {
      return this._wrappedVideo.videoElement().videoWidth;
    } else {
      return this.emptyCanvas.width;
    }
  }
  height() {
    if (this._wrappedVideo) {
      return this._wrappedVideo.videoElement().videoHeight;
    } else {
      return this.emptyCanvas.height;
    }
  }
  element() {
    // If element is null, show an empty canvas. This will cause a transparent
    // image to be rendered when no video is present.
    if (this._wrappedVideo) {
      return this._wrappedVideo.drawElement();
    } else {
      return this.emptyCanvas;
    }
  }
  video() {
    return this._wrappedVideo;
  }
  isDynamic() {
    return true;
  }
  timestamp() {
    if (this._wrappedVideo) {
      this._lastTimestamp = this._wrappedVideo.videoElement().currentTime;
    }
    return this._lastTimestamp;
  }
  destroy() {
    this._destroyed = true;
    if (this._wrappedVideo) {
      this._wrappedVideo.videoElement().removeEventListener('timeupdate', this._emitChange);
    }
    if (this._emitChangeIfPlayingLoop) {
      cancelAnimationFrame(this._emitChangeIfPlayingLoop);
      this._emitChangeIfPlayingLoop = null;
    }
  }
}

Marzipano.dependencies.eventEmitter(VideoAsset);

export default VideoAsset;