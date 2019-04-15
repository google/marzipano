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
var FlashImageLoader = require('../loaders/FlashImage');
var flashSupported = require('../support/Flash');
var WorkQueue = require('../collections/WorkQueue');
var inherits = require('../util/inherits');
var defer = require('../util/defer');
var setAbsolute = require('../util/dom').setAbsolute;
var setFullSize = require('../util/dom').setFullSize;
var setBlocking = require('../util/dom').setBlocking;
var clearOwnProperties = require('../util/clearOwnProperties');

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
 * @class FlashStage
 * @extends Stage
 * @classdesc
 *
 * A {@link Stage} implementation using Flash.
 *
 * @param {Object} opts
 * @param {string} [opts.wmode='transparent']
 * @param {string} [opts.swfPath]
 *
 * The `wmode` option controls transparency, layering and compositing of the
 * Flash element into the web page. For more information see:
 * http://helpx.adobe.com/flash/kb/flash-object-embed-tag-attributes.html
 *
 * The `swfPath` option denotes the path to the `marzipano.swf` file. It
 * defaults to the location of `marzipano.js` by looking for a script tag with
 * that name.
 *
 * Also see the available {@link Stage} options.
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

  this._loader = new FlashImageLoader(this);

  // Queue for loadImage calls.
  // The queue starts paused so that loadImage calls occurring before Flash
  // is ready do not start right away (as they would fail).
  // TODO: This is awkward. The stage must signal that it's ready to load
  // images, but queuing should otherwise be implemented by the loader.
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


/**
 * Destructor.
 */
FlashStage.prototype.destroy = function() {
  window[callbackObjectName][this._flashStageId] = null;
  if (this._checkReadyTimer != null) {
    clearInterval(this._checkReadyTimer);
  }
  // Delegate clearing own properties to the Stage destructor.
  this.constructor.super_.prototype.destroy.call(this);
};


FlashStage.supported = function() {
  return flashSupported();
};


/**
 * Returns the underlying DOM element.
 * @return {Element}
 */
FlashStage.prototype.domElement = function() {
  return this._domElement;
};


/**
 * Returns the underlying Flash element.
 * @return {Element}
 */
FlashStage.prototype.flashElement = function() {
  return this._flashElement;
};


FlashStage.prototype.setSizeForType = function() {};


FlashStage.prototype.loadImage = function(url, rect, done) {
  // TODO: Move the queuing into the loader, which avoids this nonsense.
  var loadFn = this._loader.loadImage.bind(this._loader, url, rect);
  return this._loadImageQueue.push(loadFn, done);
};


FlashStage.prototype.validateLayer = function(layer) {
  return; // always valid
};


FlashStage.prototype.addFlashCallbackListener = function(callbackName, f) {
  this._callbackListeners[callbackName] = this._callbackListeners[callbackName] || [];
  this._callbackListeners[callbackName].push(f);
};


FlashStage.prototype.removeFlashCallbackListener = function(callbackName, f) {
  var listeners = this._callbackListeners[callbackName] || [];
  var index = listeners.indexOf(f);
  if (index >= 0) {
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
  if (!this._flashElement ||
      !this._flashElement.isReady ||
      !this._flashElement.isReady()) {
    // Not ready yet.
    return false;
  }

  // Mark as ready.
  this._flashReady = true;

  // Disable interval timer.
  clearTimeout(this._checkReadyTimer);
  this._checkReadyTimer = null;

  // Resume image loading queue.
  this._loadImageQueue.resume();

  // Force next render.
  this.emit('renderInvalid');

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


FlashStage.prototype.takeSnapshot = function (options) {
  // Validate argument.
  if (typeof options !== 'object' || options == null) {
    options = {};
  }

  var quality = options.quality;

  // Set default quality if it is not passed in.
  if (typeof quality == 'undefined') {
    quality = 75;
  }

  // Throw if quality is of invlid type or out of bounds.
  if (typeof quality !== 'number' || quality < 0 || quality > 100) {
    throw new Error('FlashStage: Snapshot quality needs to be a number between 0 and 100');
  }

  // Return the snapshot by executing a flash-exported method.
  return this._flashElement.takeSnapshot(quality);
};


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
  this._stage._flashElement.destroyTexture(this._textureId);
  clearOwnProperties(this);
};


FlashStage.TextureClass = FlashStage.prototype.TextureClass = FlashTexture;


module.exports = FlashStage;
