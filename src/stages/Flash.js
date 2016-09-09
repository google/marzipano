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

var Stage = require('./Stage');
var flashSupported = require('../support/Flash');
var WorkQueue = require('../collections/WorkQueue');
var inherits = require('../util/inherits');
var defer = require('../util/defer');
var setAbsolute = require('../util/dom').setAbsolute;
var setFullSize = require('../util/dom').setFullSize;
var setBlocking = require('../util/dom').setBlocking;
var loadImageFlash = require('./loadImageFlash');

// Default Flash wmode.
var defaultWMode = 'transparent';

// Default Flash SWF path. By default, expect the SWF to be named marzipano.swf
// and located in the same directory as the current script. The default path
// may be overridden by passing the `swfPath` option into the Viewer or Stage
// constructor.
var defaultSwfPath = function() {
  var script = document.currentScript;
  if (!script) {
    // This will produce the wrong result if the current script is loaded with
    // the `async` or `defer` options, or exec'ed from a string. The user is
    // expected to supply a custom `swfPath` in these cases.
    var scripts = document.getElementsByTagName('script');
    script = scripts.length ? scripts[scripts.length-1] : null;
  }
  if (!script) {
    return null;
  }
  var path = script.src;
  var slash = path.lastIndexOf('/');
  if (slash >= 0) {
    path = path.slice(0, slash + 1);
  } else {
    path = '';
  }
  return path + 'marzipano.swf';
}();

// Callbacks must be exposed in a global object to be called from Flash.
// The global object maps each stage ID into the respective callbacks.
// To prevent multiple Marzipano instances from clobbering the callbacks
// for each other's stages, the next available stage ID must be shared among
// the instances. We cache this value in a special property of the global
// callback object.
var callbackObjectName = 'MarzipanoFlashCallbackMap';
if (!(callbackObjectName in window)) {
  window[callbackObjectName] = { __next: 0 };
}

// Get the next available Flash stage ID.
function nextFlashStageId() {
  return window[callbackObjectName].__next++;
}

// Names of the callbacks called from Flash. Presently there is only one.
var callbackNames = [ 'imageLoaded' ];

// Browser-specific workarounds.
var flashQuirks = {
  // How many repeated pixels to add around tile edges to suppress visible seams.
  padSize: 3
};

/**
 * @class
 * @classdesc A {@link Stage} implementation using Flash.
 * @extends Stage
 * @param {Object} opts
 * @param {String} [wmode='transparent'] Flash `wmode` property. Read
 *   [this](http://helpx.adobe.com/flash/kb/flash-object-embed-tag-attributes.html)
 *   for more information.
 * @param {String} swfPath Path to the SWF file. By default, the SWF is
 *   assumed to be named `marzipano.swf` and located in the same directory
 *   as `marzipano.js`.
 */
function FlashStage(opts) {
  this.constructor.super_.call(this, opts);

  this._wmode = opts && opts.wmode || defaultWMode;
  this._swfPath = opts && opts.swfPath || defaultSwfPath;

  if (!defaultSwfPath) {
    throw new Error('Missing SWF path');
  }

  // Setup JavaScript callbacks to be called from Flash land when
  // asynchronous operations terminate.
  this._flashStageId = nextFlashStageId();
  this._callbacksObj = window[callbackObjectName][this._flashStageId] = {};
  this._stageCallbacksObjVarName = callbackObjectName + '[' + this._flashStageId + ']';
  this._callbackListeners = {};
  for (var i = 0; i < callbackNames.length; i++) {
    this._callbacksObj[callbackNames[i]] = this._callListeners(callbackNames[i]);
  }

  // Queue for loadImage calls.
  // The queue starts paused so that loadImage calls occurring before Flash
  // is ready do not start right away (as they would fail).
  this._loadImageQueue = new WorkQueue();
  this._loadImageQueue.pause();

  // Whether flash is ready to be called from JavaScript.
  this._flashReady = false;

  // Add an ID to each renderer/layer, so that it can be identified within
  // the ActionScript program.
  this._nextLayerId = 0;

  // Create the DOM elements.
  var elements = createDomElements(this._swfPath, this._flashStageId, this._stageCallbacksObjVarName);
  this._domElement = elements.root;
  this._blockingElement = elements.blocking;
  this._flashElement = elements.flash;

  // Wake up the render loop when we are ready (only after element is added to the DOM)
  this._checkReadyTimer = setInterval(this._checkReady.bind(this), 50);
}

inherits(FlashStage, Stage);


FlashStage.prototype.destroy = function() {

  this.constructor.super_.prototype.destroy.call(this);

  this._domElement = null;
  this._blockingElement = null;
  this._flashElement = null;
  window[callbackObjectName][this._flashStageId] = null;
  this._callbacksObj = null;
  this._loadImageQueue = null;
  clearInterval(this._checkReadyTimer);

};


FlashStage.supported = function() {
  return flashSupported();
};


