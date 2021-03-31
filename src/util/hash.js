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

// Jenkins one-at-a-time hash
// http://www.burtleburtle.net/bob/hash/doobs.html
// Input: an array of integers
// Output: an integer

function hash() {
  var h = 0;
  for (var i = 0; i < arguments.length; i++) {
    var k = arguments[i];
    h += k;
    h += k << 10;
    h ^= k >> 6;
  }
  h += h << 3;
  h ^= h >> 11;
  h += h << 15;
  return h >= 0 ? h : -h;
}

module.exports = hash;