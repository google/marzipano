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

import { suite, test, assert } from 'vitest';

import Set from "../../../src/collections/Set";

class Item {
  constructor(element) {
    this._element = element;
  }
  hash() {
    // Finite numbers hash to their absolute value; everything else hashes to 0.
    return isFinite(this._element) ? Math.floor(Math.abs(this._element)) : 0;
  }
  equals(that) {
    return this._element === that._element;
  }
}

suite('Set', function() {

  suite('add', function() {

    test('single element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    test('nonexisting element with different hash than existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(2);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    test('existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.strictEqual(set.add(element2), element1);
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });

  });

  suite('remove', function() {

    test('existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.strictEqual(set.remove(element2), element1);
      assert.isFalse(set.has(element1));
      assert.strictEqual(set.size(), 0);
    });

    test('nonexisting element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(2);
      set.add(element1);
      assert.isNull(set.remove(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    test('existing element with same hash as existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      set.add(element1);
      set.add(element2);
      assert.strictEqual(set.remove(element2), element2);
      assert.isFalse(set.has(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      set.add(element1);
      assert.isNull(set.remove(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

  });

  suite('has', function() {

    test('nonexisting element', function() {
      var set = new Set();
      var element = new Item(1);
      assert.isFalse(set.has(element));
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new Set();
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isFalse(set.has(element2));
    });

  });

  suite('size', function() {

    test('empty', function() {
      var set = new Set();
      assert.strictEqual(set.size(), 0);
    });

    test('more elements than buckets', function() {
      var set = new Set(16);
      for (var i = 0; i < 32; i++) {
        set.add(new Item(i));
      }
      assert.strictEqual(set.size(), 32);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var set = new Set();
      for (var i = 0; i < 10; i++) {
        set.add(new Item(i));
      }
      set.clear();
      for (var i = 0; i < 10; i++) {
        assert.isFalse(set.has(new Item(i)));
      }
      assert.strictEqual(set.size(), 0);
    });

  });

  suite('forEach', function() {

    test('empty', function() {
      var set = new Set();
      assert.strictEqual(set.forEach(function() {
        assert.fail('unexpected call');
      }), 0);
    });

    test('nonempty', function() {
      var set = new Set();
      var elements = [];
      for (var i = 0; i < 10; i++) {
        var element = new Item(i);
        set.add(element);
        elements.push(element);
      }

      var seenElements = [];
      var count = set.forEach(function(element) {
        seenElements.push(element);
      });

      assert.strictEqual(count, 10);
      assert.sameMembers(elements, seenElements);
    });

  });

});
