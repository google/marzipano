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

// Attempts to load a video element in sync with another video element
function loadVideoInSync(url, syncElement, cb) {
  cb = once(cb);
  var element = document.createElement('video');
  element.crossOrigin = 'anonymous';

  element.autoplay = true;
  element.loop = true;

  // Prevent the video from going full screen on iOS.
  element.playsInline = true;
  element.webkitPlaysInline = true;

  element.onerror = function(e) {
    cb(e.target.error);
  };

  // The new video will be loaded at currentTime + 5s, to allow time for
  // the video to be ready to play
  var syncTime = 5000;

  element.src = url;

  // Checking readyState on an interval seems to be more reliable than using events
  waitForReadyState(element, element.HAVE_CURRENT_DATA, 0.2, function() {
    if(syncElement) {
      if(syncElement.paused) {
        // If the video is not playing, we can load the new one to the correct time
        element.currentTime = syncElement.currentTime;
      }
      else {
        //If it is playing, we will need to load to a time ahead of the current,
        // to account for the time that the loading will take
        element.currentTime = syncElement.currentTime + syncTime / 1000;
      }
    }

    waitForReadyState(element, element.HAVE_ENOUGH_DATA, 0.2, function() {
      if(!syncElement) {
        // If there is no element to sync with we are done
        cb(null, element);
      }
      else if(syncElement.paused) {
        // If the element to sync with is paused, we are done
        cb(null, element);
      }
      else {
        if(element.currentTime <= syncElement.currentTime) {
          // The loading took too long, start playing immediately
          // We will be a bit out of sync
          element.play();
          cb(null, element);
        }
        else {
          // If the loading was too fast, wait before playing
          // We should be in sync
          setTimeout(function() {
            element.play();
            cb(null, element);
          }, (element.currentTime - syncElement.currentTime) * 1000);
        }
      }
    });
  });
}

function waitForReadyState(element, readyState, interval, callback) {
  var timer = setInterval(function() {
    if(element.readyState >= readyState) {
      clearInterval(timer);
      callback(null, true);
    }
  }, interval);
}

function once(f) {
  var called = false;
  return function() {
    if(!called) {
      called = true;
      f.apply(null, arguments);
    }
  };
}
