/**
 * @class RendererRegistry
 * @classdesc
 *
 * A RendererRegistry maps pairs of {@link Geometry} and {@link View} type into
 * the appropriate {@link Renderer} class. It is used by a {@link Stage} to
 * determine the appropriate renderer for a {@link Layer}.
 *
 * See also {@link Stage#registerRenderer}.
 */
class RendererRegistry {
  _renderers: {};
  constructor() {
    this._renderers = {};
  }
  /**
   * Registers a renderer for the given geometry and view type.
   * @param {string} geometryType The geometry type, as given by
   *     {@link Geometry#type}.
   * @param {string} viewType The view type, as given by {@link View#type}.
   * @param {*} Renderer The renderer class.
   */
  set(geometryType, viewType, Renderer) {
    if (!this._renderers[geometryType]) {
      this._renderers[geometryType] = {};
    }
    this._renderers[geometryType][viewType] = Renderer;
  }
  /**
   * Retrieves the renderer for the given geometry and view type.
   * @param {string} geometryType The geometry type, as given by
   *     {@link Geometry#type}.
   * @param {string} viewType The view type, as given by {@link View#type}.
   * @param {*} Renderer The renderer class, or null if no such renderer has been
   * registered.
   */
  get(geometryType, viewType) {
    var Renderer = this._renderers[geometryType] &&
      this._renderers[geometryType][viewType];
    return Renderer || null;
  }
}

export default RendererRegistry;
