// Constants
const EYE_HEIGHT = 1.5; // The y component of eye point in lookAt function. Bigger values mean we are looking more from the top.
const CAMERA_ANGLE_CHANGE_AMOUNT = 15;  // When you change the camera angle, it changes this much.
const INNER_RADIUS = 0.1;   // The inner radius of the tube model.
const OUTER_RADIUS = 0.17;  // The outer radius of the tube model. Also used as the radius of the cone model
const CONE_HEIGHT = 0.02;   // The height of the cone model.
const RADIUS_RATIO = INNER_RADIUS / OUTER_RADIUS;   // Used to scale a tube such that its outer radius is equal to the inner radius of the previous tube.
const MAX_LIMB_ANGLE = 60; // A limb can be rotated at most 110 degrees about each axis.
const MAX_LEVEL_TWO_NODES = 5;
const MIN_LEVEL_TWO_NODES = 2;
const MAX_LEVEL_THREE_NODES = 10;
const MIN_LEVEL_THREE_NODES = 3;
const MIN_BRANCHING_POSITION = 0.3; // The position on the parent where this limb is located. 0 means where the parent starts, 1 means where the parent ends. This constant indicates the minimum amount of this parameter.
const MAX_LIMB_LENGTH_LEVEL_TWO = 5;
const MIN_LIMB_LENGTH_LEVEL_TWO = 1;
const MAX_LIMB_LENGTH_LEVEL_THREE = 2;
const MIN_LIMB_LENGTH_LEVEL_THREE = 0.5;

// Variables
let canvas;
let gl;
let program;

let projectionMatrix;
let modelViewMatrix;

// Add color buffer if needed later
let vBuffer;

// For model-view matrix
let cameraAngle = 45    // Initial camera angle
let eye = vec3(Math.sin(radians(cameraAngle)), EYE_HEIGHT, Math.cos(radians(cameraAngle)));
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
let treeStructure = new Tree();
let selectedBranchNode;     // The node in the data structure that corresponds to the branch selected from the dropdowns
let ctmStack;    // This works as a stack that keeps track of the current transformation matrix

//=====Application Parameters=====
let trunkLength = 1.0;  // TODO: This will be randomized later
//================================
let baseTubeLength = trunkLength / 6;

// Some HTML elements
let xRotationInputNum;
let xRotationInputSlider;
let yRotationInputNum;
let yRotationInputSlider;
let zRotationInputNum;
let zRotationInputSlider;

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
    gl.uniform1i(gl.getUniformLocation(program, "green"), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, groundVertexCount);
}

// Bottom tube has length: baseTubeLength
// Middle tube length has length: baseTubeLength * 2
// Top tube length has length: baseTubeLength * 3
function drawTrunk() {
    let trunkTransformationMatrix;  // This is used when we want to scale an object but not want to save it in the stack

    // Change drawing color to brown and draw the rest
    gl.uniform1i(gl.getUniformLocation(program, "green"), 0);

    modelViewMatrix = mult(modelViewMatrix, treeStructure.rootNode.relativeRotationMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));

    // Bottom tube
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Middle tube
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(RADIUS_RATIO, 2, RADIUS_RATIO));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Top tube
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, 3 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(Math.pow(RADIUS_RATIO, 2), 3, Math.pow(RADIUS_RATIO, 2)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Cone on the top
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, 6 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(Math.pow(RADIUS_RATIO, 3), 6, Math.pow(RADIUS_RATIO, 3)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_FAN, groundVertexCount + tubeVertexCount, coneVertexCount);
}

function drawLimb(rotationMatrix, length, position, depth) {
    let limbTransformationMatrix;

    modelViewMatrix = ctmStack[ctmStack.length - 1];

    modelViewMatrix = mult(modelViewMatrix, translate(0, length * baseTubeLength * position, 0));
    modelViewMatrix = mult(modelViewMatrix, rotationMatrix);
    limbTransformationMatrix = mult(modelViewMatrix, scale(Math.pow(RADIUS_RATIO, depth), length, Math.pow(RADIUS_RATIO, depth)))

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(limbTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);
}

function getRandomRotationAngles() {
    return [
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE),    // Between -max and +max
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE),    // Between -max and +max
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE)    // Between -max and +max
    ];
}

function randomizeTreeStructure() {
    treeStructure.rootNode = new Node(0, null, 6, 1, [0, 0, 0], "1");
    selectedBranchNode = treeStructure.rootNode;

    let levelTwoNodeCount = Math.floor(Math.random() * MAX_LEVEL_TWO_NODES + MIN_LEVEL_TWO_NODES);

    for (let i = 0; i < levelTwoNodeCount; i++) {
        let newNode = new Node(
            1,
            treeStructure.rootNode,
            Math.random() * (MAX_LIMB_LENGTH_LEVEL_TWO - MIN_LIMB_LENGTH_LEVEL_TWO) + MIN_LIMB_LENGTH_LEVEL_TWO,
            1.0,
            getRandomRotationAngles(),
            "1." + (i + 1));

        let levelThreeNodeCount = Math.floor(Math.random() * MAX_LEVEL_THREE_NODES + MIN_LEVEL_THREE_NODES);
        for (let j = 0; j < levelThreeNodeCount; j++) {
            newNode.children.push(new Node(
                1,
                newNode,
                Math.random() * (MAX_LIMB_LENGTH_LEVEL_THREE - MIN_LIMB_LENGTH_LEVEL_THREE) + MIN_LIMB_LENGTH_LEVEL_THREE,
            Math.random() * (1 - MIN_BRANCHING_POSITION) + MIN_BRANCHING_POSITION,
                getRandomRotationAngles(),
                "1." + (i + 1) + "." + (j + 1)));
        }

        treeStructure.rootNode.children.push(newNode);
    }

    displayDropDownMenus();
}