FlashStage.prototype._setSize = function() {};


FlashStage.prototype.loadImage = function(tile, rect, done) {
  var loadFn = loadImageFlash.bind(null, this, tile, rect);
  return this._loadImageQueue.push(loadFn, done);
};


FlashStage.prototype._validateLayer = function(layer) {
  return;
};


FlashStage.prototype._onCallback = function(callbackName, f) {
  this._callbackListeners[callbackName] = this._callbackListeners[callbackName] || [];
  this._callbackListeners[callbackName].push(f);
};


FlashStage.prototype._offCallback = function(callbackName, f) {
  var listeners = this._callbackListeners[callbackName] || [];
  var index = listeners.indexOf(f);
  if(index >= 0) {
    listeners.splice(index, 1);
  }
};


FlashStage.prototype._callListeners = function(callbackName) {

  var self = this;

  return function callListeners() {
    var listeners = self._callbackListeners[callbackName] || [];
    for (var i = 0; i < listeners.length; i++) {
      // JavaScript executed on calls from Flash does not throw exceptions.
      // Executing the callback in a new stack frame fixes this.
      var listener = listeners[i];
      defer(listener, arguments);
    }
  };
};


FlashStage.prototype._checkReady = function() {
  var isReady = this._flashElement.isReady;
  if (!isReady || !isReady()) {
    // Not ready yet.
    return false;
  }

  // Mark as ready.
  this._flashReady = true;

  // Disable interval timer.
  clearTimeout(this._checkReadyTimer);

  // Resume image loading queue.
  this._loadImageQueue.resume();

  // Force next render.
  this.emitRenderInvalid();

  return true;
};


function createDomElements(swfPath, id, stageCallbacksObjVarName) {
  var rootElement = document.createElement('div');
  setAbsolute(rootElement);
  setFullSize(rootElement);

  // The Flash object must have `id` and `name` attributes, otherwise
  // ExternalInterface calls will not work.
  var elementId = "marzipano-flash-stage-" + id;

  var objectStr = '<object id="' + elementId + '" name="' + elementId + '" type="application/x-shockwave-flash" data="' + swfPath + '">';

  var paramsStr = '';
  paramsStr += '<param name="movie" value="' + swfPath + '" />';
  paramsStr += '<param name="allowscriptaccess" value="always" />';
  paramsStr += '<param name="flashvars" value="callbacksObjName=' + stageCallbacksObjVarName + '" />';
  paramsStr += '<param name="wmode" value="transparent" />';

  objectStr += paramsStr;
  objectStr += '</object>';

  // Embed Flash into the DOM.
  // Adding children into an <object> element doesn't work, so we create a
  // temporary element and set its innerHTML.
  var tmpElement = document.createElement('div');
  tmpElement.innerHTML = objectStr;
  var flashElement = tmpElement.firstChild;
  setAbsolute(flashElement);
  setFullSize(flashElement);
  rootElement.appendChild(flashElement);

  // Create blocking element to prevent events from being caught by Flash.
  var blockingElement = document.createElement('div');
  setAbsolute(blockingElement);
  setFullSize(blockingElement);
  setBlocking(blockingElement);
  rootElement.appendChild(blockingElement);

  return { root: rootElement, flash: flashElement, blocking: blockingElement };
}


FlashStage.prototype.createRenderer = function(Renderer) {
  return new Renderer(this._flashElement, ++this._nextLayerId, flashQuirks);
};


FlashStage.prototype.destroyRenderer = function(renderer) {
  renderer.destroy();
};


FlashStage.prototype.startFrame = function() {};


FlashStage.prototype.endFrame = function() {};


FlashStage.type = FlashStage.prototype.type = 'flash';


function FlashTexture(stage, tile, asset) {

  // Get image id.
  var imageId = asset.element();

  // Get tile dimensions.
  var tileWidth = tile.width();
  var tileHeight = tile.height();

  // Get padding sizes.
  var padSize = flashQuirks.padSize;
  var padTop = tile.padTop() ? padSize : 0;
  var padBottom = tile.padBottom() ? padSize : 0;
  var padLeft = tile.padLeft() ? padSize : 0;
  var padRight = tile.padRight() ? padSize : 0;

  var textureId = stage._flashElement.createTexture(imageId, tileWidth, tileHeight, padTop, padBottom, padLeft, padRight);

  this._stage = stage;
  this._textureId = textureId;
}


FlashTexture.prototype.refresh = function(tile, asset) {
  // TODO: This is required for the Flash stage to support dynamic textures.
  // However, there are currently no dynamic textures that work with the
  // Flash stage.
};


FlashTexture.prototype.destroy = function() {
  var textureId = this._textureId;
  var stage = this._stage;
  stage._flashElement.destroyTexture(textureId);
  this._stage = null;
  this._textureId = null;
};


FlashStage.TextureClass = FlashStage.prototype.TextureClass = FlashTexture;


module.exports = FlashStage;
