/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var defaults = require('../util/defaults');
var clearOwnProperties = require('../util/clearOwnProperties');

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
function ControlCursor(controls, id, element, opts) {
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
ControlCursor.prototype.destroy = function() {
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
};

ControlCursor.prototype._updateAttachment = function() {
  var controls = this._controls;
  var id = this._id;
  if (controls.enabled() && controls.method(id).enabled) {
    this._attachToControlMethod(controls.method(id));
  } else {
    this._detachFromControlMethod(controls.method(id));
  }
};

ControlCursor.prototype._attachToControlMethod = function(controlMethod) {
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
};

ControlCursor.prototype._detachFromControlMethod = function(controlMethod) {
  if (this._attached) {
    controlMethod.instance.removeEventListener('active', this._setActiveCursor);
    controlMethod.instance.removeEventListener('inactive', this._setInactiveCursor);

    this._setDisabledCursor();

    this._attached = false;
  }
};

ControlCursor.prototype._setCursor = function(cursor) {
  this._element.style.cursor = cursor;
}

module.exports = ControlCursor;
