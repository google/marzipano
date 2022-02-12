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

import mod from "../util/mod";

// An LruSet holds up to a maximum number of elements, ordered by their time of
// insertion. When the addition of an element would cause the capacity to be
// exceeded, the oldest element in the set is evicted. As a special case, an
// LruSet with zero capacity always rejects the insertion of an element.
//
// Elements must implement hash() and equals(). Note that the implementation
// doesn't currently use hash(), but a future version might.
function LruSet(capacity) {
  if (!isFinite(capacity) || Math.floor(capacity) !== capacity || capacity < 0) {
    throw new Error('LruSet: invalid capacity');
  }
  this._capacity = capacity;

  // Elements are stored in a circular array ordered by decreasing age.
  // Start is the index of the oldest element and size is the number of valid
  // elements; the region containing valid elements may wrap around.
  this._elements = new Array(this._capacity);
  this._start = 0;
  this._size = 0;
}

LruSet.prototype._index = function(i) {
  return mod(this._start + i, this._capacity);
};

// Adds an element into the set, possibly replacing an equal element already in
// the set. The element becomes the newest. If the set is at capacity, the
// oldest element is removed. Returns the removed element if it does not equal
// the inserted element, or null otherwise. If the capacity is zero, does
// nothing and returns the element.
LruSet.prototype.add = function(element) {
  if (this._capacity === 0) {
    return element;
  }
  this.remove(element);
  var evictedElement =
      this._size === this._capacity ? this._elements[this._index(0)] : null;
  this._elements[this._index(this._size)] = element;
  if (this._size < this._capacity) {
    this._size++;
  } else {
    this._start = this._index(1);
  }
  return evictedElement;
};

// Removes an element from the set.
// Returns the removed element, or null if the element was not found.
LruSet.prototype.remove = function(element) {
  for (var i = 0; i < this._size; i++) {
    var existingElement = this._elements[this._index(i)];
    if (element.equals(existingElement)) {
      for (var j = i; j < this._size - 1; j++) {
        this._elements[this._index(j)] = this._elements[this._index(j + 1)];
      }
      this._size--;
      return existingElement;
    }
  }
  return null;
};

// Returns whether an element is in the set.
LruSet.prototype.has = function(element) {
  for (var i = 0; i < this._size; i++) {
    if (element.equals(this._elements[this._index(i)])) {
      return true;
    }
  }
  return false;
};

// Returns the number of elements in the set.
LruSet.prototype.size = function() {
  return this._size;
};

// Removes all elements from the set.
LruSet.prototype.clear = function() {
  this._elements.length = 0;
  this._start = 0;
  this._size = 0;
};

// Calls fn(element) for each element in the set, in an unspecified order.
// Returns the number of times fn was called.
// The result is unspecified if the set is mutated during iteration.
LruSet.prototype.forEach = function(fn) {
  var count = 0;
  for (var i = 0; i < this._size; i++) {
    fn(this._elements[this._index(i)]);
    count += 1;
  }
  return count;
};

export default LruSet;
