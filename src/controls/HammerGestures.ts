import Hammer from "hammerjs";

var nextId = 1;
var idProperty = 'MarzipanoHammerElementId';
function getKeyForElementAndType(element, type) {
  if (!element[idProperty]) {
    element[idProperty] = nextId++;
  }
  return type + element[idProperty];
}


/**
 * @class HammerGestures
 * @classdesc
 *
 * Manages Hammer.js instances. One instance is created for each combination of
 * DOM element and pointer type.
 */
class HammerGestures {
  _managers: {};
  _refCount: {};
  constructor() {
    this._managers = {};
    this._refCount = {};
  }
  get(element, type) {
    var key = getKeyForElementAndType(element, type);
    if (!this._managers[key]) {
      this._managers[key] = this._createManager(element, type);
      this._refCount[key] = 0;
    }
    this._refCount[key]++;
    return new HammerGesturesHandle(this, this._managers[key], element, type);
  }
  _createManager(element, type) {
    var manager = new Hammer.Manager(element);

    // Managers are created with different parameters for different pointer
    // types.
    if (type === 'mouse') {
      manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));
    }
    else if (type === 'touch' || type === 'pen' || type === 'kinect') {
      // On touch one wants to have both panning and pinching. The panning
      // recognizer needs a threshold to allow the pinch to be recognized.
      manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 20, pointers: 1 }));
      manager.add(new Hammer.Pinch());
    }

    return manager;
  }
  _releaseHandle(element, type) {
    var key = getKeyForElementAndType(element, type);
    if (this._refCount[key]) {
      this._refCount[key]--;
      if (!this._refCount[key]) {
        this._managers[key].destroy();
        delete this._managers[key];
        delete this._refCount[key];
      }
    }
  }
}

export class HammerGesturesHandle {
  _manager: any;
  _element: any;
  _type: any;
  _hammerGestures: any;
  _eventHandlers: any[];

  constructor(hammerGestures, manager, element, type) {
    this._manager = manager;
    this._element = element;
    this._type = type;
    this._hammerGestures = hammerGestures;
    this._eventHandlers = [];
  }
  on(events, handler) {
    var type = this._type;
    var handlerFilteredEvents = function (e) {
      if (type === e.pointerType) {
        handler(e);
      }
    };

    this._eventHandlers.push({ events: events, handler: handlerFilteredEvents });
    this._manager.on(events, handlerFilteredEvents);
  }
  release() {
    for (var i = 0; i < this._eventHandlers.length; i++) {
      var eventHandler = this._eventHandlers[i];
      this._manager.off(eventHandler.events, eventHandler.handler);
    }

    this._hammerGestures._releaseHandle(this._element, this._type);
    this._manager = null;
    this._element = null;
    this._type = null;
    this._hammerGestures = null;
  }
  manager() {
    return this._manager;
  }
}

export default new HammerGestures();
