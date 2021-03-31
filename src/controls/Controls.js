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

var eventEmitter = require('minimal-event-emitter');
var Composer = require('./Composer');
var clearOwnProperties = require('../util/clearOwnProperties');

var debug = typeof MARZIPANODEBUG !== 'undefined' && MARZIPANODEBUG.controls;

/**
 * @class Controls
 * @classdesc
 *
 * Set of controls which affect a view (e.g. keyboard, touch)
 *
 * {@link ControlMethod} instances can be registered on this class. The methods
 * are then combined to calculate the final parameters to change the {@link View}.
 *
 * Controls is attached to a {@link RenderLoop}. Currently it affects the
 * {@link view} of all {@link Layer} on the {@link Stage} of the
 * {@link RenderLoop} it is attached to. A more flexible API may be provided
 * in the future.
 *
 * The ControlMethod instances are registered with an id and may be enabled,
 * disabled and unregistered using that id. The whole Control can also be
 * enabled or disabled.
 *
 */
function Controls(opts) {
  opts = opts || {};

  this._methods = {};
  this._methodGroups = {};
  this._composer = new Composer();

  // Whether the controls are enabled.
  this._enabled = (opts && opts.enabled) ? !!opts.enabled : true;

  // How many control methods are enabled and in the active state.
  this._activeCount = 0;

  this.updatedViews_ = [];

  this._attachedRenderLoop = null;
}

eventEmitter(Controls);

/**
 * Destructor.
 */
Controls.prototype.destroy = function() {
  this.detach();
  this._composer.destroy();
  clearOwnProperties(this);
};


/**
 * @return {ControlMethod[]} List of registered @{link ControlMethod instances}
 */
Controls.prototype.methods = function() {
  var obj = {};
  for (var id in this._methods) {
    obj[id] = this._methods[id];
  }
  return obj;
};

/**
 * @param {String} id
 * @return {ControlMethod}
 */
Controls.prototype.method = function(id) {
  return this._methods[id];
};

/**
 * @param {String} id
 * @param {ControlMethod} instance
 * @param {Boolean} [enable=false]
 */
Controls.prototype.registerMethod = function(id, instance, enable) {
  if (this._methods[id]) {
    throw new Error('Control method already registered with id ' + id);
  }

  this._methods[id] = {
    instance: instance,
    enabled: false,
    active: false,
    activeHandler: this._handleActive.bind(this, id),
    inactiveHandler: this._handleInactive.bind(this, id)
  };

  if(enable) {
    this.enableMethod(id, instance);
  }
};


/**
 * @param {String} id
 */
Controls.prototype.unregisterMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('No control method registered with id ' + id);
  }
  if (method.enabled) {
    this.disableMethod(id);
  }
  delete this._methods[id];
};

/**
 * @param {String} id
 */
Controls.prototype.enableMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('No control method registered with id ' + id);
  }
  if (method.enabled) {
    return;
  }
  method.enabled = true;
  if (method.active) {
    this._incrementActiveCount();
  }
  this._listen(id);
  this._updateComposer();
  this.emit('methodEnabled', id);
};


/**
 * @param {String} id
 */
Controls.prototype.disableMethod = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('No control method registered with id ' + id);
  }
  if (!method.enabled) {
    return;
  }
  method.enabled = false;
  if (method.active) {
    this._decrementActiveCount();
  }
  this._unlisten(id);
  this._updateComposer();
  this.emit('methodDisabled', id);
};


/**
 * Create a method group, which can be used to more conveniently enable or
 * disable several control methods at once
 * @param {String} groupId
 * @param {String[]} methodIds
 */
Controls.prototype.addMethodGroup = function(groupId, methodIds) {
  this._methodGroups[groupId] = methodIds;
}

/**
 * @param {String} groupId
 */
Controls.prototype.removeMethodGroup = function(id) {
  delete this._methodGroups[id];
}

/**
 * @return {ControlMethodGroup[]} List of control method groups
 */
Controls.prototype.methodGroups = function() {
  var obj = {};
  for (var id in this._methodGroups) {
    obj[id] = this._methodGroups[id];
  }
  return obj;
}

/**
 * Enables all the control methods in the group
 * @param {String} groupId
 */
Controls.prototype.enableMethodGroup = function(id) {
  var self = this;
  self._methodGroups[id].forEach(function(methodId) {
    self.enableMethod(methodId);
  });
}

/**
 * Disables all the control methods in the group
 * @param {String} groupId
 */
Controls.prototype.disableMethodGroup = function(id) {
  var self = this;
  self._methodGroups[id].forEach(function(methodId) {
    self.disableMethod(methodId);
  });
}

