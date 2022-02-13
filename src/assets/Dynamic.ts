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

import StaticAsset from "./Static";
import eventEmitter from "minimal-event-emitter";
import clearOwnProperties from "../util/clearOwnProperties";

/**
 * @class DynamicAsset
 * @implements Asset
 * @extends StaticAsset
 * @classdesc
 *
 * An {@link Asset} whose pixel contents may change.
 *
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} element The
 *     underlying pixel source.
 * @throws If the pixel source is unsupported.
 */
class DynamicAsset extends StaticAsset {
  #_timestamp: number;

  constructor(element: ConstructorParameters<typeof StaticAsset>[0]) {
    super(element);
    this.#_timestamp = 0;
  }
  /**
   * Destructor.
   */
  destroy() {
    clearOwnProperties(this);
  }
  timestamp() {
    return this.#_timestamp;
  }
  isDynamic() {
    return true;
  }
  /**
   * Marks the asset dirty, signaling that the contents of the underlying pixel
   * source have changed.
   *
   * @throws If the asset is not dynamic.
   */
  markDirty() {
    this.#_timestamp++;
    // TODO: define the proper event emitter interface
    // @ts-ignore
    this.emit('change');
  }
}

eventEmitter(DynamicAsset);

export default DynamicAsset;
