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

var RenderLoop = require('./RenderLoop');
var Controls = require('./controls/Controls');
var Layer = require('./Layer');
var TextureStore = require('./TextureStore');

var Scene = require('./Scene');

var Timer = require('./Timer');

var WebGlStage = require('./stages/WebGl');
var CssStage = require('./stages/Css');
var FlashStage = require('./stages/Flash');

var registerDefaultControls = require('./controls/registerDefaultControls');
var registerDefaultRenderers = require('./renderers/registerDefaultRenderers');

var setOverflowHidden = require('./util/dom').setOverflowHidden;
var setAbsolute = require('./util/dom').setAbsolute;
var setFullSize = require('./util/dom').setFullSize;
var setBlocking = require('./util/dom').setBlocking;

var tween = require('./util/tween');
var noop = require('./util/noop');

var DragCursor = require('./controls/DragCursor');

var HammerGestures = require('./controls/HammerGestures');

var stageMap = {
  webgl: WebGlStage,
  css: CssStage,
  flash: FlashStage
};

var stagePrefList = [
  WebGlStage,
  CssStage,
  FlashStage
];

// TODO: it might make sense to support multiple scenes to be visible at the
// same time, which would allow e.g. overlapping effects with transparency.

/**
 * Signals that the current scene has changed.
 * @event Viewer#sceneChange
 */

/**
 * Signals that the view of the current scene has changed. See
 * {@link View#event:change}.
 * @event Viewer#viewChange
 */

/**
 * @class
 * @classdesc A Viewer is a single-{@link Stage stage} container for multiple
 * {@link Scene scenes}.
 * @param {HTMLElement} domElement the HTML element inside which the viewer
 *        should be initialized.
 * @param {Object} opts
 * @param {(null|'webgl'|'css'|'flash')} opts.stageType stage type to use.
 * @param {Object} opts.controls options to be passed to
 * {@link registerDefaultControls}.
 * @param {Object} opts.stage options to be passed to the {@link Stage}
 * constructor.
 */
function Viewer(domElement, opts) {

  opts = opts || {};

  this._domElement = domElement;

  // Add `overflow: hidden` to the domElement.
  setOverflowHidden(domElement);

  // Select the stage type to use.
  var Stage;
  if (opts.stageType) {
    // If a specific stage type was specified, use that one.
    Stage = stageMap[opts.stageType];
    if (!Stage) {
      throw new Error('Unknown stage type: ' + opts.stageType);
    }
  } else {
    // Choose the best supported stage according to the default preference
    // order. Note that this may yield an unsupported stage for some
    // geometry/view combinations. Client code is expected to pass in a
    // specific stage type in those cases.
    for (var i = 0; i < stagePrefList.length; i++) {
      if (stagePrefList[i].supported()) {
        Stage = stagePrefList[i];
        break;
      }
    }
    if (!Stage) {
      throw new Error('None of the stage types are supported');
    }
  }

  // Create stage.
  this._stage = new Stage(opts.stage);

  // Register the default renderers for the selected stage.
  registerDefaultRenderers(this._stage);

  // Add the stage element into the DOM.
  this._domElement.appendChild(this._stage.domElement());

  // Create control container.
  // Controls cannot be placed directly on the root DOM element because
  // Hammer.js will prevent click events from reaching the elements beneath.

  // The hotspot containers will be added inside the controls container.
  this._controlContainer = document.createElement('div');
  setAbsolute(this._controlContainer);
  setFullSize(this._controlContainer);

  // Prevent bounce scroll effect on iOS.
  this._controlContainer.addEventListener('touchstart', function(event) {
    event.preventDefault();
  });

  // Old IE does not detect mouse events on elements without background
  // Add a child element to the controls with full width, a background color
  // and opacity 0
  var controlCapture = document.createElement('div');
  setAbsolute(controlCapture);
  setFullSize(controlCapture);
  setBlocking(controlCapture);

  this._controlContainer.appendChild(controlCapture);
  domElement.appendChild(this._controlContainer);

  // Respond to window size changes.
  this._size = {};
  this.updateSize();
  this._updateSizeListener = this.updateSize.bind(this);
  window.addEventListener('resize', this._updateSizeListener);

  // Create render loop.
  this._renderLoop = new RenderLoop(this._stage);

  // Create the controls and register them with the render loop.
  this._controls = new Controls();
  this._controlMethods = registerDefaultControls(this._controls, this._controlContainer, opts.controls);
  this._controls.attach(this._renderLoop);

  // Expose HammerJS.
  this._hammerManagerTouch = HammerGestures.get(this._controlContainer, 'touch');
  this._hammerManagerMouse = HammerGestures.get(this._controlContainer, 'mouse');

  // Initialize mouse cursor.
  opts.cursors = opts.cursors || {};
  this._dragCursor = new DragCursor(this._controls, 'mouseViewDrag', domElement, opts.cursors.drag);

  // Start the render loop.
  this._renderLoop.start();

  // Scene list.
  this._scenes = [];

  // The currently visible scene.
  this._scene = null;

  // The current transition.
  this._cancelCurrentTween = null;

  // The event listener fired when the current view changes.
  // This is attached to the correct view whenever the current scene changes.
  this._viewChangeHandler = this.emit.bind(this, 'viewChange');

  // Setup the idle timer.
  // By default, the timer has an infinite duration so it does nothing.
  this._idleTimer = new Timer();
  this._idleTimer.start();

  // Reset the timer whenever the view changes.
  this._resetIdleTimerHandler = this._resetIdleTimer.bind(this);
  this.addEventListener('viewChange', this._resetIdleTimerHandler);

  // Start the idle movement when the idle timer fires.
  this._enterIdleHandler = this._enterIdle.bind(this);
  this._idleTimer.addEventListener('timeout', this._enterIdleHandler);

  // Stop the idle movement when the controls are activated or when the
  // scene changes.
  this._leaveIdleHandler = this._leaveIdle.bind(this);
  this._controls.addEventListener('active', this._leaveIdleHandler);
  this.addEventListener('sceneChange', this._leaveIdleHandler);

  // The currently programmed idle movement.
  this._idleMovement = null;
}