/**
 * @returns {Boolean}
 */
Controls.prototype.enabled = function() {
  return this._enabled;
};

/**
 * Enables the controls
 */
Controls.prototype.enable = function() {
  if (this._enabled) {
    return;
  }
  this._enabled = true;
  if (this._activeCount > 0) {
    this.emit('active');
  }
  this.emit('enabled');
  this._updateComposer();
};


/**
 * Disables the controls
 */
Controls.prototype.disable = function() {
  if (!this._enabled) {
    return;
  }
  this._enabled = false;
  if (this._activeCount > 0) {
    this.emit('inactive');
  }
  this.emit('disabled');
  this._updateComposer();
};



/**
 * Attaches the controls to a {@link RenderLoop}. The RenderLoop will be woken
 * up when the controls are activated
 *
 * @param {RenderLoop}
 */
Controls.prototype.attach = function(renderLoop) {
  if (this._attachedRenderLoop) {
    this.detach();
  }

  this._attachedRenderLoop = renderLoop;
  this._beforeRenderHandler = this._updateViewsWithControls.bind(this);
  this._changeHandler = renderLoop.renderOnNextFrame.bind(renderLoop);

  this._attachedRenderLoop.addEventListener('beforeRender', this._beforeRenderHandler);
  this._composer.addEventListener('change', this._changeHandler);
};

/**
 * Detaches the controls
 */
Controls.prototype.detach = function() {
  if (!this._attachedRenderLoop) {
    return;
  }

  this._attachedRenderLoop.removeEventListener('beforeRender', this._beforeRenderHandler);
  this._composer.removeEventListener('change', this._changeHandler);

  this._beforeRenderHandler = null;
  this._changeHandler = null;
  this._attachedRenderLoop = null;
};

/**
 * @param {Boolean}
 */
Controls.prototype.attached = function() {
  return this._attachedRenderLoop != null;
};


Controls.prototype._listen = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('Bad method id');
  }
  method.instance.addEventListener('active', method.activeHandler);
  method.instance.addEventListener('inactive', method.inactiveHandler);
};


Controls.prototype._unlisten = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('Bad method id');
  }
  method.instance.removeEventListener('active', method.activeHandler);
  method.instance.removeEventListener('inactive', method.inactiveHandler);
};


Controls.prototype._handleActive = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('Bad method id');
  }
  if (!method.enabled) {
    throw new Error('Should not receive event from disabled control method');
  }
  if (!method.active) {
    method.active = true;
    this._incrementActiveCount();
  }
};


Controls.prototype._handleInactive = function(id) {
  var method = this._methods[id];
  if (!method) {
    throw new Error('Bad method id');
  }
  if (!method.enabled) {
    throw new Error('Should not receive event from disabled control method');
  }
  if (method.active) {
    method.active = false;
    this._decrementActiveCount();
  }
};


Controls.prototype._incrementActiveCount = function() {
  this._activeCount++;
  if (debug) {
    this._checkActiveCount();
  }
  if (this._enabled && this._activeCount === 1) {
    this.emit('active');
  }
};


Controls.prototype._decrementActiveCount = function() {
  this._activeCount--;
  if (debug) {
    this._checkActiveCount();
  }
  if (this._enabled && this._activeCount === 0) {
    this.emit('inactive');
  }
};


Controls.prototype._checkActiveCount = function() {
  var count = 0;
  for (var id in this._methods) {
    var method = this._methods[id];
    if (method.enabled && method.active) {
      count++;
    }
  }
  if (count != this._activeCount) {
    throw new Error('Bad control state');
  }
};


Controls.prototype._updateComposer = function() {
  var composer = this._composer;

  for (var id in this._methods) {
    var method = this._methods[id];
    var enabled = this._enabled && method.enabled;

    if (enabled && !composer.has(method.instance)) {
      composer.add(method.instance);
    }
    if (!enabled && composer.has(method.instance)) {
      composer.remove(method.instance);
    }
  }
};


Controls.prototype._updateViewsWithControls = function() {
  var controlData = this._composer.offsets();
  if (controlData.changing) {
    this._attachedRenderLoop.renderOnNextFrame();
  }

  // Update each view at most once, even when shared by multiple layers.
  // The number of views is expected to be small, so use an array to keep track.
  this.updatedViews_.length = 0;

  var layers = this._attachedRenderLoop.stage().listLayers();
  for (var i = 0; i < layers.length; i++) {
    var view = layers[i].view();
    if (this.updatedViews_.indexOf(view) < 0) {
      layers[i].view().updateWithControlParameters(controlData.offsets);
      this.updatedViews_.push(view);
    }
  }
};


module.exports = Controls;
