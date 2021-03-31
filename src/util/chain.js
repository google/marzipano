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

// Return a function that executes its arguments (which should be cancelables)
// in sequence, so that each of them passes its return values to the next.
// Execution is aborted if one of the functions returns an error; in that case
// the last function in the sequence is called with the error.
// See util/cancelize.js for an explanation of what cancelables are.
function chain() {

  // The list of functions to chain together.
  var argList = Array.prototype.slice.call(arguments, 0);

  return function chained() {

    // List of remaining functions to be executed.
    // Make a copy of the original list so we can mutate the former while
    // preserving the latter intact for future invocations of the chain.
    var fnList = argList.slice(0);

    // Currently executing function.
    var fn = null;

    // Cancel method for the currently executing function.
    var cfn = null;

    // Arguments for the first function.
    var args = arguments.length ? Array.prototype.slice.call(arguments, 0, arguments.length - 1) : [];

    // Callback for the chain.
    var done = arguments.length ? arguments[arguments.length - 1] : noop;

    // Execute the next function in the chain.
    // Receives the error and return values from the previous function.
    function exec() {

      // Extract error from arguments.
      var err = arguments[0];

      // Abort chain on error.
      if (err) {
        fn = cfn = null;
        done.apply(null, arguments);
        return;
      }

      // Terminate if there are no functions left in the chain.
      if (!fnList.length) {
        fn = cfn = null;
        done.apply(null, arguments);
        return;
      }

      // Advance to the next function in the chain.
      fn = fnList.shift();
      var _fn = fn;

      // Extract arguments to pass into the next function.
      var ret = Array.prototype.slice.call(arguments, 1);

      // Call next function with previous return value and call back exec.
      ret.push(exec);
      var _cfn = fn.apply(null, ret); // fn(null, ret..., exec)

      // Detect when fn has completed synchronously and do not clobber the
      // internal state in that case. You're not expected to understand this.
      if (_fn !== fn) {
        return;
      }

      // Remember the cancel method for the currently executing function.
      // Detect chaining on non-cancellable function.
      if (typeof _cfn !== 'function') {
        throw new Error('chain: chaining on non-cancellable function');
      } else {
        cfn = _cfn;
      }

    }

    // Cancel chain execution.
    function cancel() {
      if (cfn) {
        cfn.apply(null, arguments);
      }
    }

    // Start chain execution.
    // We call exec as if linking from a previous function in the chain,
    // except that the error is always null. As a consequence, chaining on an
    // empty list yields the identity function.
    args.unshift(null);
    exec.apply(null, args); // exec(null, args...)

    return cancel;

  };

}

module.exports = chain;
