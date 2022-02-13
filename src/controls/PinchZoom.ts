import eventEmitter from "minimal-event-emitter";
import Dynamics from "./Dynamics";
import HammerGestures from "./HammerGestures";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class PinchZoomControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Control the view fov/zoom by pinching with two fingers.
 *
 * @param {Element} element Element to listen for events.
 * @param {string} pointerType Which Hammer.js pointer type to use
 * @param {Object} opts
 */
class PinchZoomControlMethod {
  _hammer: import("/Users/tomche/development/open-source/marzipano/src/controls/HammerGestures").HammerGesturesHandle;
  _lastEvent: null | { scale: number; };
  _active: boolean;
  _dynamics: Dynamics;

  constructor(element, pointerType) {
    this._hammer = HammerGestures.get(element, pointerType);

    this._lastEvent = null;

    this._active = false;

    this._dynamics = new Dynamics();

    this._hammer.on('pinchstart', this._handleStart.bind(this));
    this._hammer.on('pinch', this._handleEvent.bind(this));
    this._hammer.on('pinchend', this._handleEnd.bind(this));
    this._hammer.on('pinchcancel', this._handleEnd.bind(this));
  }
  /**
   * Destructor.
   */
  destroy() {
    this._hammer.release();
    clearOwnProperties(this);
  }
  _handleStart() {
    if (!this._active) {
      this._active = true;
      this.emit('active');
    }
  }
  emit(_arg0: string, _parameter?: string, _dynamics?: Dynamics) {
    throw new Error("Method not implemented.");
  }
  _handleEnd() {
    this._lastEvent = null;

    if (this._active) {
      this._active = false;
      this.emit('inactive');
    }
  }
  _handleEvent(e) {
    var scale = e.scale;

    if (this._lastEvent) {
      scale /= this._lastEvent.scale;
    }

    this._dynamics.offset = (scale - 1) * -1;
    this.emit('parameterDynamics', 'zoom', this._dynamics);

    this._lastEvent = e;
  }
}

eventEmitter(PinchZoomControlMethod);

export default PinchZoomControlMethod;
