import eventEmitter from "minimal-event-emitter";
import Dynamics from "./Dynamics";
import HammerGestures from "./HammerGestures";
import defaults from "../util/defaults";
import { maxFriction as maxFriction } from "./util";
import clearOwnProperties from "../util/clearOwnProperties";

var defaultOptions = {
  speed: 8,
  friction: 6,
  maxFrictionTime: 0.3,
};

/**
 * @class QtvrControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Controls the view by holding the mouse button down and moving it.
 * Also known as "QTVR" control mode.
 *
 * @param {Element} element Element to listen for events.
 * @param {string} pointerType Which Hammer.js pointer type to use (e.g.
 * `mouse` or `touch`).
 * @param {Object} opts
 * @param {number} opts.speed
 * @param {number} opts.friction
 * @param {number} opts.maxFrictionTime
 */
// TODO: allow speed not change linearly with distance to click spot.
// Quadratic or other would allow a larger speed range.
class QtvrControlMethod {
  _element: any;
  _opts: { [x: string]: any };
  _active: boolean;
  _hammer: import("/Users/tomche/development/open-source/marzipano/src/controls/HammerGestures").HammerGesturesHandle;
  _dynamics: { x: Dynamics; y: Dynamics };

  constructor(element: Element, pointerType: string, opts?: undefined) {
    this._element = element;

    this._opts = defaults(opts || {}, defaultOptions);

    this._active = false;

    this._hammer = HammerGestures.get(element, pointerType);

    this._dynamics = {
      x: new Dynamics(),
      y: new Dynamics(),
    };

    this._hammer.on("panstart", this._handleStart.bind(this));
    this._hammer.on("panmove", this._handleMove.bind(this));
    this._hammer.on("panend", this._handleRelease.bind(this));
    this._hammer.on("pancancel", this._handleRelease.bind(this));
  }
  /**
   * Destructor.
   */
  destroy() {
    this._hammer.release();
    clearOwnProperties(this);
  }
  _handleStart(e) {
    // Prevent event dragging other DOM elements and causing strange behavior on Chrome
    e.preventDefault();

    if (!this._active) {
      this._active = true;
      this.emit("active");
    }
  }
  emit(_arg0: string, _arg1?: any, _arg2?: any) {
    throw new Error("Method not implemented.");
  }
  _handleMove(e) {
    // Prevent event dragging other DOM elements and causing strange behavior on Chrome
    e.preventDefault();

    this._updateDynamics(e, false);
  }
  _handleRelease(e) {
    // Prevent event dragging other DOM elements and causing strange behavior on Chrome
    e.preventDefault();

    this._updateDynamics(e, true);

    if (this._active) {
      this._active = false;
      this.emit("inactive");
    }
  }
  _updateDynamics(e, release) {
    var elementRect = this._element.getBoundingClientRect();
    var width = elementRect.right - elementRect.left;
    var height = elementRect.bottom - elementRect.top;
    var maxDim = Math.max(width, height);

    var x = (e.deltaX / maxDim) * this._opts.speed;
    var y = (e.deltaY / maxDim) * this._opts.speed;

    this._dynamics.x.reset();
    this._dynamics.y.reset();
    this._dynamics.x.velocity = x;
    this._dynamics.y.velocity = y;

    if (release) {
      maxFriction(
        this._opts.friction,
        this._dynamics.x.velocity,
        this._dynamics.y.velocity,
        this._opts.maxFrictionTime,
        tmpReleaseFriction
      );
      this._dynamics.x.friction = tmpReleaseFriction[0];
      this._dynamics.y.friction = tmpReleaseFriction[1];
    }

    this.emit("parameterDynamics", "x", this._dynamics.x);
    this.emit("parameterDynamics", "y", this._dynamics.y);
  }
}

eventEmitter(QtvrControlMethod);

var tmpReleaseFriction: [null, null] = [null, null];

export default QtvrControlMethod;
