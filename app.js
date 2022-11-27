let canvas;
let glTube;
let program;

let instanceMatrix;     // TODO: Figure out what this is for
let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBufferTube;

let maxNumVertices = 10000;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    glTube = WebGLUtils.setupWebGL(canvas);
    if (!glTube) {alert("WebGL isn't available");}

    glTube.viewport(0, 0, canvas.width, canvas.height);
    glTube.clearColor( 0.8, 0.8, 0.8, 1.0 );
    glTube.enable(glTube.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program = initShaders( glTube, "vertex-shader", "fragment-shader");
    glTube.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

    glTube.uniformMatrix4fv(glTube.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    vBufferTube = glTube.createBuffer();
    glTube.bindBuffer(glTube.ARRAY_BUFFER, vBufferTube);
    glTube.bufferData(glTube.ARRAY_BUFFER, 16 * maxNumVertices, glTube.STATIC_DRAW);

    let vPosition = glTube.getAttribLocation(program, "vPosition" );
    glTube.vertexAttribPointer(vPosition, 4, glTube.FLOAT, false, 0, 0);
    glTube.enableVertexAttribArray(vPosition);

    render();
}

function render() {
    glTube.clear(glTube.COLOR_BUFFER_BIT | glTube.DEPTH_BUFFER_BIT);
    requestAnimFrame(render);
}