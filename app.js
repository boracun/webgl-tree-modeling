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
let eye = vec3(Math.sin(radians(cameraAngle)), 2.0, Math.cos(radians(cameraAngle)));
let at = vec3(0.0, 1.0, 0.0);
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

let vertices = [];
let ctmStack;    // This works as a stack that keeps track of the current transformation matrix

//=====Application Parameters=====
let trunkLength = 0.9;  // TODO: This will be randomized later
//================================
let baseTubeLength = trunkLength / 6;

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

function drawGround() {
    // Change drawing color to green and draw the ground
    glTube.uniform1i(glTube.getUniformLocation(programTube, "green"), 1);
    glTube.drawArrays(glTube.TRIANGLE_STRIP, 0, groundVertexCount);
}

// Bottom tube has length: baseTubeLength
// Middle tube length has length: baseTubeLength * 2
// Top tube length has length: baseTubeLength * 3
function drawTrunk() {
    let trunkTransformationMatrix;  // This is used when we want to scale an object but not want to save it in the stack

    // Change drawing color to brown and draw the rest
    glTube.uniform1i(glTube.getUniformLocation(programTube, "green"), 0);

    // Bottom tube
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Middle tube
    modelViewMatrix = mult(modelViewMatrix, translate(0, baseTubeLength, 0));
    trunkTransformationMatrix = mult(modelViewMatrix, scale(10 / 17, 2, 10 / 17));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Top tube
    modelViewMatrix = mult(modelViewMatrix, translate(0, 2 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(modelViewMatrix, scale(Math.pow(10 / 17, 2), 3, Math.pow(10 / 17, 2)));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Cone on the top
    modelViewMatrix = mult(modelViewMatrix, translate(0, 3 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(modelViewMatrix, scale(Math.pow(10 / 17, 3), 6, Math.pow(10 / 17, 3)));
    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    glTube.drawArrays(glTube.TRIANGLE_FAN, groundVertexCount + tubeVertexCount, coneVertexCount);
}

function drawLimb(rotationMatrix, length, depth) {
    let limbTransformationMatrix;

    modelViewMatrix = mult(modelViewMatrix, rotationMatrix);
    limbTransformationMatrix = mult(modelViewMatrix, scale(Math.pow(10 / 17, depth), length, Math.pow(10 / 17, depth)))

    glTube.uniformMatrix4fv(glTube.getUniformLocation(programTube, "modelViewMatrix"), false, flatten(limbTransformationMatrix));
    glTube.drawArrays(glTube.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    modelViewMatrix = mult(modelViewMatrix, translate(0, length * baseTubeLength, 0));
}

window.onload = function init() {
    let increaseCameraAngleButton = document.getElementById("increase-camera-angle-button");
    increaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle += 15;
        eye = vec3(Math.sin(radians(cameraAngle)), 2.0, Math.cos(radians(cameraAngle)));
    });

    let decreaseCameraAngleButton = document.getElementById("decrease-camera-angle-button");
    decreaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle -= 15;
        eye = vec3(Math.sin(radians(cameraAngle)), 2.0, Math.cos(radians(cameraAngle)));
    });

    canvas = document.getElementById("gl-canvas");

    glTube = WebGLUtils.setupWebGL(canvas);
    if (!glTube) {alert("WebGL isn't available");}

    glTube.viewport(0, 0, canvas.width, canvas.height);
    glTube.clearColor(0.53, 0.81, 0.94, 1.0);
    glTube.enable(glTube.DEPTH_TEST);

    // Add needed vertices
    addGroundVertices();
    addTubeVertices(0.1, 0.17, baseTubeLength);
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

    ctmStack = [mat4()];
    drawGround();
    drawTrunk();
    drawLimb(rotate(-45, [0, 0, 1]), 4, 4);
    drawLimb(rotate(45, [0, 0, 1]), 2, 5);
    drawLimb(rotate(45, [0, 0, 1]), 1, 6);

    requestAnimFrame(render);
}