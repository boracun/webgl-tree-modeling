let canvas;
let glTube;
let programTube;

let instanceMatrix;     // TODO: Figure out what this is for
let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBufferTube;

// For model-view matrix
let cameraAngle = 45
let eye = vec3(Math.sin(radians(cameraAngle)), 1.0, Math.cos(radians(cameraAngle)));
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

// For projection matrix
let near = -4;
let far = 4;

let left = -1.5;
let right = 1.5;
let ytop = 1.5;
let bottom = -1.5;

let groundVertexCount = 0;
let tubeVertexCount = 0;
let coneVertexCount = 0;

// Number of "faces" a tube will have. The more faces it has, the more round it looks.
let faceCount = 40;

// TODO: Need to separate trunk and ground vertices later
let vertices = [];
let ctmStack = [mat4()];    // This works as a stack that keeps track of the current transformation matrix

function addGroundVertices() {
    vertices.push(vec4(-1.0, 0.0, -1.0, 1.0));
    vertices.push(vec4(1.0, 0.0, -1.0, 1.0));
    vertices.push(vec4(-1.0, 0.0, 1.0, 1.0));
    vertices.push(vec4(1.0, 0.0, 1.0, 1.0));
    groundVertexCount = 4;
}

function addTubeVertices(innerRadius, outerRadius, height) {
    for (let i = 0; i < faceCount; i++) {
        vertices.push(vec4(outerRadius * Math.sin(radians(i * 360 / faceCount)), 0.0, outerRadius * Math.cos(radians(i * 360 / faceCount)), 1.0));
        vertices.push(vec4(innerRadius * Math.sin(radians(i * 360 / faceCount)), height, innerRadius * Math.cos(radians(i * 360 / faceCount)), 1.0));
        tubeVertexCount += 2;
    }

    vertices.push(vec4(outerRadius * Math.sin(0), 0.0, outerRadius * Math.cos(0), 1.0));
    vertices.push(vec4(innerRadius * Math.sin(0), height, innerRadius * Math.cos(0), 1.0));
    tubeVertexCount += 2;
}

function addConeVertices(radius, height) {
    vertices.push(vec4(0.0, height, 0.0, 1.0));

    for (let i = 0; i < faceCount; i++) {
        vertices.push(vec4(radius * Math.sin(radians(i * 360 / faceCount)), 0.0, radius * Math.cos(radians(i * 360 / faceCount)), 1.0));
        coneVertexCount++;
    }

    vertices.push(vec4(radius * Math.sin(0), 0.0, radius * Math.cos(0), 1.0));
    coneVertexCount += 2;
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

    // Add needed vertices
    addGroundVertices();
    addTubeVertices(0.1, 0.17, 0.15);
    addConeVertices(0.17, 0.02);

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
    glTube.bufferData(glTube.ARRAY_BUFFER, flatten(vertices), glTube.STATIC_DRAW);

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
    glTube.drawArrays(glTube.TRIANGLE_STRIP, 0, groundVertexCount);

    // Change drawing color to brown and draw the rest
    glTube.uniform1i(glTube.getUniformLocation(programTube, "green"), 0);
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    modelViewMatrix = mult(modelViewMatrix, translate(0, 0.15, 0));
    modelViewMatrix = mult(modelViewMatrix, scale(10 / 17, 2, 10 / 17));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    modelViewMatrix = mult(modelViewMatrix, translate(0, 0.15, 0));
    modelViewMatrix = mult(modelViewMatrix, scale(10 / 17, 3, 10 / 17));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    modelViewMatrix = mult(modelViewMatrix, translate(0, 0.15, 0));
    modelViewMatrix = mult(modelViewMatrix, scale(10 / 17, 1, 10 / 17));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(modelViewMatrix));
    glTube.drawArrays(glTube.TRIANGLE_FAN, groundVertexCount + tubeVertexCount, coneVertexCount);

    requestAnimFrame(render);
}