eventEmitter(Viewer);


/**
 * Destructor.
 */
Viewer.prototype.destroy = function() {

  window.removeEventListener('resize', this._updateSizeListener);
  this._updateSizeListener = null;
  this._size = null;

  if (this._scene) {
    this._scene.view().removeEventListener('change', this._viewChangeHandler);
  }
  this._viewChangeHandler = null;

  for (var methodName in this._controlMethods) {
    this._controlMethods[methodName].destroy();
  }
  this._controlMethods = null;

  while (this._scenes.length) {
    this.destroyScene(this._scenes[0]);
  }

  this._scenes = null;
  this._scene = null;

  // The Flash renderer must be torn down before the element is removed from
  // the DOM, so all scenes must have been destroyed before this point.
  this._domElement.removeChild(this._stage.domElement());

  this._stage.destroy();
  this._stage = null;

  this._renderLoop.destroy();
  this._renderLoop = null;

  this._controls.destroy();
  this._controls = null;

  if (this._cancelCurrentTween) {
    this._cancelCurrentTween();
    this._cancelCurrentTween = null;
  }

  this._domElement = null;
  this._controlContainer = null;

};


/**
 * Update the stage size to fill the containing element.
 *
 * This method is automatically called when the browser window is resized.
 * Most clients won't need to explicitly call it to keep the size up to date.
 */
Viewer.prototype.updateSize = function() {
  var size = this._size;
  size.width = this._domElement.clientWidth;
  size.height = this._domElement.clientHeight;
  this._stage.setSize(size);
};


/**
 * Return the underlying {@link Stage}.
 * @return {Stage}
 */
Viewer.prototype.stage = function() {
  return this._stage;
};


/**
 * Return the underlying {@link RenderLoop}.
 * @return {RenderLoop}
 */
Viewer.prototype.renderLoop = function() {
  return this._renderLoop;
};


/**
 * Return the underlying {@link Controls}.
 * @return {Controls}
 */
Viewer.prototype.controls = function() {
  return this._controls;
};


/**
 * Return the underlying DOM element.
 * @return {Element}
 */
Viewer.prototype.domElement = function() {
  return this._domElement;
};


