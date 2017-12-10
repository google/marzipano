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

// NullVideoElementWrapper is a wrapper around an HTML video element that simply
// exposes the underlying video element as the texture to be rendered, which is
// suitable for browsers that support WebGL video textures.
function NullVideoElementWrapper(videoElement) {
  this._videoElement = videoElement;
}

NullVideoElementWrapper.prototype.videoElement = function() {
  return this._videoElement;
};

NullVideoElementWrapper.prototype.drawElement = function() {
  return this._videoElement;
};

NullVideoElementWrapper.prototype.destroy = function() {
  // TODO: This cleanup logic should be somewhere else, since the analogous
  // setup logic occurs outside this class.
  this._videoElement.pause();
  this._videoElement.volume = 0;
  this._videoElement.removeAttribute('src');
};
