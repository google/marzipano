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

import WebGlBaseRenderer from "./WebGlBase";
import inherits from "../util/inherits";

/**
 * @class WebGlCubeRenderer
 * @implements Renderer
 * @classdesc
 *
 * A renderer for {@link CubeGeometry} and {@link RectilinearView}, appropriate
 * for a {@link WebGlStage}.
 *
 * Most users do not need to instantiate this class. Renderers are created and
 * destroyed by {@link Stage} as necessary.
 */
function WebGlCubeRenderer() {
  this.constructor.super_.apply(this, arguments);
}

inherits(WebGlCubeRenderer, WebGlBaseRenderer);

export default WebGlCubeRenderer;