/**
 * Create a new {@link Scene scene}.
 * @param {Object} opts
 * @param {Source} opts.source The underlying {@link Source}.
 * @param {Geometry} opts.geometry The underlying +{@link Geometry}.
 * @param {View} opts.view The underlying {@link View}.
 * @param {boolean} opts.pinFirstLevel Pin the first level to provide a
 *        last-resort fallback at the cost of memory consumption.
 * @param {Object} opts.textureStore Options to pass to the {@link TextureStore}
 *        constructor.
 * @param {Object} opts.layerOpts Options to pass to the {@link Layer}
 *        constructor.
 * @return {Scene}
 */
Viewer.prototype.createScene = function(opts) {
  // TODO: set textureStore size to 0 for video scenes somehow?

  opts = opts || {};

  var stage = this._stage;

  var source = opts.source;
  var geometry = opts.geometry;
  var view = opts.view;
  var textureStore = new TextureStore(geometry, source, stage, opts.textureStore);

  var layer = new Layer(stage, source, geometry, view, textureStore, opts.layerOpts);

  if (opts.pinFirstLevel) {
    layer.pinFirstLevel();
  }

  var scene = new Scene(this, layer);
  this._scenes.push(scene);

  return scene;
};


Viewer.prototype._addLayer = function(layer) {
  // Pin the first level to serve as a last-resort fallback.
  layer.pinFirstLevel();
  this._stage.addLayer(layer);
};


Viewer.prototype._removeLayer = function(layer) {
  if (this._stage.hasLayer(layer)) {
    layer.unpinFirstLevel();
    this._stage.removeLayer(layer);
  }
  layer.textureStore().clearNotPinned();
};


/**
 * Destroy a {@link Scene}.
 * @param {Scene} scene
 */
Viewer.prototype.destroyScene = function(scene) {
  var i = this._scenes.indexOf(scene);
  if (i < 0) {
    throw new Error('No such scene in viewer');
  }

  this._removeLayer(scene._layer);

  if (this._scene === scene) {
    this._scene = null;
    if(this._cancelCurrentTween) {
      this._cancelCurrentTween();
      this._cancelCurrentTween = null;
    }
  }
  this._scenes.splice(i, 1);

  var layer = scene._layer;
  var textureStore = layer.textureStore();

  scene._destroy();
  layer.destroy();
  textureStore.destroy();
};


/**
 * Destroy all {@link Scene scenes}.
 */
Viewer.prototype.destroyAllScenes = function() {
  while (this._scenes.length > 0) {
    this.destroyScene(this._scenes[0]);
  }
};


/**
 * Return whether the viewer contains a {@link Scene scene}.
 * @param {Scene} scene
 * @return {boolean}
 */
Viewer.prototype.hasScene = function(scene) {
  return this._scenes.indexOf(scene) >= 0;
};


/**
 * Get a list of all {@link Scene scenes}.
 * @return {Scene[]}
 */
Viewer.prototype.listScenes = function() {
  return [].concat(this._scenes);
};


/**
 * Get the current {@link Scene scene}, i.e., the last scene for which
 * {@link Viewer#switchScene} was called.
 * @return {Scene}
 */
Viewer.prototype.scene = function() {
  return this._scene;
};


/**
 * Get the {@link View view} for the current {@link Scene scene}, as would be
 * obtained by calling {@link Scene#view}.
 * @return {View}
 */
Viewer.prototype.view = function() {
  var scene = this._scene;
  if (scene) {
    return scene.layer().view();
  }
  return null;
};


/**
 * Tween the {@link View view} for the current {@link Scene scene}, as would be
 * obtained by calling {@link Scene#lookTo}.
 */
Viewer.prototype.lookTo = function(params, opts, done) {
  // TODO: is it an error to call lookTo when no scene is displayed?
  var scene = this._scene;
  if (scene) {
    scene.lookTo(params, opts, done);
  }
};


/**
 * Start a movement, as would be obtained by calling {@link Scene#startMovement}
 * on the current scene.
 */
Viewer.prototype.startMovement = function(fn, cb) {
  // TODO: is it an error to call startMovement when no scene is displayed?
  var scene = this._scene;
  if (scene) {
    scene.startMovement(fn, cb);
  }
};


