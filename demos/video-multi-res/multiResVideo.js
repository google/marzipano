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
import VideoAsset from './VideoAsset.js';
import EventEmitter from './EventEmitter.js';
import EventEmitterProxy from './EventEmitterProxy.js';
import loadVideoInSync from './loadVideoInSync.js';
import NullVideoElementWrapper from './NullVideoElementWrapper.js';
import CanvasHackVideoElementWrapper from './CanvasHackVideoElementWrapper.js';

// Marzipano does not have a high-level API for 360° video with multiple levels yet.
// This code manages the currently playing video using the low-level API.

// Use canvas hack for IE10.
var useCanvasHack = Marzipano.dependencies.bowser.msie;

// Create viewer.
var viewer = new Marzipano.Viewer(document.querySelector('#pano'));

// Create layer.
var asset = new VideoAsset();
var source = new Marzipano.SingleAssetSource(asset);
var geometry = new Marzipano.EquirectGeometry([ { width: 1 } ]);

var limiter = Marzipano.RectilinearView.limit.traditional(2560, 100*Math.PI/180);
var view = new Marzipano.RectilinearView(null, limiter);

var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: false });

scene.switchTo({ transitionDuration: 0 });

var emitter = new EventEmitter();
var videoEmitter = new EventEmitterProxy();

var resolutions = [
  { width: 720 },
  { width: 1280 },
  { width: 1920 },
  { width: 2880 }
];

var currentState = {
  resolutionIndex: null,
  resolutionChanging: false
};

function setResolutionIndex(index, cb) {
  cb = cb || function() {};

  currentState.resolutionChanging = true;

  videoEmitter.setObject(null);

  emitter.emit('change');
  emitter.emit('resolutionSet');

  var level = resolutions[index];
  var videoSrc = '//www.marzipano.net/media/video/mercedes-f1-' + level.width + 'x' + level.width/2 + '.mp4';

  var previousVideo = asset.video() && asset.video().videoElement();

  loadVideoInSync(videoSrc, previousVideo, function(err, element) {
    if (err) {
      cb(err);
      return;
    }

    if (previousVideo) {
      previousVideo.pause();
      previousVideo.volume = 0;
      previousVideo.removeAttribute('src');
    }

    var VideoElementWrapper = useCanvasHack ? CanvasHackVideoElementWrapper : NullVideoElementWrapper;
    var wrappedVideo = new VideoElementWrapper(element);
    asset.setVideo(wrappedVideo);

    currentState.resolutionIndex = index;
    currentState.resolutionChanging = false;

    videoEmitter.setObject(element);

    emitter.emit('change');
    emitter.emit('resolutionChange');

    cb();
  });
}

export var multiResVideo = {
  layer: function() {
    return scene.layer();
  },
  element: function() {
    return asset.video() && asset.video().videoElement();
  },
  resolutions: function() {
    return resolutions;
  },
  resolutionIndex: function() {
    return currentState.resolutionIndex;
  },
  resolution: function() {
    return currentState.resolutionIndex != null ?
              resolutions[currentState.resolutionIndex] :
              null;
  },
  setResolutionIndex: setResolutionIndex,
  resolutionChanging: function() {
    return currentState.resolutionChanging;
  },
  addEventListener: emitter.addEventListener.bind(emitter),

  // events from proxy to videoElement
  addEventListenerVideo: videoEmitter.addEventListener.bind(videoEmitter)
};
