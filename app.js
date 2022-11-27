let canvas;
let glTube;
let programTube;

let instanceMatrix;     // TODO: Figure out what this is for
let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBufferTube;

let eye = vec3(1.0, 1.0, 1.0);
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let near = -4;
let far = 4;

let left = -1.5;
let right = 1.5;
let ytop = 1.5;
let bottom = -1.5;

let groundVertices = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    glTube = WebGLUtils.setupWebGL(canvas);
    if (!glTube) {alert("WebGL isn't available");}

    glTube.viewport(0, 0, canvas.width, canvas.height);
    glTube.clearColor( 0.8, 0.8, 0.8, 1.0 );
    glTube.enable(glTube.DEPTH_TEST);

    groundVertices.push(vec4( -1, 0,  -1, 1.0 ));
    groundVertices.push(vec4( 1,  0,  -1, 1.0 ));
    groundVertices.push(vec4( -1,  0,  1, 1.0 ));
    groundVertices.push(vec4( 1, 0,  1, 1.0 ));

    // Load shaders and initialize attribute buffers
    programTube = initShaders(glTube, "vertex-shader", "fragment-shader");
    glTube.useProgram(programTube);

    instanceMatrix = mat4();

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    modelViewMatrix = mat4();

    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "projectionMatrix"), false, flatten(projectionMatrix));

    vBufferTube = glTube.createBuffer();
    glTube.bindBuffer(glTube.ARRAY_BUFFER, vBufferTube);
    glTube.bufferData(glTube.ARRAY_BUFFER, flatten(groundVertices), glTube.STATIC_DRAW);

    let vPositionTube = glTube.getAttribLocation(programTube, "vPosition" );
    glTube.vertexAttribPointer(vPositionTube, 4, glTube.FLOAT, false, 0, 0);
    glTube.enableVertexAttribArray(vPositionTube);

    render();
}

function render() {
    glTube.clear(glTube.COLOR_BUFFER_BIT | glTube.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at, up);
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));

    glTube.drawArrays(glTube.TRIANGLE_STRIP, 0, 4);

    requestAnimFrame(render);
}