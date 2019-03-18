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

var now = require('../util/now');


function WorkTask(fn, cb) {
  this.fn = fn;
  this.cb = cb;
  this.cfn = null;
}


function WorkQueue(opts) {
  this._queue = [];
  this._delay = opts && opts.delay || 0;
  this._paused = opts && !!opts.paused || false;
  this._currentTask = null;
  this._lastFinished = null;
}


WorkQueue.prototype.length = function() {
  return this._queue.length;
};


WorkQueue.prototype.push = function(fn, cb) {

  var task = new WorkTask(fn, cb);

  var cancel = this._cancel.bind(this, task);

  // Push the task into the queue.
  this._queue.push(task);

  // Run the task if idle.
  this._next();

  return cancel;

};


WorkQueue.prototype.pause = function() {
  if (!this._paused) {
    this._paused = true;
  }
};


WorkQueue.prototype.resume = function() {
  if (this._paused) {
    this._paused = false;
    this._next();
  }
};


WorkQueue.prototype._start = function(task) {

  // Consistency check.
  if (this._currentTask) {
    throw new Error('WorkQueue: called start while running task');
  }

  // Mark queue as busy, so that concurrent tasks wait.
  this._currentTask = task;

  // Execute the task.
  var finish = this._finish.bind(this, task);
  task.cfn = task.fn(finish);

  // Detect when a non-cancellable function has been queued.
  if (typeof task.cfn !== 'function') {
    throw new Error('WorkQueue: function is not cancellable');
  }

};


WorkQueue.prototype._finish = function(task) {

  var args = Array.prototype.slice.call(arguments, 1);

  // Consistency check.
  if (this._currentTask !== task) {
    throw new Error('WorkQueue: called finish on wrong task');
  }

  // Call the task callback on the return values.
  task.cb.apply(null, args);

  // Mark as not busy and record task finish time, then advance to next task.
  this._currentTask = null;
  this._lastFinished = now();
  this._next();

};


WorkQueue.prototype._cancel = function(task) {

  var args = Array.prototype.slice.call(arguments, 1);

  if (this._currentTask === task) {

    // Cancel running task. Because cancel passes control to the _finish
    // callback we passed into fn, the cleanup logic will be handled there.
    task.cfn.apply(null, args);

  } else {

    // Remove task from queue.
    var pos = this._queue.indexOf(task);
    if (pos >= 0) {
      this._queue.splice(pos, 1);
      task.cb.apply(null, args);
    }

  }

};


WorkQueue.prototype._next = function() {

  if (this._paused) {
    // Do not start tasks while paused.
    return;
  }

  if (!this._queue.length) {
    // No tasks to run.
    return;
  }

  if (this._currentTask) {
    // Will be called again when the current task finishes.
    return;
  }

  if (this._lastFinished != null) {
    var elapsed = now() - this._lastFinished;
    var remaining = this._delay - elapsed;
    if (remaining > 0) {
      // Too soon. Run again after the inter-task delay.
      setTimeout(this._next.bind(this), remaining);
      return;
    }
  }

  // Run the next task.
  var task = this._queue.shift();
  this._start(task);

};


module.exports = WorkQueue;
