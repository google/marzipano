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

var assert = require('chai').assert;

var LruSet = require('../../../src/collections/LruSet');

function Item(element) {
  this._element = element;
}

Item.prototype.hash = function() {
  // Finite numbers hash to their absolute value; everything else hashes to 0.
  return isFinite(this._element) ? Math.floor(Math.abs(this._element)) : 0;
};

Item.prototype.equals = function(that) {
  return this._element === that._element;
};

suite('LruSet', function() {

  suite('add', function() {

    test('nonexisting element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    test('nonexisting element with different hash than existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(2);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 2);
    });

    test('existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.isNull(set.add(element2));
      assert.isTrue(set.has(element1));
      assert.isTrue(set.has(element2));
      assert.strictEqual(set.size(), 1);
    });

    test('existing element on a full set', function() {
      var set = new LruSet(4);
      var elements = [];
      for (var i = 0; i < 8; i++) {
        elements.push(new Item(i));
      }
      assert.isNull(set.add(elements[0]));
      assert.isNull(set.add(elements[1]));
      assert.isNull(set.add(elements[2]));
      assert.isNull(set.add(elements[3]));
      assert.isNull(set.add(elements[2]));
      assert.strictEqual(set.add(elements[4]), elements[0]);
      assert.strictEqual(set.add(elements[5]), elements[1]);
      assert.strictEqual(set.add(elements[6]), elements[3]);
      assert.strictEqual(set.add(elements[7]), elements[2]);
      for (var i = 0; i < 8; i++) {
        if (i >= 4 && i <= 7) {
          assert.isTrue(set.has(elements[i]));
        } else {
          assert.isFalse(set.has(elements[i]));
        }
      }
      assert.strictEqual(set.size(), 4);
    });

    test('nonexisting element on a full set', function() {
      var set = new LruSet(4);
      var elements = [];
      for (var i = 0; i < 8; i++) {
        elements.push(new Item(i));
      }
      assert.isNull(set.add(elements[0]));
      assert.isNull(set.add(elements[1]));
      assert.isNull(set.add(elements[2]));
      assert.isNull(set.add(elements[3]));
      assert.strictEqual(set.add(elements[4]), elements[0]);
      assert.strictEqual(set.add(elements[5]), elements[1]);
      assert.strictEqual(set.add(elements[6]), elements[2]);
      assert.strictEqual(set.add(elements[7]), elements[3]);
      for (var i = 0; i < 8; i++) {
        if (i >= 4 && i <= 7) {
          assert.isTrue(set.has(elements[i]));
        } else {
          assert.isFalse(set.has(elements[i]));
        }
      }
      assert.strictEqual(set.size(), 4);
    });

    test('on a set with zero capacity', function() {
      var set = new LruSet(0);
      var element = new Item(1);
      assert.strictEqual(set.add(element), element);
      assert.isFalse(set.has(element));
      assert.strictEqual(set.size(), 0);
    });

  });

  suite('remove', function() {

    test('existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(1);
      assert.isNull(set.add(element1));
      assert.strictEqual(set.remove(element2), element1);
      assert.isFalse(set.has(element1));
      assert.strictEqual(set.size(), 0);
    });

    test('nonexisting element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(2);
      set.add(element1);
      assert.isNull(set.remove(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    test('existing element with same hash as existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(-1);
      set.add(element1);
      set.add(element2);
      assert.strictEqual(set.remove(element2), element2);
      assert.isFalse(set.has(element2));
      assert.isTrue(set.has(element1));
      assert.strictEqual(set.size(), 1);
    });

    test('before reaching capacity', function() {
      var set = new LruSet(4);
      var elements = [];
      for (var i = 0; i < 9; i++) {
        elements.push(new Item(i));
      }
      assert.isNull(set.add(elements[0]));
      assert.isNull(set.add(elements[1]));
      assert.isNull(set.add(elements[2]));
      assert.strictEqual(set.remove(elements[1]), elements[1]);
      assert.isNull(set.add(elements[3]));
      assert.isNull(set.add(elements[4]));
      assert.strictEqual(set.add(elements[5]), elements[0]);
      assert.strictEqual(set.add(elements[6]), elements[2]);
      assert.strictEqual(set.add(elements[7]), elements[3]);
      assert.strictEqual(set.add(elements[8]), elements[4]);
      for (var i = 0; i < 9; i++) {
        if (i >= 5 && i <= 8) {
          assert.isTrue(set.has(elements[i]));
        } else {
          assert.isFalse(set.has(elements[i]));
        }
      }
      assert.strictEqual(set.size(), 4);
    });

    test('after reaching capacity', function() {
      var set = new LruSet(4);
      var elements = [];
      for (var i = 0; i < 9; i++) {
        elements.push(new Item(i));
      }
      assert.isNull(set.add(elements[0]));
      assert.isNull(set.add(elements[1]));
      assert.isNull(set.add(elements[2]));
      assert.isNull(set.add(elements[3]));
      assert.strictEqual(set.remove(elements[1]), elements[1]);
      assert.isNull(set.add(elements[4]));
      assert.strictEqual(set.add(elements[5]), elements[0]);
      assert.strictEqual(set.add(elements[6]), elements[2]);
      assert.strictEqual(set.add(elements[7]), elements[3]);
      assert.strictEqual(set.add(elements[8]), elements[4]);
      for (var i = 0; i < 9; i++) {
        if (i >= 5 && i <= 8) {
          assert.isTrue(set.has(elements[i]));
        } else {
          assert.isFalse(set.has(elements[i]));
        }
      }
      assert.strictEqual(set.size(), 4);
    });

  });

  suite('has', function() {

    test('nonexisting element', function() {
      var set = new LruSet(4);
      var element = new Item(1);
      assert.isFalse(set.has(element));
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new LruSet(4);
      var element1 = new Item(1);
      var element2 = new Item(-1);
      assert.isNull(set.add(element1));
      assert.isFalse(set.has(element2));
    });

  });

  suite('size', function() {

    test('empty', function() {
      var set = new LruSet(4);
      assert.strictEqual(set.size(), 0);
    });

    test('full', function() {
      var set = new LruSet(4);
      for (var i = 0; i < 4; i++) {
        set.add(new Item(i));
      }
      assert.strictEqual(set.size(), 4);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var set = new LruSet(4);
      for (var i = 0; i < 4; i++) {
        set.add(new Item(i));
      }
      set.clear();
      for (var i = 0; i < 4; i++) {
        assert.isFalse(set.has(new Item(i)));
      }
      assert.strictEqual(set.size(), 0);
    });

  });

  suite('forEach', function() {

    test('empty', function() {
      var set = new LruSet(16);
      assert.strictEqual(set.forEach(function() {
        assert.fail('unexpected call');
      }), 0);
    });

    test('nonempty', function() {
      var set = new LruSet(16);
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
