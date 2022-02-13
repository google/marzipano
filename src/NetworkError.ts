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

/**
 * @class NetworkError
 * @extends {Error}
 * @classdesc
 *
 * Signals an error that occurred while fetching a URL. This is used by
 * {@link Loader loaders} to distinguish network failures from other errors.
 */
class NetworkError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)
    if(typeof args[0] === 'string') {
      this.message = args[0]
    }
  }
}

export default NetworkError;
