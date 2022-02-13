
import WebGlCube from "./WebGlCube";
import WebGlFlat from "./WebGlFlat";
import WebGlEquirect from "./WebGlEquirect";

/**
 * Registers all known renderers for the given stage type into that stage.
 * Most users will not need to register renderers, as {@link Viewer} does it for
 * them.
 *
 * @param {Stage} stage The stage where the renderers are to be registered.
 * @throws An error if the stage type is unknown.
 */
function registerDefaultRenderers(stage) {
  switch (stage.type) {
    case 'webgl':
      stage.registerRenderer('flat', 'flat', WebGlFlat);
      stage.registerRenderer('cube', 'rectilinear', WebGlCube);
      stage.registerRenderer('equirect', 'rectilinear', WebGlEquirect);
      break;
    default:
      throw new Error('Unknown stage type: ' + stage.type);
  }
}

export default registerDefaultRenderers;
