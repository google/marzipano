import eventEmitter from "minimal-event-emitter";
import Dynamics from "./Dynamics";
import defaults from "../util/defaults";
import clearOwnProperties from "../util/clearOwnProperties";

var defaultOptions = {
  frictionTime: 0.2,
  zoomDelta: 0.001
};

/**
 * @class ScrollZoomControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Controls the fov/zoom through the mouse wheel.
 *
 * @param {Element} element Element to listen for events.
 * @param {Object} opts
 * @param {number} [opts.frictionTime=0.2]
 * @param {number} [opts.zoomDelta=0.001]
 */
class ScrollZoomControlMethod {
  _element: any;
  _opts: { [x: string]: any; };
  _dynamics: Dynamics;
  _eventList: any[];
  _wheelListener: (e: any) => void;

  constructor(element: Element, opts?: any) {
    this._element = element;
    this._opts = defaults(opts || {}, defaultOptions);
    this._dynamics = new Dynamics();
    this._eventList = [];

    var fn = this._opts.frictionTime ? this.withSmoothing : this.withoutSmoothing;
    this._wheelListener = fn.bind(this);

    element.addEventListener('wheel', this._wheelListener);
  }
  /**
   * Destructor.
   */
  destroy() {
    this._element.removeEventListener('wheel', this._wheelListener);
    clearOwnProperties(this);
  }
  withoutSmoothing(e) {
    this._dynamics.offset = wheelEventDelta(e) * this._opts.zoomDelta;
    this.emit('parameterDynamics', 'zoom', this._dynamics);

    e.preventDefault();

    this.emit('active');
    this.emit('inactive');
  }
  emit(_arg0: string, _arg1?: string, _dynamics?: any) {
    throw new Error("Method not implemented.");
  }
  withSmoothing(e) {
    var currentTime = e.timeStamp;

    // Record event.
    this._eventList.push(e);

    // Remove events whose smoothing has already expired.
    while (this._eventList[0].timeStamp < currentTime - this._opts.frictionTime * 1000) {
      // TODO: figure out what's up with 0
      // @ts-ignore
      this._eventList.shift(0);
    }

    // Get the current velocity from the recorded events.
    // Each wheel movement causes a velocity of change/frictionTime during frictionTime.
    var velocity = 0;
    for (var i = 0; i < this._eventList.length; i++) {
      var zoomChangeFromEvent = wheelEventDelta(this._eventList[i]) * this._opts.zoomDelta;
      velocity += zoomChangeFromEvent / this._opts.frictionTime;
    }

    this._dynamics.velocity = velocity;
    this._dynamics.friction = Math.abs(velocity) / this._opts.frictionTime;

    this.emit('parameterDynamics', 'zoom', this._dynamics);

    e.preventDefault();

    this.emit('active');
    this.emit('inactive');
  }
}

eventEmitter(ScrollZoomControlMethod);

function wheelEventDelta(e) {
  var multiplier = e.deltaMode == 1 ? 20 : 1;
  return e.deltaY * multiplier;
}


export default ScrollZoomControlMethod;
