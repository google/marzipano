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

var noop = require('./noop');

// Return a cancelable function that executes fn in a loop until it returns
// successfully.
function retry(fn) {

  return function retried() {

    var args = arguments.length ? Array.prototype.slice.call(arguments, 0, arguments.length - 1) : [];
    var done = arguments.length ? arguments[arguments.length - 1] : noop;

    var cfn = null;
    var canceled = false;

    function exec() {
      var err = arguments[0];
      if (!err || canceled) {
        done.apply(null, arguments);
      } else {
        cfn = fn.apply(null, args);
      }
    }

    args.push(exec);
    exec(true);

    return function cancel() {
      canceled = true;
      cfn.apply(null, arguments);
    };

  };

}

module.exports = retry;
