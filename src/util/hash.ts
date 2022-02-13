// Jenkins one-at-a-time hash
// http://www.burtleburtle.net/bob/hash/doobs.html
// Input: an array of integers
// Output: an integer

function hash(...args) {
  var h = 0;
  for (var i = 0; i < args.length; i++) {
    var k = args[i];
    h += k;
    h += k << 10;
    h ^= k >> 6;
  }
  h += h << 3;
  h ^= h >> 11;
  h += h << 15;
  return h >= 0 ? h : -h;
}

export default hash;