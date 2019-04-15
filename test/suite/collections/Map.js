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

var Map = require('../../../src/collections/Map');

function Key(key) {
  this._key = key;
}

Key.prototype.hash = function() {
  // Finite numbers hash to their absolute value; everything else hashes to 0.
  return isFinite(this._key) ? Math.floor(Math.abs(this._key)) : 0;
};

Key.prototype.equals = function(that) {
  return this._key === that._key;
};

suite('Map', function() {

  suite('set', function() {

    test('nonexisting key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.isTrue(map.has(key2));
      assert.strictEqual(map.get(key2), 'abc');
      assert.strictEqual(map.size(), 1);
    });

    test('existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.strictEqual(map.set(key2, 'xyz'), 'abc');
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'xyz');
      assert.strictEqual(map.size(), 1);
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(-1);
      assert.isNull(map.set(key1, 'abc'));
      assert.isNull(map.set(key2, 'xyz'));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
      assert.isTrue(map.has(key2));
      assert.strictEqual(map.get(key2), 'xyz');
      assert.strictEqual(map.size(), 2);
    });

    test('nonexisting key with different hash than existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(2);
      assert.isNull(map.set(key1, 'abc'));
      assert.isNull(map.set(key2, 'xyz'));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
      assert.isTrue(map.has(key2));
      assert.strictEqual(map.get(key2), 'xyz');
      assert.strictEqual(map.size(), 2);
    });

  });

  suite('get', function() {

    test('nonexisting key', function() {
      var map = new Map();
      var key = new Key(1);
      assert.isNull(map.get(key));
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(2);
      assert.isNull(map.set(key1, 'abc'));
      assert.isNull(map.get(key2));
    });

  });

  suite('has', function() {

    test('nonexisting key', function() {
      var map = new Map();
      var key = new Key(1);
      assert.isFalse(map.has(key));
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(-1);
      assert.isNull(map.set(key1), 'abc');
      assert.isFalse(map.has(key2));
    });

  });

  suite('del', function() {

    test('existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.strictEqual(map.del(key2), 'abc');
      assert.isFalse(map.has(key1));
      assert.strictEqual(map.size(), 0);
    });

    test('nonexisting key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(2);
      map.set(key1, 'abc');
      assert.isNull(map.del(key2));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.size(), 1);
    });

    test('existing key with same hash as existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(-1);
      map.set(key1, 'abc');
      map.set(key2, 'xyz');
      assert.strictEqual(map.del(key2), 'xyz');
      assert.isFalse(map.has(key2));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
      assert.strictEqual(map.size(), 1);
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map();
      var key1 = new Key(1);
      var key2 = new Key(-1);
      map.set(key1, 'abc');
      assert.isNull(map.del(key2));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
      assert.strictEqual(map.size(), 1);
    });

  });

  suite('size', function() {

    test('empty', function() {
      var map = new Map();
      assert.strictEqual(map.size(), 0);
    });

    test('more elements than buckets', function() {
      var map = new Map(16);
      for (var i = 0; i < 32; i++) {
        map.set(new Key(i), i);
      }
      assert.strictEqual(map.size(), 32);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var map = new Map();
      for (var i = 0; i < 10; i++) {
        map.set(new Key(i), 2*i);
      }
      map.clear();
      for (var i = 0; i < 10; i++) {
        assert.isFalse(map.has(new Key(i)));
      }
      assert.strictEqual(map.size(), 0);
    });

  });

  suite('forEach', function() {

    test('empty', function() {
      var map = new Map();
      assert.strictEqual(map.forEach(function() {
        assert.fail('unexpected call');
      }), 0);
    });

    test('nonempty', function() {
      var map = new Map();
      var keys = [];
      var values = [];
      for (var value = 0; value < 10; value++) {
        var key = new Key(value);
        map.set(key, value);
        keys.push(key);
        values.push(value);
      }

      var seenKeys = [];
      var seenValues = [];
      var count = map.forEach(function(key, val) {
        seenKeys.push(key);
        seenValues.push(val);
      });

      assert.strictEqual(count, 10);
      assert.sameMembers(keys, seenKeys);
      assert.sameMembers(values, seenValues);
      for (var i = 0; i < 10; i++) {
        assert.strictEqual(seenKeys[i]._key, seenValues[i]);
      }
    });

  });

});
