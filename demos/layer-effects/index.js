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

// Create viewer.
// WebGL support is required to showcase the transformation effects.
var viewerOpts = { stageType: 'webgl' };
var viewer = new Marzipano.Viewer(document.getElementById('pano'), viewerOpts);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(2048, 120*Math.PI/180);
var view = new Marzipano.RectilinearView(null, limiter);

// Create an empty scene into which layers will be added.
var scene = viewer.createEmptyScene({ view: view });

// Query the stage for the maximum supported texture size.
var maxSize = viewer.stage().maxTextureSize();
var maxDimensions = maxSize + 'x' + maxSize;

// Create a knockout.js observable array to hold the layers.
var layers = ko.observableArray([]);

// Set up the user interface for importing layers.
var selectFilesInput = document.getElementById('selectFilesInput');
selectFilesInput.addEventListener('change', function() {
  if (this.files && this.files.length > 0) {
    for (var i = 0; i < this.files.length; i++) {
      importLayer(this.files[i]);
    }
  }
  this.value = null;
});
var selectFilesButton = document.getElementById('selectFilesButton');
selectFilesButton.addEventListener('click', function() {
  selectFilesInput.click();
});

// Convert an image file into a canvas.
function fileToCanvas(file, done) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');
  img.onload = function() {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    done(null, canvas);
  };
  img.onerror = function(err) {
    done(err);
  };
  img.src = URL.createObjectURL(file);
}

// Import a canvas into a layer.
function importLayer(file) {
  fileToCanvas(file, function(err, canvas) {
    if (err) {
      alert('Unable to load image file.');
      return;
    }
    if (canvas.width > maxSize || canvas.height > maxSize) {
      alert('Image is too large. The maximum supported size is ' +
        maxSize + ' by ' + maxSize + ' pixels.');
      return;
    }

    // Create layer.
    var asset = new Marzipano.DynamicAsset(canvas);
    var source = new Marzipano.SingleAssetSource(asset);
    var geometry = new Marzipano.EquirectGeometry([{ width: canvas.width }]);
    var layer = scene.createLayer({
      source: source,
      geometry: geometry
    });

    // Create a new effects object for the layer.
    var effects = layerEffects(layer);

    // Add layer into the view model.
    layers.unshift({
      name: file.name,
      layer: layer,
      effects: effects,
      canvas: canvas
    });
  });
}

// Discard an existing layer.
function discardLayer(item) {
  if (confirm('Remove this layer?')) {
    scene.destroyLayer(item.layer);
    layers.remove(item);
  }
}

// Create an observable object with the layer effects.
function layerEffects(layer) {
  var i, j, o;

  var opacity = ko.observable(1.0);
  var rect = {
    width: ko.observable(1.0),
    height: ko.observable(1.0),
    x: ko.observable(0.0),
    y: ko.observable(0.0)
  };

  var colorOffset = [];
  for (i = 0; i < 4; i++) {
    o = ko.observable(0);
    colorOffset.push(o);
    o.subscribe(updateEffects);
  }

  var colorMatrix = [];
  for (i = 0; i < 4; i++) {
    for (j = 0; j < 4; j++) {
      o = ko.observable(i === j ? 1 : 0);
      colorMatrix.push(o);
      o.subscribe(updateEffects);
    }
  }

  opacity.subscribe(updateEffects);
  rect.width.subscribe(updateEffects);
  rect.height.subscribe(updateEffects);
  rect.x.subscribe(updateEffects);
  rect.y.subscribe(updateEffects);

  function updateEffects() {
    layer.setEffects({
      opacity: opacity(),
      rect: {
        relativeWidth: rect.width(),
        relativeHeight: rect.height(),
        relativeY: rect.y(),
        relativeX: rect.x()
      },
      colorOffset: observableArrayFloatValues(colorOffset),
      colorMatrix: observableArrayFloatValues(colorMatrix)
    });
  }

  var presets = [ 'brightness', 'sepia', 'saturation', 'contrast' ];
  var selectedPreset = ko.observable();

  var brightnessAmount = ko.observable(0);
  var sepiaAmount = ko.observable(1);
  var saturationAmount = ko.observable(0);
  var contrastAmount = ko.observable(1);

  brightnessAmount.subscribe(function(amount) {
    colorEffectsToObservables(colorEffects.brightness(parseFloat(amount)));
  });
  sepiaAmount.subscribe(function(amount) {
    colorEffectsToObservables(colorEffects.sepia(parseFloat(amount)));
  });
  saturationAmount.subscribe(function(amount) {
    colorEffectsToObservables(colorEffects.saturation(parseFloat(amount)));
  });
  contrastAmount.subscribe(function(amount) {
    colorEffectsToObservables(colorEffects.contrast(parseFloat(amount)));
  });

  selectedPreset.subscribe(function(preset) {
    switch (preset) {
      case 'brightness':
        brightnessAmount.notifySubscribers(parseFloat(brightnessAmount()));
        break;
      case 'sepia':
        sepiaAmount.notifySubscribers(parseFloat(sepiaAmount()));
        break;
      case 'saturation':
        saturationAmount.notifySubscribers(parseFloat(saturationAmount()));
        break;
      case 'contrast':
        contrastAmount.notifySubscribers(parseFloat(contrastAmount()));
        break;
    }
  });

  function colorEffectsToObservables(effects) {
    var i;
    for (i = 0; i < 4; i++) {
      colorOffset[i](effects.colorOffset[i]);
    }
    for (i = 0; i < 16; i++) {
      colorMatrix[i](effects.colorMatrix[i]);
    }
  }

  function observableArrayFloatValues(arr) {
    return arr.map(function(o) {
      return parseFloat(o());
    });
  }

  return {
    opacity: opacity,
    rect: rect,
    colorOffset: colorOffset,
    colorMatrix: colorMatrix,
    presets: presets,
    selectedPreset: selectedPreset,
    brightnessAmount: brightnessAmount,
    sepiaAmount: sepiaAmount,
    saturationAmount: saturationAmount,
    contrastAmount: contrastAmount
  };

}

// Display the initially empty scene.
scene.switchTo({ transitionDuration: 0 });

var viewModel = {
  layers: layers,
  discardLayer: discardLayer,
  maxDimensions: maxDimensions
};

ko.bindingHandlers.element = {
    init: function(element, valueAccessor) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(valueAccessor());
    }
};

ko.applyBindings(viewModel);
