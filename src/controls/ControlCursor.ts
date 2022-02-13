import defaults from "../util/defaults";
import clearOwnProperties from "../util/clearOwnProperties";

var defaultOpts = {
  active: 'move',
  inactive: 'default',
  disabled: 'default'
};

/**
 * @class ControlCursor
 * @classdesc
 *
 * Sets the CSS cursor on a DOM element according to the state of a
 * {@link ControlMethod}.
 *
 * @param {Controls} controls Controls instance containing the control method.
 * @param {string} id ID of the control method.
 * @param {Element} element DOM element where the cursor should be set.
 * @param {Object} opts The control cursors. Each field must be a valid value
 *     for the `cursor` CSS property.
 * @param {string} [opts.active='move'] Cursor to set when the control method
 *     is enabled and active.
 * @param {string} [opts.inactive='default'] Cursor to set when the control
 *     method is enabled and inactive.
 * @param {string} [opts.disabled='default'] Cursor to set when the control
 *     method is disabled.
 */
class ControlCursor {
  _element: any;
  _controls: any;
  _id: any;
  _attached: boolean;
  _setActiveCursor: () => void;
  _setInactiveCursor: () => void;
  _setDisabledCursor: () => void;
  _setOriginalCursor: () => void;
  _updateAttachmentHandler: () => void;
  constructor(controls, id, element, opts) {
    opts = defaults(opts || {}, defaultOpts);

    // TODO: This class may misbehave if the control method is unregistered and a
    // different control method is registered under the same id.
    this._element = element;
    this._controls = controls;
    this._id = id;

    this._attached = false;

    this._setActiveCursor = this._setCursor.bind(this, opts.active);
    this._setInactiveCursor = this._setCursor.bind(this, opts.inactive);
    this._setDisabledCursor = this._setCursor.bind(this, opts.disabled);
    this._setOriginalCursor = this._setCursor.bind(this, this._element.style.cursor);

    this._updateAttachmentHandler = this._updateAttachment.bind(this);

    controls.addEventListener('methodEnabled', this._updateAttachmentHandler);
    controls.addEventListener('methodDisabled', this._updateAttachmentHandler);
    controls.addEventListener('enabled', this._updateAttachmentHandler);
    controls.addEventListener('disabled', this._updateAttachmentHandler);

    this._updateAttachment();
  }
  /**
   * Destructor.
   */
  destroy() {
    this._detachFromControlMethod(this._controls.method(this._id));
    this._setOriginalCursor();

    this._controls.removeEventListener('methodEnabled',
      this._updateAttachmentHandler);
    this._controls.removeEventListener('methodDisabled',
      this._updateAttachmentHandler);
    this._controls.removeEventListener('enabled',
      this._updateAttachmentHandler);
    this._controls.removeEventListener('disabled',
      this._updateAttachmentHandler);

    clearOwnProperties(this);
  }
  _updateAttachment() {
    var controls = this._controls;
    var id = this._id;
    if (controls.enabled() && controls.method(id).enabled) {
      this._attachToControlMethod(controls.method(id));
    } else {
      this._detachFromControlMethod(controls.method(id));
    }
  }
  _attachToControlMethod(controlMethod) {
    if (!this._attached) {
      controlMethod.instance.addEventListener('active', this._setActiveCursor);
      controlMethod.instance.addEventListener('inactive', this._setInactiveCursor);

      if (controlMethod.active) {
        this._setActiveCursor();
      } else {
        this._setInactiveCursor();
      }

      this._attached = true;
    }
  }
  _detachFromControlMethod(controlMethod) {
    if (this._attached) {
      controlMethod.instance.removeEventListener('active', this._setActiveCursor);
      controlMethod.instance.removeEventListener('inactive', this._setInactiveCursor);

      this._setDisabledCursor();

      this._attached = false;
    }
  }
  _setCursor(cursor) {
    this._element.style.cursor = cursor;
  }
}

export default ControlCursor;
