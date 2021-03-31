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

var WorkQueue = require('./WorkQueue');
var mod = require('../util/mod');


function WorkPool(opts) {
  this._concurrency = opts && opts.concurrency || 1;
  this._paused = opts && !!opts.paused || false;

  this._pool = [];
  for (var i = 0; i < this._concurrency; i++) {
    this._pool.push(new WorkQueue(opts));
  }

  this._next = 0;
}


WorkPool.prototype.length = function() {
  var len = 0;
  for (var i = 0; i < this._pool.length; i++) {
    len += this._pool[i].length();
  }
  return len;
};


WorkPool.prototype.push = function(fn, cb) {
  var i = this._next;
  var cancel = this._pool[i].push(fn, cb);
  this._next = mod(this._next + 1, this._concurrency);
  return cancel;
};


WorkPool.prototype.pause = function() {
  if (!this._paused) {
    this._paused = true;
    for (var i = 0; i < this._concurrency; i++) {
      this._pool[i].pause();
    }
  }
};


WorkPool.prototype.resume = function() {
  if (this._paused) {
    this._paused = false;
    for (var i = 0; i < this._concurrency; i++) {
      this._pool[i].resume();
    }
  }
};


module.exports = WorkPool;
