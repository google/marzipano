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

/**
 * @class FetchImageUsingOffscreenCanvasWorker
 * @classdesc
 * 
 * Worker that load an image using fetch and createImageBitmap then resize it 
 * using an offscreenCanvas and return an imageBitmap of the image
 */

/**
 * @typedef {Object} WorkerResult
 * @property {String} imageURL the URL of the image for identification
 * @property {ImageBitmap} imageBitmap the image as an image bitmap
 */

/**
 * The listener of the worker
 * 
 * @param {String} imageURL the URL of the image
 * @param {OffscreenCanvas} canvas the canvas to draw the loaded image
 * @param {Number} x The x coordinate
 * @param {Number} y The y coordinate
 * @param {Number} width The width
 * @param {Number} height The width
 * 
 * @returns {WorkerResult}
 */
onmessage = async event => {
    const blob = await (await fetch(event.data.imageURL)).blob();
    let imageBitmap = await createImageBitmap(
        blob, 
        { imageOrientation: "flipY" }
    );

    const x = event.data.x;
    const y = event.data.y;
    const width = event.data.width;
    const height = event.data.height;

    const canvas = event.data.canvas;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(b, x, y, width, height, 0, 0, width, height);
    imageBitmap = await createImageBitmap(await canvas.convertToBlob());

    postMessage({ 
        imageURL: event.data.imageURL, 
        imageBitmap: imageBitmap
    });
};