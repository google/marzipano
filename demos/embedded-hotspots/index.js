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

// Create source.
var source = Marzipano.ImageUrlSource.fromString(
  "//www.marzipano.net/media/outdoors/{z}/{f}/{y}/{x}.jpg",
  { cubeMapPreviewUrl: "//www.marzipano.net/media/outdoors/preview.jpg" });

// Create geometry.
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(4096, 100*Math.PI/180);
var view = new Marzipano.RectilinearView(null, limiter);

// Create scene.
var scene = viewer.createScene({
  source: source,
  geometry: geometry,
  view: view,
  pinFirstLevel: true
});

// Display scene.
scene.switchTo();

// Get the hotspot container for scene.
var container = scene.hotspotContainer();

// Create hotspot with different sources.
container.createHotspot(document.getElementById('iframespot'), { yaw: 0.0335, pitch: -0.102 },
  { perspective: { radius: 1640, extraRotations: "rotateX(5deg)" }});
container.createHotspot(document.getElementById('iframeselect'), { yaw: -0.35, pitch: -0.239 });

// HTML sources.
var hotspotHtml = {
  youtube: '<iframe id="youtube" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=0&amp;showinfo=0&amp;" frameborder="0" allowfullscreen></iframe>',
  youtubeWithControls: '<iframe id="youtubeWithControls" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=1&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>',
  googleMaps: '<iframe id="googlemaps" width="1280" height="480" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9487.563699358636!2d-9.211273541013671!3d38.69789785451112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecf578f4d20e9%3A0x530952e38d140ae6!2sDigisfera+-+Fotografia+e+Inform%C3%A1tica%2C+Lda!5e1!3m2!1spt-PT!2spt!4v1429956174252" width="600" height="450" frameborder="0" style="border:0"></iframe>',
  koloreyes: '<iframe id="koloreyes" src="https://eyes.kolor.com/video/i/kolor/54ef73cbaaa38b2943c8a7d72a4b00e6" type="text/html" width="1280" height="480" frameborder="0" scrolling="no" allowfullscreen="true"> </iframe>'
};

// Switch sources when clicked.
function switchHotspot(id) {
  var wrapper = document.getElementById('iframespot');
  wrapper.innerHTML = hotspotHtml[id];
}

var switchElements = document.querySelectorAll('[data-source]');
for (var i = 0; i < switchElements.length; i++) {
  var element = switchElements[i];
  addClickEvent(element);
}

function addClickEvent(element) {
  element.addEventListener('click', function() {
    switchHotspot(element.getAttribute('data-source'));
  });
}
