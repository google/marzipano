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

var assert = require('chai').assert;
var HtmlImageLoader = require('../../../src/loaders/HtmlImage');
var NetworkError = require('../../../src/NetworkError');

function createTestImageData(width, height, pixels) {
    var data = [];
    for (var i = 0; i < pixels.length; i++) {
        for (var j = 0; j < pixels[i].length; j++) {
            data.push(pixels[i][j]);
        }
    }
    return new ImageData(new Uint8ClampedArray(data), width, height);
}

function imageDataToUrl(imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

function assetToImageData(asset) {
    var canvas = document.createElement('canvas');
    canvas.width = asset.width();
    canvas.height = asset.height();
    var ctx = canvas.getContext('2d');
    // Whether to undo the y-flip done by createImageBitmap.
    var flipY = typeof ImageBitmap !== 'undefined' && asset.element() instanceof ImageBitmap;
    ctx.scale(1, flipY ? -1 : 1);
    ctx.drawImage(asset.element(), 0, flipY ? -canvas.height : 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

var R = [255, 0, 0, 255];
var G = [0, 255, 0, 255];
var B = [0, 0, 255, 255];
var Y = [255, 255, 0, 255];

var fullImageData = createTestImageData(4, 4, [R, R, G, G, R, R, G, G, B, B, Y, Y, B, B, Y, Y]);
var bottomHalfImageData = createTestImageData(4, 2, [B, B, Y, Y, B, B, Y, Y]);
var rightHalfImageData = createTestImageData(2, 4, [G, G, G, G, Y, Y, Y, Y]);
var quarterImageData = createTestImageData(2, 2, [R, G, B, Y]);

function testLoad(inputImageData, rect, outputImageData, done) {
    var loader = new HtmlImageLoader();

    loader.loadImage(imageDataToUrl(inputImageData), rect, function(err, asset) {
        assert.isNull(err);
        assert.deepEqual(assetToImageData(asset), outputImageData);
        done();
    });
}

suite('HtmlImageLoader', function() {

    test('no rect', function(done) {
        testLoad(fullImageData, null, fullImageData, done);
    });

    test('bottom half rect', function(done) {
        testLoad(fullImageData, {x : 0, y: 0.5, width: 1, height: 0.5}, bottomHalfImageData, done);
    });

    test('right half rect', function(done) {
        testLoad(fullImageData, {x : 0.5, y: 0, width: 0.5, height: 1}, rightHalfImageData, done);
    });

    test('quarter rect', function(done) {
        testLoad(fullImageData, {x : 0.25, y: 0.25, width: 0.5, height: 0.5}, quarterImageData, done);
    });

    test('network error', function(done) {
        var loader = new HtmlImageLoader();

        loader.loadImage('http://www.nosuchdomain/bad_image_url.jpg', null, function(err, asset) {
            assert.instanceOf(err, NetworkError);
            assert.isUndefined(asset);
            done();
        });
    });

});
