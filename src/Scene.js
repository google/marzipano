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

var HotspotContainer = require('./HotspotContainer');

var clock = require('./util/clock');
var noop = require('./util/noop');
var type = require('./util/type');
var defaults = require('./util/defaults');

/**
 * Signals that the scene's view has changed. See {@link View#event:change}.
 * @event Scene#viewChange
 */

/**
 * @class
 * @classdesc A @link{Scene} is a {@link Layer} with associated {@link View}
 *            and {@link Effects} that may be rendered inside a {@link Viewer}.
 *            Client code should call {@link Viewer#createScene} instead of
 *            invoking the constructor directly.
 * @param {Viewer} viewer
 * @param {Layer} layer
 */
function Scene(viewer, layers) {
  this._viewer = viewer;
  this._layers = layers;
  this._view = layers[0].view(); // assuming single view shared among all layers, referencing the first one

  // Hotspot container -- for first layer only
  this._hotspotContainer = new HotspotContainer(viewer._controlContainer, viewer._stage, this._view, viewer._renderLoop, { rect: layers[0].effects().rect });

  // The current movement.
  this._movement = null;
  this._movementStartTime = null;
  this._movementStep = null;
  this._movementParams = null;
  this._movementCallback = null;

  // Event listener for updating the view according to the current movement.
  // The listener is set/unset on the render loop when a movement starts/stops.
  this._updateMovementHandler = this._updateMovement.bind(this);

  // Show or hide hotspots when scene changes.
  this._updateHotspotContainerHandler = this._updateHotspotContainer.bind(this);
  this._viewer.addEventListener('sceneChange', this._updateHotspotContainerHandler);
  this._layers[0].addEventListener('effectsChange', this._updateHotspotContainerHandler);

  // Emit event when view changes.
  this._viewChangeHandler = this.emit.bind(this, 'viewChange');
  this._view.addEventListener('change', this._viewChangeHandler);

  // Update the hotspot container.
  this._updateHotspotContainer();
}

eventEmitter(Scene);


/**
 * Destructor. Client code should call {@link Viewer#destroyScene} instead.
 */
Scene.prototype._destroy = function() {
  this._view.removeEventListener('change', this._viewChangeHandler);
  this._viewer.removeEventListener('sceneChange', this._updateHotspotContainerHandler);
  this._layers[0].removeEventListener('effectsChange', this._updateHotspotContainerHandler);

  if (this._movement) {
    this.stopMovement();
  }

  this._hotspotContainer.destroy();

  this._movement = null;
  this._viewer = null;
  this._layers = null;
  this._view = null;
  this._hotspotContainer = null;
};



/**
 * Get the scene's @link{HotspotContainer hotspot container}.
 * @return {Layer}
 */
Scene.prototype.hotspotContainer = function() {
  return this._hotspotContainer;
};


/**
 * Get the scene's underlying @link{Layer layer}.
 * @return {Layer}
 */
Scene.prototype.layers = function() {
  return [].concat(this._layers);
};


/**
 * Get the scene's underlying @link{View view}.
 * @return {View}
 */
Scene.prototype.view = function() {
  return this._view;
};


/**
 * Get the @link{Viewer viewer} the scene belongs to.
 * @return {Viewer}
 */
Scene.prototype.viewer = function() {
  return this._viewer;
};


/**
 * Whether the scene is currently visible.
 * @return {boolean}
 */
Scene.prototype.visible = function() {
  return this._viewer.scene() === this;
};


/**
 * Switch to the scene, as would be obtained by calling {@link Viewer#switchScene}.
 * @param {Object} opts Options to pass into {@link Viewer#switchScene}.
 * @param {Object} done Called when the scene switch is complete.
 */
Scene.prototype.switchTo = function(opts, done) {
  return this._viewer.switchScene(this, opts, done);
};


