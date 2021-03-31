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
var data = {
  "scenes": [
    {
      "id": "oriente-station",
      "name": "Oriente Station",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "size": 512, "tileSize": 512 },
        { "size": 1024, "tileSize": 512 },
        { "size": 2048, "tileSize": 512 }
      ],
      "hotspots": [
        {
          "yaw": 0,
          "pitch": 0,
          "target": "jeronimos"
        }
      ],
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      }
    },
    {
      "id": "jeronimos",
      "name": "Jerónimos Monastery",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "size": 512, "tileSize": 512 },
        { "size": 1024, "tileSize": 512 },
        { "size": 2048, "tileSize": 512 }
      ],
      "hotspots": [
        {
          "yaw": 0.5,
          "pitch": 0.2,
          "target": "electricity-museum"
        }
      ],
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 0.9
      }
    },
    {
      "id": "electricity-museum",
      "name": "Eletricity Museum",
      "levels": [
        { "tileSize": 256, "size": 256, "fallbackOnly": true },
        { "size": 512, "tileSize": 512 },
        { "size": 1024, "tileSize": 512 },
        { "size": 2048, "tileSize": 512 }
      ],
      "hotspots": [
        {
          "yaw": 1.6,
          "pitch": 0,
          "target": "jeronimos"
        }
      ],
      "initialViewParameters": {
        "pitch": -0.6,
        "yaw": 0.9,
        "fov": 1.0
      }
    }
  ],
  "name": "Marzipano Demo",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": "true"
  }
};
