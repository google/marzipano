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

function prefixProperty(property: string) {

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


function getWithVendorPrefix(property: string) {
  var prefixedProperty = prefixProperty(property);
  return function getPropertyWithVendorPrefix(element: { style: { [x: string]: any; }; }) {
    return element.style[prefixedProperty];
  };

}


function setWithVendorPrefix(property: string) {
  var prefixedProperty = prefixProperty(property);
  return function setPropertyWithVendorPrefix(element: { style: { [x: string]: any; }; }, val: any) {
    return (element.style[prefixedProperty] = val);
  };
}


var setTransform = setWithVendorPrefix('transform');
var setTransformOrigin = setWithVendorPrefix('transformOrigin');


function setNullTransform(element: { style: { [x: string]: any; }; }) {
  setTransform(element, 'translateZ(0)');
}


function setNullTransformOrigin(element: { style: { [x: string]: any; }; }) {
  setTransformOrigin(element, '0 0 0');
}


function setAbsolute(element: { style: { position: string; }; }) {
  element.style.position = 'absolute';
}


function setPixelPosition(element: { style: { left: string; top: string; }; }, x: string, y: string) {
  element.style.left = x + 'px';
  element.style.top = y + 'px';
}


function setPixelSize(element: { style: { width: string; height: string; }; }, width: string, height: string) {
  element.style.width = width + 'px';
  element.style.height = height + 'px';
}


function setNullSize(element: { style: { width: number; height: number; }; }) {
  element.style.width = element.style.height = 0;
}


function setFullSize(element: { style: { width: string; height: string; }; }) {
  element.style.width = element.style.height = '100%';
}


function setOverflowHidden(element: { style: { overflow: string; }; }) {
  element.style.overflow = 'hidden';
}


function setOverflowVisible(element: { style: { overflow: string; }; }) {
  element.style.overflow = 'visible';
}


function setNoPointerEvents(element: { style: { pointerEvents: string; }; }) {
  element.style.pointerEvents = 'none';
}

// TODO: rethink these exports
export {
  prefixProperty,
  getWithVendorPrefix,
  setWithVendorPrefix,
  setTransform,
  setTransformOrigin,
  setNullTransform,
  setNullTransformOrigin,
  setAbsolute,
  setPixelPosition,
  setPixelSize,
  setNullSize,
  setFullSize,
  setOverflowHidden,
  setOverflowVisible,
  setNoPointerEvents
};

export default {
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
  setNoPointerEvents: setNoPointerEvents
};
