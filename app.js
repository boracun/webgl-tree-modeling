let canvas;
let glTube;
let programTube;

let instanceMatrix;     // TODO: Figure out what this is for
let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBufferTube;

let cameraAngle = 45
let eye = vec3(Math.sin(radians(cameraAngle)), 1.0, Math.cos(radians(cameraAngle)));
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let near = -4;
let far = 4;

let left = -1.5;
let right = 1.5;
let ytop = 1.5;
let bottom = -1.5;

// Number of "faces" a tube will have. The more faces it has, the more round it looks.
let faceCount = 50;

// TODO: Need to separate trunk and ground vertices later
let tubeVertices = [];

function addGroundVertices() {
    tubeVertices.push(vec4(-1.0, 0.0, -1.0, 1.0));
    tubeVertices.push(vec4(1.0, 0.0, -1.0, 1.0));
    tubeVertices.push(vec4(-1.0, 0.0, 1.0, 1.0));
    tubeVertices.push(vec4(1.0, 0.0, 1.0, 1.0));
}

function addTubeVertices(innerRadius, outerRadius, height) {
    for (let i = 0; i < faceCount; i++) {
        tubeVertices.push(vec4(outerRadius * Math.sin(radians(i * 360 / faceCount)), 0.0, outerRadius * Math.cos(radians(i * 360 / faceCount)), 1.0));
        tubeVertices.push(vec4(innerRadius * Math.sin(radians(i * 360 / faceCount)), height, innerRadius * Math.cos(radians(i * 360 / faceCount)), 1.0));
    }

    tubeVertices.push(vec4(outerRadius * Math.sin(0), 0.0, outerRadius * Math.cos(0), 1.0));
    tubeVertices.push(vec4(innerRadius * Math.sin(0), height, innerRadius * Math.cos(0), 1.0));
}

window.onload = function init() {
    let increaseCameraAngleButton = document.getElementById("increase-camera-angle-button");
    increaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle += 15;
        eye = vec3(Math.sin(radians(cameraAngle)), 1.0, Math.cos(radians(cameraAngle)));
    });

    let decreaseCameraAngleButton = document.getElementById("decrease-camera-angle-button");
    decreaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle -= 15;
        eye = vec3(Math.sin(radians(cameraAngle)), 1.0, Math.cos(radians(cameraAngle)));
    });

    canvas = document.getElementById("gl-canvas");

    glTube = WebGLUtils.setupWebGL(canvas);
    if (!glTube) {alert("WebGL isn't available");}

    glTube.viewport(0, 0, canvas.width, canvas.height);
    glTube.clearColor(0.53, 0.81, 0.94, 1.0);
    glTube.enable(glTube.DEPTH_TEST);

    addGroundVertices();
    addTubeVertices(0.1, 0.2, 0.15);

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
    glTube.bufferData(glTube.ARRAY_BUFFER, flatten(tubeVertices), glTube.STATIC_DRAW);

    let vPositionTube = glTube.getAttribLocation(programTube, "vPosition");
    glTube.vertexAttribPointer(vPositionTube, 4, glTube.FLOAT, false, 0, 0);
    glTube.enableVertexAttribArray(vPositionTube);

    render();
}

function render() {
    glTube.clear(glTube.COLOR_BUFFER_BIT | glTube.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at, up);
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));

    // Change drawing color to green and draw the ground
    glTube.uniform1i(glTube.getUniformLocation(programTube, "green"), 1);
    glTube.drawArrays(glTube.TRIANGLE_STRIP, 0, 4);

    // Change drawing color to brown and draw the rest
    glTube.uniform1i(glTube.getUniformLocation(programTube, "green"), 0);
    glTube.drawArrays(glTube.TRIANGLE_STRIP, 4, 1000);     // TODO: Set the count

    requestAnimFrame(render);
}