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

scene.hotspotContainer().createHotspot(document.querySelector("#info"), { yaw: -2.93, pitch: -0.15 });

document.querySelector("#info .icon_wrapper").addEventListener('click', function() {
  document.querySelector("#info").classList.toggle('expanded');
  document.querySelector("#inner_icon").classList.toggle('closeIcon');
});

document.querySelector("#info .close").addEventListener('click', function() {
  document.querySelector("#info").classList.remove('expanded');
  document.querySelector("#inner_icon").classList.remove('closeIcon');
});


document.querySelector('#info input[type="text"]').addEventListener('keydown', function(evt) {
  evt.stopPropagation();
});