/**
 * Stop the current movement, as would be obtained by calling
 * {@link Scene#stopMovement} on the current scene.
 */
Viewer.prototype.stopMovement = function() {
  var scene = this._scene;
  if (scene) {
    scene.stopMovement();
  }
};


/**
 * Schedule an automatic movement to be started when the view remains unchanged
 * for the given timeout period.
 * @param {Number} timeout Timeout period in milliseconds.
 * @param {Function} movement Automatic movement function, or null to disable.
 */
Viewer.prototype.setIdleMovement = function(timeout, movement) {
  this._idleTimer.setDuration(timeout);
  this._idleMovement = movement;
};


/**
  * Stop the idle movement. It will be started again after the timeout set by
  * {@link Viewer#setIdleMovement}.
  */
Viewer.prototype.breakIdleMovement = function() {
  this._leaveIdle();
  this._resetIdleTimer();
};


Viewer.prototype._resetIdleTimer = function() {
  this._idleTimer.reset();
};


Viewer.prototype._enterIdle = function() {
  var scene = this._scene;
  var idleMovement = this._idleMovement;
  if (!scene || !idleMovement) {
    return;
  }
  scene.startMovement(idleMovement);
};


Viewer.prototype._leaveIdle = function() {
  var scene = this._scene;
  if (!scene) {
    return;
  }
  if (scene.movement() === this._idleMovement) {
    scene.stopMovement();
  }
};


var defaultSwitchDuration = 1000;

function defaultTransitionUpdate(val, newScene, oldScene) {
  newScene.layer().mergeEffects({ opacity: val });
  newScene._hotspotContainer.domElement().style.opacity = val;
}


/**
 * Switch to another {@link Scene scene} with a fade transition.
 * @param {Scene} newScene The scene to switch to.
 * @param {Object} opts
 * @param {Number} [opts.transitionDuration=1000]
 *        Transition duration in milliseconds.
 * @param {Number} [opts.transitionUpdate=defaultTransitionUpdate]
 *        Transition function with signature `f(t, newScene, oldScene)`.
 *        The function is called on each frame with `t` increasing from 0 to 1.
 *        An initial call with `t=0` and a final call with `t=1` are guaranteed.
 *        The default function sets the scene opacity to `t`.
 * @param {Function} done Called when the transition finishes or is interrupted.
 */
Viewer.prototype.switchScene = function(newScene, opts, done) {
  opts = opts || {};
  done = done || noop;

  var stage = this._stage;

  var oldScene = this._scene;

  // Do nothing if the target scene is the current one.
  if (oldScene === newScene) {
    done();
    return;
  }

  if (this._scenes.indexOf(newScene) < 0) {
    throw new Error('No such scene in viewer');
  }

  // Consistency check.
  var layerList = stage.listLayers();
  if (oldScene && oldScene.layer() !== layerList[layerList.length - 1]) {
    throw new Error('Stage not in sync with viewer');
  }

  // Cancel ongoing transition, if any.
  if (this._cancelCurrentTween) {
    this._cancelCurrentTween();
    this._cancelCurrentTween = null;
  }


  // Setup the transition
  var duration = opts.transitionDuration != null ? opts.transitionDuration : defaultSwitchDuration;
  var update = opts.transitionUpdate != null ? opts.transitionUpdate : defaultTransitionUpdate;

  var self = this;

  // Start by adding the new layer
  self._addLayer(newScene.layer());

  // Call provided update function
  function tweenUpdate(val) {
    update(val, newScene, oldScene);
  }

  // Remove old layer when tween is complete
  function tweenDone() {
    if(oldScene) {
      self._removeLayer(oldScene.layer());
    }
    //Remove tween to ensure objects referenced on callbacks are garbage collected
    self._cancelCurrentTween = null;
    done();
  }

  this._cancelCurrentTween = tween(duration, tweenUpdate, tweenDone);

  // Update current scene.
  this._scene = newScene;

  // Emit scene and view change events.
  this.emit('sceneChange');
  this.emit('viewChange');

  // Listen to the view change events for the new scene.
  if (oldScene) {
    oldScene.view().removeEventListener('change', this._viewChangeHandler);
  }
  newScene.view().addEventListener('change', this._viewChangeHandler);

};


module.exports = Viewer;
