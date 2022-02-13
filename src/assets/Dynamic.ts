import StaticAsset from "./Static";
import eventEmitter from "minimal-event-emitter";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class DynamicAsset
 * @implements Asset
 * @extends StaticAsset
 * @classdesc
 *
 * An {@link Asset} whose pixel contents may change.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} element The
 *     underlying pixel source.
 * @throws If the pixel source is unsupported.
 */
class DynamicAsset extends StaticAsset {
  _timestamp: number;

  constructor(element: ConstructorParameters<typeof StaticAsset>[0]) {
    super(element);
    this._timestamp = 0;
  }
  /**
   * Destructor.
   */
  destroy() {
    clearOwnProperties(this);
  }
  timestamp() {
    return this._timestamp;
  }
  isDynamic() {
    return true;
  }
  /**
   * Marks the asset dirty, signaling that the contents of the underlying pixel
   * source have changed.
   *
   * @throws If the asset is not dynamic.
   */
  markDirty() {
    this._timestamp++;
    // TODO: define the proper event emitter interface
    // @ts-ignore
    this.emit('change');
  }
}

eventEmitter(DynamicAsset);

export default DynamicAsset;
