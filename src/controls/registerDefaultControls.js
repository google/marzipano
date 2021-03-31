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
var DragControlMethod = require('./Drag');
var QtvrControlMethod = require('./Qtvr');
var ScrollZoomControlMethod = require('./ScrollZoom');
var PinchZoomControlMethod = require('./PinchZoom');
var KeyControlMethod = require('./Key');

var defaultOptions = {
  mouseViewMode: 'drag'
};

/**
 * Instantiate and register some commonly used {@link ControlMethod} instances.
 *
 * The following instances are registered:
 *   - mouseViewDrag
 *   - mouseViewQtvr
 *   - touchView
 *   - pinch
 *   - arrowKeys
 *   - plusMinusKeys
 *   - wasdKeys
 *   - qeKeys
 *
 * @param {Controls} controls Where to register the instances.
 * @param {Element} element Element to listen for events.
 * @param {Object} opts
 * @param {'drag'|'qtvr'} mouseViewMode
 */
function registerDefaultControls(controls, element, opts) {
  opts = defaults(opts || {}, defaultOptions);

  var controlMethods = {
    mouseViewDrag: new DragControlMethod(element, 'mouse'),
    mouseViewQtvr: new QtvrControlMethod(element, 'mouse'),
    touchView: new DragControlMethod(element, 'touch'),
    pinch: new PinchZoomControlMethod(element, 'touch'),

    leftArrowKey: new KeyControlMethod(37, 'x', -0.7, 3),
    rightArrowKey: new KeyControlMethod(39, 'x', 0.7, 3),
    upArrowKey: new KeyControlMethod(38, 'y', -0.7, 3),
    downArrowKey: new KeyControlMethod(40, 'y', 0.7, 3),
    plusKey: new KeyControlMethod(107, 'zoom', -0.7, 3),
    minusKey: new KeyControlMethod(109, 'zoom', 0.7, 3),

    wKey: new KeyControlMethod(87, 'y', -0.7, 3),
    aKey: new KeyControlMethod(65, 'x', -0.7, 3),
    sKey: new KeyControlMethod(83, 'y', 0.7, 3),
    dKey: new KeyControlMethod(68, 'x', 0.7, 3),
    qKey: new KeyControlMethod(81, 'roll', 0.7, 3),
    eKey: new KeyControlMethod(69, 'roll', -0.7, 3)
  };

  if(opts.scrollZoom !== false) {
    controlMethods.scrollZoom = new ScrollZoomControlMethod(element); //{ frictionTime: 0 }
  }

  var controlMethodGroups = {
    arrowKeys: [ 'leftArrowKey', 'rightArrowKey', 'upArrowKey', 'downArrowKey' ],
    plusMinusKeys: [ 'plusKey', 'minusKey' ],
    wasdKeys: [ 'wKey', 'aKey', 'sKey', 'dKey' ],
    qeKeys: [ 'qKey', 'eKey' ]
  };


  var enabledControls = [ 'scrollZoom', 'touchView', 'pinch' ];
  switch (opts.mouseViewMode) {
    case 'drag':
      enabledControls.push('mouseViewDrag');
      break;
    case 'qtvr':
      enabledControls.push('mouseViewQtvr');
      break;
    default:
      throw new Error("Unknown mouse view mode: " + opts.mouseViewMode);
  }

  for (var id in controlMethods) {
    var method = controlMethods[id];
    controls.registerMethod(id, method);
    if (enabledControls.indexOf(id) >= 0) {
      controls.enableMethod(id);
    }
  }

  for (var groupId in controlMethodGroups) {
    var methodGroup = controlMethodGroups[groupId];
    controls.addMethodGroup(groupId, methodGroup);
  }

  return controlMethods;
}

module.exports = registerDefaultControls;