
new window['WebXRPolyfill']();
var mat4 = Marzipano.dependencies.glMatrix.mat4;

var viewerElement = document.querySelector("#pano");
var enterVrElement = document.querySelector("#enter-vr");
var noVrElement = document.querySelector("#no-vr");

let xrSession = null;
let xrRefSpace = null;
// WebGL scene globals.
let gl = null;
let xr = navigator.xr;
var stage = new Marzipano.WebGlStage({ xrCompatible: true });
viewerElement.appendChild(stage.domElement());
Marzipano.registerDefaultRenderers(stage);


function updateSize() {
    let canvas = document.getElementsByTagName('canvas')[0];
    stage.setSize({
        width: canvas.clientWidth * window.devicePixelRatio,
        height: canvas.clientHeight * window.devicePixelRatio
    });
}
updateSize();
window.addEventListener('resize', updateSize);

var geometry = new Marzipano.CubeGeometry([
    { tileSize: 256, size: 256, fallbackOnly: true },
    { tileSize: 512, size: 512 },
    { tileSize: 512, size: 1024 },
    { tileSize: 512, size: 2048 },
    { tileSize: 512, size: 4096 }
]);
var viewLeft = new WebVrView();
var viewRight = new WebVrView();
var layerLeft = createLayer(stage, viewLeft, geometry, 'left');
var layerRight = createLayer(stage, viewRight, geometry, 'right');
stage.addLayer(layerLeft);
stage.addLayer(layerRight);

function initXR() {
    // Is WebXR available on this UA?
    if (xr) {
        // If the device allows creation of exclusive sessions set it as the
        // target of the 'Enter XR' button.
        xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                // Updates the button to start an XR session when clicked.
                enterVrElement.addEventListener('click', onButtonClicked);
                enterVrElement.textContent = 'Enter VR';
                enterVrElement.disabled = false;
                enterVrElement.style.display =  'block';
                noVrElement.style.display = 'none';
            }else{
                enterVrElement.style.display = 'none';
                noVrElement.style.display = 'block';
            }
        }).catch((error) => console.log(error));
    }
}

function onButtonClicked() {
    if (!xrSession) {
        xr.requestSession('immersive-vr').then(onSessionStarted);
    } else {
        xrSession.end();
    }
}

function onSessionStarted(session) {
    xrSession = session;
    enterVrElement.textContent = 'Exit VR';

    // Listen for the sessions 'end' event so we can respond if the user
    // or UA ends the session for any reason.
    session.addEventListener('end', onSessionEnded);

    // Create a WebGL context to render with, initialized to be compatible
    // with the XRDisplay we're presenting to.
    gl = stage.webGlContext();
    if (!gl) return;
    // Use the new WebGL context to create a XRWebGLLayer and set it as the
    // sessions baseLayer. This allows any content rendered to the layer to
    // be displayed on the XRDevice.
    session.updateRenderState({ baseLayer: new window['XRWebGLLayer'](session, gl) });

    // Get a reference space, which is required for querying poses. In this
    // case an 'local' reference space means that all poses will be relative
    // to the location where the XRDevice was first detected.
    session.requestReferenceSpace('local').then((refSpace) => {
        xrRefSpace = refSpace;

        // Inform the session that we're ready to begin drawing.
        session.requestAnimationFrame(onXRFrame);
    });
}

function onSessionEnded(event) {
    xrSession = null;
    enterVrElement.textContent = 'Enter VR';

    // In this simple case discard the WebGL context too, since we're not
    // rendering anything else to the screen with it.
    gl = null;
}
var proj = mat4.create();
var pose = mat4.create();
function onXRFrame(time, frame) {
    let session = frame.session;

    // Inform the session that we're ready for the next frame.
    session.requestAnimationFrame(onXRFrame);

    // Get the XRDevice pose relative to the reference space we created
    // earlier.
    let xrpose = frame.getViewerPose(xrRefSpace);

    // Getting the pose may fail if, for example, tracking is lost. So we
    // have to check to make sure that we got a valid pose before attempting
    // to render with it. If not in this case we'll just leave the
    // framebuffer cleared, so tracking loss means the scene will simply
    // disappear.
    if (xrpose) {
        let glLayer = session.renderState.baseLayer;

        if (!gl) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

        let { w, x, y, z } = xrpose.transform.inverse.orientation;
        mat4.fromQuat(pose, [x, y, z, w]);

        for (let view of xrpose.views) {
            let viewport = glLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

            if (view.eye === 'left') {
                mat4.copy(proj, view.projectionMatrix);
                mat4.multiply(proj, proj, pose);
                viewLeft.setProjection(proj);
            }

            if (view.eye === 'right') {
                mat4.copy(proj, view.projectionMatrix);
                mat4.multiply(proj, proj, pose);
                viewRight.setProjection(proj);
            }
        }
        stage.render();
    }
}
function createLayer(stage, view, geometry, eye) {
    var urlPrefix = "//www.marzipano.net/media/music-room";
    var source = new Marzipano.ImageUrlSource.fromString(
        urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg",
        { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

    var textureStore = new Marzipano.TextureStore(source, stage);
    var layer = new Marzipano.Layer(source, geometry, view, textureStore,
    );

    layer.pinFirstLevel();

    return layer;
}
initXR();
