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

/**
  * Compose multiple functions
  *
  * `compose(f, g)` returns `function(x) { return f(g(x)); }`
  *
  * @memberof util
  * @param {Function[]} functions The functions to compose
  * @return {Function}
  */
function compose() {
  var fnList = arguments;
  return function composed(initialArg) {
    var ret = initialArg;
    for (var i = 0; i < fnList.length; i++) {
      var fn = fnList[i];
      ret = fn.call(null, ret);
    }
    return ret;
  };
}

module.exports = compose;