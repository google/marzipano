import global from "../util/global";
import eventEmitter from "minimal-event-emitter";
import clearOwnProperties from "../util/clearOwnProperties";

var propertyMap = {
  HTMLImageElement: ['naturalWidth', 'naturalHeight'],
  HTMLCanvasElement: ['width', 'height'],
  ImageBitmap: ['width', 'height']
};

/**
 * @class StaticAsset
 * @implements Asset
 * @classdesc
 *
 * An {@link Asset} whose pixel contents never change.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} element The
 *     underlying pixel source.
 * @throws If the pixel source is unsupported.
 */
class StaticAsset {
  _widthProp: any;
  _heightProp: any;
  _element: any;

  constructor(element) {
    var supported = false;
    for (var type in propertyMap) {
      if (global?.[type] && element instanceof global[type]) {
        supported = true;
        this._widthProp = propertyMap[type][0];
        this._heightProp = propertyMap[type][1];
        break;
      }
    }
    if (!supported) {
      throw new Error('Unsupported pixel source');
    }

    this._element = element;
  }
  /**
   * Destructor.
   */
  destroy() {
    clearOwnProperties(this);
  }
  element() {
    return this._element;
  }
  width() {
    return this._element[this._widthProp];
  }
  height() {
    return this._element[this._heightProp];
  }
  timestamp() {
    return 0;
  }
  isDynamic() {
    return false;
  }
}

eventEmitter(StaticAsset);

export default StaticAsset;
