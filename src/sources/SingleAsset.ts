/**
 * @class SingleAssetSource
 * @implements Source
 * @classdesc
 *
 * A {@link Source} that always provides the same {@link Asset}.
 *
 * @param {Asset} asset The asset.
*/
class SingleAssetSource {
  _asset: any;
  constructor(asset) {
    this._asset = asset;
  }
  asset() {
    return this._asset;
  }
  loadAsset(_stage, tile, done) {
    var self = this;

    var timeout = setTimeout(function () {
      done(null, tile, self._asset);
    }, 0);

    function cancel() {
      clearTimeout(timeout);
      done.apply(null, arguments);
    }

    return cancel;
  }
}

export default SingleAssetSource;
