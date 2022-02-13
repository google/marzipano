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

function type(x: null) {
  var typ = typeof x;
  if (typ === 'object') {
    if (x === null) {
      return 'null';
    }
    if (Object.prototype.toString.call(x) === '[object Array]') {
      return 'array';
    }
    if (Object.prototype.toString.call(x) === '[object RegExp]') {
      return 'regexp';
    }
  }
  return typ;
}

export default type;