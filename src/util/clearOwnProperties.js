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

// Sets an object's own properties to undefined. This may be called by
// destructors to avoid retaining references and help detect incorrect use of
// destroyed instances.
function clearOwnProperties(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      obj[prop] = undefined;
    }
  }
}

export default clearOwnProperties;
