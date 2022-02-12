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

// This file provides utility functions for waiting until certain conditions
// are true by polling repeatedly. In a test, this is faster and more robust
// than waiting with setTimeout, as it avoids the need for a large timeout to
// prevent slower browsers from flaking out.

// until(fn, done) repeatedly calls cond until it returns a truthy value,
// and then calls done.
function until(cond, done) {
  var timer = setInterval(function() {
    if (cond()) {
      clearInterval(timer);
      done();
    }
  }, 10);
}

// untilSpyCalled(spy1, ..., spyN, done) repeatedly polls the spies until every
// one has been called at least once, and then calls done.
function untilSpyCalled() {
  var spies = Array.prototype.slice.call(arguments, 0, arguments.length-1);
  var done = arguments[arguments.length-1];
  function cond() {
    for (var i = 0; i < spies.length; i++) {
      if (!spies[i].called) {
        return false;
      }
    }
    return true;
  }
  until(cond, done);
}

export default {
  until: until,
  untilSpyCalled: untilSpyCalled
};
