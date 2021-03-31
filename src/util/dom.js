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


function prefixProperty(property) {

  var style = document.documentElement.style;
  var prefixList = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];

  for (var i = 0; i < prefixList.length; i++) {
    var prefix = prefixList[i];
    var capitalizedProperty = property[0].toUpperCase() + property.slice(1);
    var prefixedProperty = prefix + capitalizedProperty;

    if (prefixedProperty in style) {
      return prefixedProperty;
    }
  }

  return property;

}


function getWithVendorPrefix(property) {
  var prefixedProperty = prefixProperty(property);
  return function getPropertyWithVendorPrefix(element) {
    return element.style[prefixedProperty];
  };

}


function setWithVendorPrefix(property) {
  var prefixedProperty = prefixProperty(property);
  return function setPropertyWithVendorPrefix(element, val) {
    return (element.style[prefixedProperty] = val);
  };
}


var setTransform = setWithVendorPrefix('transform');
var setTransformOrigin = setWithVendorPrefix('transformOrigin');


function setNullTransform(element) {
  setTransform(element, 'translateZ(0)');
}


function setNullTransformOrigin(element) {
  setTransformOrigin(element, '0 0 0');
}


function setAbsolute(element) {
  element.style.position = 'absolute';
}


function setPixelPosition(element, x, y) {
  element.style.left = x + 'px';
  element.style.top = y + 'px';
}


function setPixelSize(element, width, height) {
  element.style.width = width + 'px';
  element.style.height = height + 'px';
}


function setNullSize(element) {
  element.style.width = element.style.height = 0;
}


function setFullSize(element) {
  element.style.width = element.style.height = '100%';
}


function setOverflowHidden(element) {
  element.style.overflow = 'hidden';
}


function setOverflowVisible(element) {
  element.style.overflow = 'visible';
}


function setNoPointerEvents(element) {
  element.style.pointerEvents = 'none';
}


function setBlocking(element) {
  element.style.backgroundColor = '#000';
  element.style.opacity = '0';
  element.style.filter = 'alpha(opacity=0)';
}


module.exports = {
  prefixProperty: prefixProperty,
  getWithVendorPrefix: getWithVendorPrefix,
  setWithVendorPrefix: setWithVendorPrefix,
  setTransform: setTransform,
  setTransformOrigin: setTransformOrigin,
  setNullTransform: setNullTransform,
  setNullTransformOrigin: setNullTransformOrigin,
  setAbsolute: setAbsolute,
  setPixelPosition: setPixelPosition,
  setPixelSize: setPixelSize,
  setNullSize: setNullSize,
  setFullSize: setFullSize,
  setOverflowHidden: setOverflowHidden,
  setOverflowVisible: setOverflowVisible,
  setNoPointerEvents: setNoPointerEvents,
  setBlocking: setBlocking
};
