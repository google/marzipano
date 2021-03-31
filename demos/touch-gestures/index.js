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

(function() {
  var Marzipano = window.Marzipano;
  var data = window.data;
  var Hammer = Marzipano.dependencies['hammerjs'];

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var prevElement = document.querySelector('#prev');
  var nextElement = document.querySelector('#next');
  var commentFormElement = document.querySelector('#commentForm');
  var commentTextareaElement = document.querySelector('#commentTextarea');

  // Prevent tap delay on mobile browsers.
  document.addEventListener('DOMContentLoaded', function() {
    FastClick.attach(document.body);
  });

  // Detect mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
      }
    };
    var mql = matchMedia("(max-width: 450px), (max-height: 400px)");
    setMode();
    mql.addListener(setMode);
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(sceneData) {
    var urlPrefix = "//www.marzipano.net/media";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + sceneData.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + sceneData.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(sceneData.levels);
    var resolution = sceneData.levels[sceneData.levels.length-1].size;
    var limiter = Marzipano.RectilinearView.limit.traditional(resolution, 120*Math.PI/180);

    var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);
    var marzipanoScene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    return {
      data: sceneData,
      marzipanoObject: marzipanoScene
    };
  });

  // Display the initial scene.
  var currentScene = 0;
  scenes[currentScene].marzipanoObject.switchTo();
  updateSceneName();

  function previousScene() {
    changeScene(true);
  }
  function nextScene() {
    changeScene(false);
  }

  function changeScene(toPrevious) {
    // If `toPrevious` is `false`, we are going to the next scene.
    var index = toPrevious ? currentScene - 1 : currentScene + 1;
    currentScene = mod(index, scenes.length);

    var scene = scenes[currentScene];
    scene.marzipanoObject.view().setParameters(scene.data.initialViewParameters);
    updateSceneName();

    function update(val, newScene) {
      val = easing.easeOutQuad(val);
      var relativeX = null;
      if (val === 0) {
        relativeX = 1;
      } else {
        relativeX = 1 - val;
      }
      if (toPrevious) {
        relativeX = relativeX * -1;
      }
      newScene.layer().setEffects({ rect: { relativeX: relativeX }});
    }
    scene.marzipanoObject.switchTo({ transitionUpdate: update, transitionDuration: 500 });
  }

  // Change scene on button click.
  prevElement.addEventListener('click', previousScene);
  nextElement.addEventListener('click', nextScene);

  // Get the viewer's underlying Hammer.js instances.
  var hammerTouch = viewer._hammerManagerTouch;
  var hammerMouse = viewer._hammerManagerMouse;

  // Change scene on two-finger swipe.
  var pinchRecognizer = hammerTouch.manager().get('pinch');
  var swipeRecognizer = new Hammer.Swipe({ direction: Hammer.HORIZONTAL, pointers: 2 });
  swipeRecognizer.recognizeWith(pinchRecognizer);
  hammerTouch.manager().add(swipeRecognizer);

  // Prevent pan and zoom events from being handled after swipe ends.
  function disableControlsTemporarily() {
    viewer.controls().disableMethod('touchView');
    viewer.controls().disableMethod('pinch');
    setTimeout(function() {
      viewer.controls().enableMethod('touchView');
      viewer.controls().enableMethod('pinch');
    }, 200);
  }

  hammerTouch.on('swiperight', function() {
    previousScene();
    disableControlsTemporarily();
  });

  hammerTouch.on('swipeleft', function() {
    nextScene();
    disableControlsTemporarily();
  });

  // Zoom on tap.
  function zoomOnTap(e) {
    var coords = viewer.view().screenToCoordinates(e.center);
    coords.fov = viewer.view().fov() * 0.8;
    viewer.lookTo(coords, { transitionDuration: 300 });
  }
  var tapRecognizerMouse = new Hammer.Tap({ taps: 2, posThreshold: 20 });
  hammerMouse.manager().add(tapRecognizerMouse);
  hammerMouse.on('tap', zoomOnTap);
  var tapRecognizerTouch = new Hammer.Tap({ taps: 2, posThreshold: 50 })
  hammerTouch.manager().add(tapRecognizerTouch);
  hammerTouch.on('tap', zoomOnTap);

  // Add marker on press.
  hammerMouse.manager().add(new Hammer.Press({ }));
  hammerMouse.on('press', showMarkerCommentModal);
  hammerTouch.manager().add(new Hammer.Press({ }));
  hammerTouch.on('press', showMarkerCommentModal);

  commentFormElement.addEventListener('submit', addMarker);
  commentTextareaElement.addEventListener('keydown', function(e) {
    // Prevent the viewer keyboard controls from being triggered.
    e.stopPropagation();
  });

  var markerCoordinates = null;

  function showMarkerCommentModal(e) {
    markerCoordinates = viewer.view().screenToCoordinates(e.center);
    commentFormElement.style.display = 'block';
    commentTextareaElement.focus();
  }

  function addMarker(e) {
    var el = document.createElement('div');
    el.classList.add('marker');

    var commentEl = document.createElement('div');
    commentEl.classList.add('comment');
    commentEl.innerHTML = commentTextareaElement.value;

    el.appendChild(commentEl);

    var scene = scenes[currentScene];
    scene.marzipanoObject.hotspotContainer().createHotspot(el, markerCoordinates);

    commentFormElement.style.display = 'none';
    commentTextareaElement.value = "";
    e.preventDefault();
  }

  function updateSceneName() {
    var scene = scenes[currentScene];
    var name = sanitize(scene.data.name);
    var counter = "<span class='scenesCounter'>(" + (currentScene+1) + "/" + scenes.length + ")</span>";
    sceneNameElement.innerHTML = name + counter;
  }

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function mod(m, n) {
    return ((m%n)+n)%n;
  }

})();
