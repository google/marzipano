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

var LruMap = require('../../../src/collections/LruMap');

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

suite('LruMap', function() {

  suite('set', function() {

    test('nonexisting key', function() {
      var map = new LruMap(4);
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.isTrue(map.has(key2));
      assert.strictEqual(map.get(key2), 'abc');
      assert.strictEqual(map.size(), 1);
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new LruMap(4);
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
      var map = new LruMap(4);
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

    test('existing key', function() {
      var map = new LruMap(4);
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.isNull(map.set(key2, 'xyz'));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'xyz');
      assert.strictEqual(map.size(), 1);
    });

    test('existing key on a full map', function() {
      var map = new LruMap(4);
      var keys = [];
      var values = [];
      for (var i = 0; i < 8; i++) {
        keys.push(new Key(i));
        values.push(i);
      }
      assert.isNull(map.set(keys[0], values[0]));
      assert.isNull(map.set(keys[1], values[1]));
      assert.isNull(map.set(keys[2], values[2]));
      assert.isNull(map.set(keys[3], values[3]));
      assert.isNull(map.set(keys[2], values[4]));
      assert.strictEqual(map.set(keys[4], values[4]), keys[0]);
      assert.strictEqual(map.set(keys[5], values[5]), keys[1]);
      assert.strictEqual(map.set(keys[6], values[6]), keys[3]);
      assert.strictEqual(map.set(keys[7], values[7]), keys[2]);
      for (var i = 0; i < 8; i++) {
        if (i >= 4 && i <= 7) {
          assert.isTrue(map.has(keys[i]));
        } else {
          assert.isFalse(map.has(keys[i]));
        }
      }
      assert.strictEqual(map.size(), 4);
    });

    test('nonexisting key on a full map', function() {
      var map = new LruMap(4);
      var keys = [];
      var values = [];
      for (var i = 0; i < 8; i++) {
        keys.push(new Key(i));
        values.push(i);
      }
      assert.isNull(map.set(keys[0], values[0]));
      assert.isNull(map.set(keys[1], values[1]));
      assert.isNull(map.set(keys[2], values[2]));
      assert.isNull(map.set(keys[3], values[3]));
      assert.strictEqual(map.set(keys[4], values[4]), keys[0]);
      assert.strictEqual(map.set(keys[5], values[5]), keys[1]);
      assert.strictEqual(map.set(keys[6], values[6]), keys[2]);
      assert.strictEqual(map.set(keys[7], values[7]), keys[3]);
      for (var i = 0; i < 8; i++) {
        if (i >= 4 && i <= 7) {
          assert.isTrue(map.has(keys[i]));
        } else {
          assert.isFalse(map.has(keys[i]));
        }
      }
      assert.strictEqual(map.size(), 4);
    });

    test('on a map with zero capacity', function() {
      var map = new LruMap(0);
      var key = new Key(1);
      assert.strictEqual(map.set(key, 'abc'), key);
      assert.isFalse(map.has(key));
      assert.strictEqual(map.size(), 0);
    });

  });

  suite('get', function() {

    test('nonexisting key', function() {
      var map = new LruMap(4);
      var key = new Key(1);
      assert.isNull(map.get(key));
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new LruMap(4);
      var key1 = new Key(1);
      var key2 = new Key(-1);
      assert.isNull(map.set(key1, 'abc'));
      assert.isNull(map.get(key2));
    });

  });

  suite('has', function() {

    test('nonexisting key', function() {
      var map = new LruMap(4);
      var key = new Key(1);
      assert.isFalse(map.has(key));
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new LruMap(4);
      var key1 = new Key(1);
      var key2 = new Key(-1);
      assert.isNull(map.set(key1), 'abc');
      assert.isFalse(map.has(key2));
    });

  });

  suite('del', function() {

    test('existing key', function() {
      var map = new LruMap(16);
      var key1 = new Key(1);
      var key2 = new Key(1);
      assert.isNull(map.set(key1, 'abc'));
      assert.strictEqual(map.del(key2), 'abc');
      assert.isFalse(map.has(key1));
    });

    test('nonexisting key', function() {
      var map = new LruMap(16);
      var key1 = new Key(1);
      var key2 = new Key(2);
      map.set(key1, 'abc');
      assert.isNull(map.del(key2));
      assert.isTrue(map.has(key1));
    });

    test('existing key with same hash as existing key', function() {
      var map = new LruMap(16);
      var key1 = new Key(1);
      var key2 = new Key(-1);
      map.set(key1, 'abc');
      map.set(key2, 'xyz');
      assert.strictEqual(map.del(key2), 'xyz');
      assert.isFalse(map.has(key2));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new LruMap(16);
      var key1 = new Key(1);
      var key2 = new Key(-1);
      map.set(key1, 'abc');
      assert.isNull(map.del(key2));
      assert.isTrue(map.has(key1));
      assert.strictEqual(map.get(key1), 'abc');
    });

    test('first key on a full map', function() {
      var map = new LruMap(16);
      var first;
      for (var i = 0; i < 16; i++) {
        var key = new Key(i);
        if (i === 0) {
          first = key;
        }
        map.set(key, i);
      }
      assert.strictEqual(map.del(first), 0);
      assert.isFalse(map.has(first));
    });

  });

  suite('size', function() {

    test('empty', function() {
      var map = new LruMap(16);
      assert.strictEqual(map.size(), 0);
    });

    test('one element', function() {
      var map = new LruMap(16);
      map.set(new Key(1), 'abc');
      assert.strictEqual(map.size(), 1);
    });

    test('two elements with different hash', function() {
      var map = new LruMap(16);
      map.set(new Key(1), 'abc');
      map.set(new Key(2), 'xyz');
      assert.strictEqual(map.size(), 2);
    });

    test('two elements with same hash', function() {
      var map = new LruMap(16);
      map.set(new Key(1), 'abc');
      map.set(new Key(-1), 'xyz');
      assert.strictEqual(map.size(), 2);
    });

    test('full', function() {
      var map = new LruMap(16);
      for (var i = 0; i < 16; i++) {
        map.set(new Key(i), i);
      }
      assert.strictEqual(map.size(), 16);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var map = new LruMap(16);
      for (var i = 0; i < 10; i++) {
        map.set(new Key(i), i);
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
      var map = new LruMap(16);
      assert.strictEqual(map.forEach(function() {
        assert.fail('unexpected call');
      }), 0);
    });

    test('nonempty', function() {
      var map = new LruMap(16);
      var keys = [];
      for (var i = 0; i < 10; i++) {
        var key = new Key(i);
        map.set(key, i);
        keys.push(key);
      }

      var seenKeys = [];
      var seenValues = [];
      var count = map.forEach(function(key, val) {
        seenKeys.push(key);
        seenValues.push(val);
      });

      assert.strictEqual(count, 10);
      assert.lengthOf(seenKeys, 10);
      assert.lengthOf(seenValues, 10);

      for (var i = 0; i < 10; i++) {
        assert.strictEqual(seenKeys[i]._key, seenValues[i]);
      }
    });

  });

});
