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

var video = multiResVideo.element;

var progressFillElement = document.getElementById('progress-fill');
var progressBackgroundElement = document.getElementById('progress-background');
var currentTimeIndicatorElement = document.getElementById('current-time-indicator');
var durationIndicatorElement = document.getElementById('duration-indicator');
var playPauseElement = document.getElementById('play-pause');
var muteElement = document.getElementById('mute');
var rootElement = document.body;

/* Video interface */

// Handle events on the video element. multiResVideo automatically reattaches
// handlers to new video when the resolution changes
multiResVideo.addEventListenerVideo('timeupdate', updateProgressBar);
multiResVideo.addEventListenerVideo('pause', updatePlayPause);
multiResVideo.addEventListenerVideo('play', updatePlayPause);
multiResVideo.addEventListenerVideo('playing', updatePlayPause);
multiResVideo.addEventListenerVideo('timeupdate', updateCurrentTimeIndicator);
multiResVideo.addEventListenerVideo('volumechange', updateMute);

// Handle resolution change
multiResVideo.addEventListener('change', updateCurrentTimeIndicator);
multiResVideo.addEventListener('change', updateDurationIndicator);
multiResVideo.addEventListener('change', updateProgressBar);
multiResVideo.addEventListener('change', updatePlayPause);
multiResVideo.addEventListener('change', updateMute);

// Set starting state
updateProgressBar();
updatePlayPause();
updateCurrentTimeIndicator();
updateDurationIndicator();
updateMute();

playPauseElement.addEventListener('click', function() {
  if (!video()) {
    return;
  }
  if (video().paused) {
    video().play();
  } else {
    video().pause();
  }
});

muteElement.addEventListener('click', function() {
  if (!video()) {
    return;
  }
  var newVolume = video().volume > 0 ? 0 : 1;
  video().volume = newVolume;
});

progressBackgroundElement.addEventListener('click', function(evt) {
  if (!video()) {
    return;
  }
  video().currentTime = percentFromClick(evt) * video().duration;
});

function updateProgressBar() {
  if (!video()) {
    return;
  }
  var progress = video().currentTime / video().duration;
  progressFillElement.style.width = (progress * 100) + '%';
}

function updateCurrentTimeIndicator() {
  currentTimeIndicatorElement.innerHTML = video() ? formatTime(video().currentTime) : '-';
}

function updateDurationIndicator() {
  durationIndicatorElement.innerHTML = video() ? formatTime(video().duration) : '-';
}

function updatePlayPause() {
  if (!video()) {
    return;
  }
  if (video().paused) {
    rootElement.classList.remove('video-playing');
    rootElement.classList.add('video-paused');
  } else {
    rootElement.classList.add('video-playing');
    rootElement.classList.remove('video-paused');
  }
}

function updateMute() {
  if (!video()) {
    return;
  }
  if (video().volume === 0) {
    rootElement.classList.add('video-muted');
  } else {
    rootElement.classList.remove('video-muted');
  }
}

function percentFromClick(evt) {
  var rect = progressBackgroundElement.getBoundingClientRect();
  var click = evt.clientX - rect.left;
  var total = rect.right - rect.left;
  return click / total;
}

function formatTime(d) {
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

/* Resolution modal */

var toggleResolutionSelectElement = document.getElementById('toggle-resolution-select');

toggleResolutionSelectElement.addEventListener('click', function() {
  updateResolutionSelectOpen();
});

function updateResolutionSelectOpen() {
  rootElement.classList.remove('options-open');

  if (rootElement.classList.contains('resolution-select-open')) {
    rootElement.classList.remove('resolution-select-open');
  } else {
    rootElement.classList.add('resolution-select-open');
  }
}

/* Options modal */

var toggleOptionsElement = document.getElementById('toggle-options');

toggleOptionsElement.addEventListener('click', function() {
  updateOptionsOpen();
});

function updateOptionsOpen() {
  rootElement.classList.remove('resolution-select-open');

  if (rootElement.classList.contains('options-open')) {
    rootElement.classList.remove('options-open');
  } else {
    rootElement.classList.add('options-open');
  }
}

/* Resolution selection */

var resolutionSelectElement = document.getElementById('resolution-select');
var resolutionIndicatorElement = document.getElementById('resolution-indicator');

function setResolutions() {
  multiResVideo.resolutions().forEach(function(level, i) {
    var levelElement = document.createElement('li');
    levelElement.value = i;
    levelElement.innerHTML = level.width + 'x' + level.width/2;

    levelElement.addEventListener('click', function() {
      multiResVideo.setResolutionIndex(i);
    });

    resolutionSelectElement.appendChild(levelElement);
  });
}

function updateResolutionIndicator() {
  var level = multiResVideo.resolution();
  resolutionIndicatorElement.innerHTML = level ? level.width + 'x' + level.width/2 : '-';
}

function updateSelectedResolution() {
  for (var i = 0; i < resolutionSelectElement.children.length; i++) {
    var child = resolutionSelectElement.children[i];
    if (i === multiResVideo.resolutionIndex()) {
      child.classList.add('selected');
    } else {
      child.classList.remove('selected');
    }
  }
}

function updateResolutionChanging() {
  if (multiResVideo.resolutionChanging()) {
    rootElement.classList.add('video-resolution-changing');
  } else {
    rootElement.classList.remove('video-resolution-changing');
  }
}

multiResVideo.addEventListener('change', updateResolutionIndicator);
multiResVideo.addEventListener('change', updateSelectedResolution);
multiResVideo.addEventListener('change', updateResolutionChanging);

setResolutions();
updateResolutionIndicator();
updateSelectedResolution();
updateResolutionChanging();

/* Effects */

var Marzipano = window.Marzipano;

var effectElement = document.getElementById('effect');

effectElement.addEventListener('change', function() {
  var layer = multiResVideo.layer();

  if(!layer) { return; }

  var effect = effectElement.value;
  var effectsObj = { colorMatrix: null, colorOffset: null };
  if (effect === 'desaturate') {
    effectsObj = window.colorEffects.saturation(0);
  } else if(effect === 'sepia') {
    effectsObj = window.colorEffects.sepia(1);
  } else if(effect === 'saturate') {
    effectsObj = window.colorEffects.saturation(1.25);
  } else if(effect === 'lighten') {
    effectsObj = window.colorEffects.brightness(0.1);
  } else if(effect === 'darken') {
    effectsObj = window.colorEffects.brightness(-0.1);
  }

  layer.mergeEffects(effectsObj);
});
