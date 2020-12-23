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
 * @class FetchImage
 * @classdesc
 * 
 * Worker that load an image using fetch and return the blob of it
 */

/**
 * @typedef {Object} WorkerResult
 * @property {String} imageURL the URL of the image for identification
 * @property {Blob} imageBlob the image data as a blob
 */

/**
 * The listener of the worker
 * 
 * @param {String} imageURL the URL of the image
 * 
 * @returns {WorkerResult}
 */
onmessage = async event => {
    postMessage({ 
        imageURL: event.data.imageURL, 
        imageBlob: await (await fetch(event.data.imageURL)).blob()
    });
};