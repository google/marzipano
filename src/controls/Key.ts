import eventEmitter from "minimal-event-emitter";
import Dynamics from "./Dynamics";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class KeyControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Sets the velocity and friction of a single parameter by pressing and
 * unpressing a key.
 *
 * @param {number} keyCode Key which activates the method when pressed
 * @param {string} parameter The parameter to be controlled (e.g. `x`, `y` or `zoom`)
 * @param {number} velocity Velocity at which the parameter changes. Use a
 * negative number for opposite direction
 * @param {number} friction Friction at which the parameter stops
 * @param {Element} [element=document] DOM element where the key events are listened to
 */
class KeyControlMethod {
  _keyCode: any;
  _parameter: any;
  _velocity: any;
  _friction: any;
  _element: any;
  _keydownHandler: (e: any) => void;
  _keyupHandler: (e: any) => void;
  _blurHandler: () => void;
  _dynamics: Dynamics;
  _pressing: boolean;

  constructor(keyCode: number, parameter: string, velocity: number, friction: number, element?: Document) {
    if (!keyCode) {
      throw new Error("KeyControlMethod: keyCode must be defined");
    }
    if (!parameter) {
      throw new Error("KeyControlMethod: parameter must be defined");
    }
    if (!velocity) {
      throw new Error("KeyControlMethod: velocity must be defined");
    }
    if (!friction) {
      throw new Error("KeyControlMethod: friction must be defined");
    }

    element = element || document;

    this._keyCode = keyCode;
    this._parameter = parameter;
    this._velocity = velocity;
    this._friction = friction;
    this._element = element;

    this._keydownHandler = this._handlePress.bind(this);
    this._keyupHandler = this._handleRelease.bind(this);
    this._blurHandler = this._handleBlur.bind(this);

    this._element.addEventListener('keydown', this._keydownHandler);
    this._element.addEventListener('keyup', this._keyupHandler);
    window.addEventListener('blur', this._blurHandler);

    this._dynamics = new Dynamics();
    this._pressing = false;
  }
  /**
   * Destructor.
   */
  destroy() {
    this._element.removeEventListener('keydown', this._keydownHandler);
    this._element.removeEventListener('keyup', this._keyupHandler);
    window.removeEventListener('blur', this._blurHandler);
    clearOwnProperties(this);
  }
  _handlePress(e) {
    if (e.keyCode !== this._keyCode) { return; }

    this._pressing = true;

    this._dynamics.velocity = this._velocity;
    this._dynamics.friction = 0;
    this.emit('parameterDynamics', this._parameter, this._dynamics);
    this.emit('active');
  }
  emit(_arg0: string, _parameter?: any, _dynamics?: any) {
    throw new Error("Method not implemented.");
  }
  _handleRelease(e) {
    if (e.keyCode !== this._keyCode) { return; }

    if (this._pressing) {
      this._dynamics.friction = this._friction;
      this.emit('parameterDynamics', this._parameter, this._dynamics);
      this.emit('inactive');
    }

    this._pressing = false;
  }
  _handleBlur() {
    this._dynamics.velocity = 0;
    this.emit('parameterDynamics', this._parameter, this._dynamics);
    this.emit('inactive');

    this._pressing = false;
  }
}
eventEmitter(KeyControlMethod);

export default KeyControlMethod;
