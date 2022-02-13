import eventEmitter from "minimal-event-emitter";
import Dynamics from "./Dynamics";
import now from "../util/now";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class ControlComposer
 * @classdesc
 *
 * Combines changes in parameters triggered by multiple {@link ControlMethod}
 * instances.
 *
 * @listens ControlMethod#parameterDynamics
 */
class ControlComposer {
  _methods: Array<{
    instance: any;
    dynamics: any;
    parameterDynamicsHandler: (parameter: string, dynamics: Dynamics) => void;
  }>;
  _parameters: string[];
  _now: any;
  _composedOffsets: {};
  _composeReturn: { offsets: any; changing: null | boolean };
  constructor(opts?: { nowForTesting?: any } | undefined) {
    opts = opts || {};

    this._methods = [];

    this._parameters = [
      "x",
      "y",
      "axisScaledX",
      "axisScaledY",
      "zoom",
      "yaw",
      "pitch",
      "roll",
    ];

    this._now = opts.nowForTesting || now;

    this._composedOffsets = {};

    this._composeReturn = { offsets: this._composedOffsets, changing: null };
  }
  add(instance) {
    if (this.has(instance)) {
      return;
    }

    var dynamics = {};
    this._parameters.forEach(function (parameter) {
      dynamics[parameter] = {
        dynamics: new Dynamics(),
        time: null,
      };
    });

    var parameterDynamicsHandler = this._updateDynamics.bind(this, dynamics);

    var method = {
      instance: instance,
      dynamics: dynamics,
      parameterDynamicsHandler: parameterDynamicsHandler,
    };

    instance.addEventListener("parameterDynamics", parameterDynamicsHandler);

    this._methods.push(method);
  }
  remove(instance) {
    var index = this._indexOfInstance(instance);
    if (index >= 0) {
      var method = this._methods.splice(index, 1)[0];
      method.instance.removeEventListener(
        "parameterDynamics",
        method.parameterDynamicsHandler
      );
    }
  }
  has(instance) {
    return this._indexOfInstance(instance) >= 0;
  }
  _indexOfInstance(instance) {
    for (var i = 0; i < this._methods.length; i++) {
      if (this._methods[i].instance === instance) {
        return i;
      }
    }
    return -1;
  }
  list() {
    var instances: unknown[] = [];
    for (var i = 0; i < this._methods.length; i++) {
      instances.push(this._methods[i].instance);
    }
    return instances;
  }
  _updateDynamics(storedDynamics, parameter, dynamics) {
    var parameterDynamics = storedDynamics[parameter];

    if (!parameterDynamics) {
      throw new Error("Unknown control parameter " + parameter);
    }

    var newTime = this._now();
    parameterDynamics.dynamics.update(
      dynamics,
      (newTime - parameterDynamics.time) / 1000
    );
    parameterDynamics.time = newTime;

    this.emit("change");
  }
  emit(_arg0: string) {
    throw new Error("Method not implemented.");
  }
  _resetComposedOffsets() {
    for (var i = 0; i < this._parameters.length; i++) {
      this._composedOffsets[this._parameters[i]] = 0;
    }
  }
  offsets() {
    var parameter;
    var changing = false;

    var currentTime = this._now();

    this._resetComposedOffsets();

    for (var i = 0; i < this._methods.length; i++) {
      var methodDynamics = this._methods[i].dynamics;

      for (var p = 0; p < this._parameters.length; p++) {
        parameter = this._parameters[p];
        var parameterDynamics = methodDynamics[parameter];
        var dynamics = parameterDynamics.dynamics;

        // Add offset to composed offset
        if (dynamics.offset != null) {
          this._composedOffsets[parameter] += dynamics.offset;
          // Reset offset
          dynamics.offset = null;
        }

        // Calculate offset from velocity and add it
        var elapsed = (currentTime - parameterDynamics.time) / 1000;
        var offsetFromVelocity = dynamics.offsetFromVelocity(elapsed);

        if (offsetFromVelocity) {
          this._composedOffsets[parameter] += offsetFromVelocity;
        }

        // Update velocity on dynamics
        var currentVelocity = dynamics.velocityAfter(elapsed);
        dynamics.velocity = currentVelocity;

        // If there is still a velocity, set changing
        if (currentVelocity) {
          changing = true;
        }

        parameterDynamics.time = currentTime;
      }
    }

    this._composeReturn.changing = changing;
    return this._composeReturn;
  }
  destroy() {
    var instances = this.list();
    for (var i = 0; i < instances.length; i++) {
      this.remove(instances[i]);
    }

    clearOwnProperties(this);
  }
}

eventEmitter(ControlComposer);

export default ControlComposer;
