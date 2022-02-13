/**
 * @class Dynamics
 * @classdesc
 *
 * Represents how a control parameter changes. Used in the events emitted by
 * {@link ControlMethod}.
 *
 * @property {number} offset Parameter changed by a fixed value
 * @property {number} velocity Parameter is changing at this velocity
 * @property {number} friction The velocity will decrease at this rate
 */
class Dynamics {
  velocity: null | number;
  friction: null | number;
  offset: null | number;

  constructor() {
    this.velocity = null;
    this.friction = null;
    this.offset = null;
  }
  equals(other) {
    return Dynamics.equals(this, other);
  }
  update(other, elapsed) {
    if (other.offset) {
      // If other has an offset, make this.offset a number instead of null
      this.offset = this.offset || 0;
      this.offset += other.offset;
    }

    var offsetFromVelocity = this.offsetFromVelocity(elapsed);
    if (offsetFromVelocity) {
      // If there is an offset to add from the velocity, make this offset a number instead of null
      this.offset = this.offset || 0;
      this.offset += offsetFromVelocity;
    }

    this.velocity = other.velocity;
    this.friction = other.friction;
  }
  reset() {
    this.velocity = null;
    this.friction = null;
    this.offset = null;
  }
  velocityAfter(elapsed) {
    if (!this.velocity) {
      return null;
    }
    if (this.friction) {
      return decreaseAbs(this.velocity, this.friction * elapsed);
    }
    return this.velocity;
  }
  offsetFromVelocity(elapsed) {
    elapsed = Math.min(elapsed, this.nullVelocityTime());

    var velocityEnd = this.velocityAfter(elapsed);
    var averageVelocity = (Number(this.velocity) + Number(velocityEnd)) / 2;

    return averageVelocity * elapsed;
  }
  nullVelocityTime() {
    if (this.velocity == null) {
      return 0;
    }
    if (this.velocity && !this.friction) {
      return Infinity;
    }
    return Math.abs(this.velocity / Number(this.friction));
  }
  static equals(d1, d2) {
    return d1.velocity === d2.velocity && d1.friction === d2.friction && d1.offset === d2.offset;
  }
}

function decreaseAbs(num, dec) {
  if (num < 0) {
    return Math.min(0, num + dec);
  }
  if (num > 0) {
    return Math.max(0, num - dec);
  }
  return 0;
}

export default Dynamics;
