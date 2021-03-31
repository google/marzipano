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

// Create viewer.
var viewer = new Marzipano.Viewer(document.getElementById('pano'));

// Create asset and source.
var asset = new VideoAsset();
var source = new Marzipano.SingleAssetSource(asset);

// Create geometry.
// This is a trivial equirectangular geometry with a single level.
// The level size need not match the actual video dimensions because it is
// only used to determine the most appropriate level to render, and no such
// choice has to be made in this case.
var geometry = new Marzipano.EquirectGeometry([ { width: 1 } ]);

// Create view.
// We display the video at a fixed vertical fov.
var limiter = Marzipano.RectilinearView.limit.vfov(90*Math.PI/180, 90*Math.PI/180);
var view = new Marzipano.RectilinearView({ fov: Math.PI/2 }, limiter);

// Create scene.
var scene = viewer.createScene({
  source: source,
  geometry: geometry,
  view: view
});

// Display scene.
scene.switchTo();

// Start playback on click.
// Playback cannot start automatically because most browsers require the play()
// method on the video element to be called in the context of a user action.
document.body.addEventListener('click', tryStart);
document.body.addEventListener('touchstart', tryStart);

// Whether playback has started.
var started = false;

// Try to start playback.
function tryStart() {
  if (started) {
    return;
  }
  started = true;

  var video = document.createElement('video');
  video.src = '//www.marzipano.net/media/video/mercedes-f1-1280x640.mp4';
  video.crossOrigin = 'anonymous';

  video.autoplay = true;
  video.loop = true;

  // Prevent the video from going full screen on iOS.
  video.playsInline = true;
  video.webkitPlaysInline = true;

  video.play();

  waitForReadyState(video, video.HAVE_METADATA, 100, function() {
    waitForReadyState(video, video.HAVE_ENOUGH_DATA, 100, function() {
      asset.setVideo(video);
    });
  });
}

// Wait for an element to reach the given readyState by polling.
// The HTML5 video element exposes a `readystatechange` event that could be
// listened for instead, but it seems to be unreliable on some browsers.
function waitForReadyState(element, readyState, interval, done) {
  var timer = setInterval(function() {
    if (element.readyState >= readyState) {
      clearInterval(timer);
      done(null, true);
    }
  }, interval);
}