/**
 * Tween the scene's underlying @link{View view}.
 * @param {Object} params Target view parameters.
 * @param {Object} opts
 * @param {Number} [opts.transitionDuration=1000] Tween duration in milliseconds.
 * @param {Number} [opts.closest=true] Whether to take the shortest path when
 * tweening; requires {@link View#normalizeToClosest} to be implemented.
 * @param {Function} done Called when the tween finishes or is interrupted.
 */
Scene.prototype.lookTo = function(params, opts, done) {
  // TODO: allow controls to interrupt an ongoing tween.
  // TODO: provide a way to override the easing function.
  opts = opts || {};
  done = done || noop;

  if (type(params) !== 'object') {
    throw new Error("Target view parameters must be an object");
  }

  var duration = opts.transitionDuration != null ? opts.transitionDuration : 1000;
  var shortest = opts.shortest != null ? opts.shortest : true;

  var view = this._view;

  var initialParams = view.parameters();

  var finalParams = {};
  defaults(finalParams, params);
  defaults(finalParams, initialParams);

  // Tween through the shortest path if requested.
  // The view must implement the normalizeToClosest() method.
  if (shortest && view.normalizeToClosest) {
    view.normalizeToClosest(finalParams, finalParams);
  }

  // Quadratic in/out easing.
  var ease = function (k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k;
    }
    return -0.5 * (--k * (k - 2) - 1);
  };

  var movement = function() {

    var finalUpdate = false;

    return function(params, elapsed) {

      if (elapsed >= duration && finalUpdate) {
        return null;
      }

      var delta = Math.min(elapsed / duration, 1);

      for (var param in params) {
        var start = initialParams[param];
        var end = finalParams[param];
        params[param] = start + ease(delta) * (end - start);
      }

      finalUpdate = elapsed >= duration;

      return params;

    };
  };

  var controlsEnabled = this._viewer.controls().enabled();

  this._viewer.controls().disable();
  this.startMovement(movement, function() {
    if(controlsEnabled) {
      this._viewer.controls().enable();
    }
    done();
  });

};


/**
 * Start a movement.
 * @param {Function} fn Movement function.
 * @param {Function} done Called when the movement finishes.
 */
Scene.prototype.startMovement = function(fn, done) {

  var renderLoop = this._viewer.renderLoop();

  if (this._movement) {
    this.stopMovement();
  }

  var step = fn();
  if (typeof step !== 'function') {
    throw new Error('Bad movement');
  }

  this._movement = fn;
  this._movementStep = step;
  this._movementStartTime = clock();
  this._movementParams = {};
  this._movementCallback = done;

  renderLoop.addEventListener('beforeRender', this._updateMovementHandler);
  renderLoop.renderOnNextFrame();
};


/**
 * Stop the current movement.
 */
Scene.prototype.stopMovement = function() {

  var renderLoop = this._viewer.renderLoop();

  if (this._movementCallback) {
    this._movementCallback();
  }

  renderLoop.removeEventListener('beforeRender', this._updateMovementHandler);

  this._movement = null;
  this._movementStep = null;
  this._movementStartTime = null;
  this._movementParams = null;
  this._movementCallback = null;
};


/**
 * Return the current movement.
 * @return {Function}
 */
Scene.prototype.movement = function() {
  return this._movement;
};


Scene.prototype._updateMovement = function() {

  if (!this._movement) {
    throw new Error('Should not call update');
  }

  var renderLoop = this._viewer.renderLoop();
  var view = this._view;

  var elapsed = clock() - this._movementStartTime;
  var step = this._movementStep;
  var params = this._movementParams;

  params = view.parameters(params);
  params = step(params, elapsed);
  if (params == null) {
    this.stopMovement();
  } else {
    view.setParameters(params);
    renderLoop.renderOnNextFrame();
  }

};


Scene.prototype._updateHotspotContainer = function() {
  this._hotspotContainer.setRect(this._layers[0].effects().rect);

  if(this.visible()) {
    this._hotspotContainer.show();
  }
  else {
    this._hotspotContainer.hide();
  }
};


module.exports = Scene;