function drawTree(node) {
    if (!node.type) {
        drawTrunk();
    }
    else {
        drawLimb(node.relativeRotationMatrix, node.parent.length, node.position, ctmStack.length + 2);
    }

    // Push the CTM to the stack as we are going deeper
    ctmStack.push(modelViewMatrix);

    for (let i = 0; i < node.children.length; i++) {
        drawTree(node.children[i]);
    }

    // Pop the CTM stack as we are going back to the parent
    ctmStack.pop();
}

function displayDropDownMenus() {
    displayLimbOptions(2, treeStructure.rootNode);
}

function displayBranchRotations(rotationAngles) {
    xRotationInputNum.value = rotationAngles[0];
    xRotationInputSlider.value = rotationAngles[0];
    yRotationInputNum.value = rotationAngles[1];
    yRotationInputSlider.value = rotationAngles[1];
    zRotationInputNum.value = rotationAngles[2];
    zRotationInputSlider.value = rotationAngles[2];
}

function displayLimbOptions(levelNo, parentNode) {
    let branchListElement = document.getElementById("branch-list");
    let selectElement = document.createElement("select");
    selectElement.id = "level-" + levelNo + "-select";
    selectElement.className = "button";

    branchListElement.appendChild(selectElement);

    selectElement.addEventListener("change", function (event) {
        // If None, remove dropdowns of higher levels
        if (selectElement.value === "None") {
            deleteDropDowns(branchListElement, levelNo + 1);
            displayBranchRotations(parentNode.rotationAngles);
        }

        // Display one level lower
        else {
            if (branchListElement.children.length !== levelNo)
                deleteDropDowns(branchListElement, levelNo + 1);
            let nodeIndex = parseInt(selectElement.value.slice(-1)) - 1;
            displayLimbOptions(levelNo + 1, parentNode.children[nodeIndex]);
            displayBranchRotations(parentNode.children[nodeIndex].rotationAngles);
            selectedBranchNode = parentNode.children[nodeIndex];
        }
    });

    addOptionToDropdown(selectElement, "None");

    for (let i = 0; i < parentNode.children.length; i++) {
        addOptionToDropdown(selectElement, parentNode.children[i].name);
    }
}

function addOptionToDropdown(selectElement, value) {
    let optionElement = document.createElement("option");
    optionElement.id = "option-" + name;
    optionElement.value = value;
    if (value === "None")
        optionElement.innerHTML = optionElement.value;
    else
        optionElement.innerHTML = "Branch #" + optionElement.value;

    selectElement.appendChild(optionElement);
}

function deleteDropDowns(branchListElement, startingLevel) {
    for (let i = startingLevel; i <= branchListElement.children.length + 1; i++) {
        branchListElement.removeChild(document.getElementById("level-" + i + "-select"));
    }
}

window.onload = function init() {
    let generateTreeButton = document.getElementById("generate-tree-button");
    generateTreeButton.addEventListener("click", function () {
        randomizeTreeStructure();
    });

    let increaseCameraAngleButton = document.getElementById("increase-camera-angle-button");
    increaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle += CAMERA_ANGLE_CHANGE_AMOUNT;
        eye = vec3(Math.sin(radians(cameraAngle)), EYE_HEIGHT, Math.cos(radians(cameraAngle)));
    });

    let decreaseCameraAngleButton = document.getElementById("decrease-camera-angle-button");
    decreaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle -= CAMERA_ANGLE_CHANGE_AMOUNT;
        eye = vec3(Math.sin(radians(cameraAngle)), EYE_HEIGHT, Math.cos(radians(cameraAngle)));
    });

    xRotationInputNum = document.getElementById("x-rotation-number");
    xRotationInputNum.addEventListener("change", function (event) {
       xRotationInputSlider.value = xRotationInputNum.value;
       selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
       selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    xRotationInputSlider = document.getElementById("x-rotation-range");
    xRotationInputSlider.addEventListener("change", function (event) {
        xRotationInputNum.value = xRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    yRotationInputNum = document.getElementById("y-rotation-number");
    yRotationInputNum.addEventListener("change", function (event) {
        yRotationInputSlider.value = yRotationInputNum.value;
        selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    yRotationInputSlider = document.getElementById("y-rotation-range");
    yRotationInputSlider.addEventListener("change", function (event) {
        yRotationInputNum.value = yRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    zRotationInputNum = document.getElementById("z-rotation-number");
    zRotationInputNum.addEventListener("change", function (event) {
        zRotationInputSlider.value = zRotationInputNum.value;
        selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    zRotationInputSlider = document.getElementById("z-rotation-range");
    zRotationInputSlider.addEventListener("change", function (event) {
        zRotationInputNum.value = zRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [xRotationInputNum.value, yRotationInputNum.value, zRotationInputNum.value];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL isn't available");}

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.53, 0.81, 0.94, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Add needed vertices
    addGroundVertices();
    addTubeVertices(INNER_RADIUS, OUTER_RADIUS, baseTubeLength);
    addConeVertices(OUTER_RADIUS, CONE_HEIGHT);

    // Create tree for hierarchy
    randomizeTreeStructure();

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPositionTube = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPositionTube, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionTube);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));

    ctmStack = [mat4()];

    drawGround();
    drawTree(treeStructure.rootNode);

    requestAnimFrame(render);
}