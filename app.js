let canvas;
let gl;
let program;

let instanceMatrix;
let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBuffer;

let maxNumVertices = 10000;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL isn't available");}

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    // Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition" );
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    requestAnimFrame(render);
}