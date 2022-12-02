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
const TUBE_Y_AXIS = 30;

// LIGHT VARIABLES
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0 );
var lightDiffuse = vec4( 0.9, 0.9, 0.9, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.5, 0.5, 0.5, 1.0 );
var materialDiffuse = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialShininess = 20.0;


let ambientColor, diffuseColor, specularColor;
let renderShadingOption = 1;


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
var normalsArray = [];
let treeStructure = new Tree();
let selectedBranchNode;     // The node in the data structure that corresponds to the branch selected from the dropdowns
let ctmStack;    // This works as a stack that keeps track of the current transformation matrix

//=====Application Parameters=====
let trunkLength = 3.0;  // TODO: This value can be changed between 3 and 6
//================================
let baseTubeLength = trunkLength / 6;

// Some HTML elements
let xRotationInputNum;
let xRotationInputSlider;
let yRotationInputNum;
let yRotationInputSlider;
let zRotationInputNum;
let zRotationInputSlider;

// Animation
let currentAnimation = new Animation();
let uploadedJson;
let keyframeIndex = -1;     // Used for determining where the animation is

function subtractElementwise(a, b) {
    return a.map((e, i) => b[i] - e);
}

function addGroundVertices() {
    vertices.push(vec4(-1.0, 0.0, -1.0, 1.0));
	
    vertices.push(vec4(1.0, 0.0, -1.0, 1.0));
	
    vertices.push(vec4(-1.0, 0.0, 1.0, 1.0));
	
    vertices.push(vec4(1.0, 0.0, 1.0, 1.0));
    groundVertexCount = 4;
}

function addTubeVertices(innerRadius, outerRadius, height) {	
	let firstVertex;
	let secondVertex;
	
	for ( let yCount = 0; yCount < faceCount - 1; yCount++ )
	{
		let y1 = TUBE_Y_AXIS * yCount / faceCount;
		
		if (y1 / TUBE_Y_AXIS > height)
			break;
		
		let radius1 = 5 - Math.log(y1 + 1);
		
		let y2 = TUBE_Y_AXIS * (yCount + 1) / faceCount;
		let radius2 = 5 - Math.log(y2 + 1);
		
		for ( let xCount = 0; xCount < faceCount - 1; xCount++ )
		{
			let theta1 = 2 * Math.PI * xCount / faceCount;
			let x1 = radius1 * Math.cos(theta1);
			let z1 = Math.sqrt(Math.pow(radius1, 2) - Math.pow(x1, 2));
			
			if ( Math.sin(theta1) > 0 )
				z1 *= -1 ;
			
			let theta2 = 2 * Math.PI * (xCount + 1) / faceCount;
			let x2 = radius2 * Math.cos(theta2);
			let z2 = Math.sqrt(Math.pow(radius2, 2) - Math.pow(x2, 2));
			
			if ( Math.sin(theta2) > 0 )
				z2 *= -1 ;
			
			let vertex1 = vec4(x1/TUBE_Y_AXIS, y1/TUBE_Y_AXIS, z1/TUBE_Y_AXIS, 1.0);
			let vertex2 = vec4(x2/TUBE_Y_AXIS, y2/TUBE_Y_AXIS, z2/TUBE_Y_AXIS, 1.0);
			
			if (xCount == 0 )
			{
				firstVertex = vertex1;
				secondVertex = vertex2;
			}
			
			vertices.push(vertex1);
			vertices.push(vertex2);
			tubeVertexCount += 2;
		}
		
		vertices.push(firstVertex);
		vertices.push(secondVertex);
		
		tubeVertexCount += 2;
	}
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
function drawTrunk(rotationDifference) {
    let trunkTransformationMatrix;  // This is used when we want to scale an object but not want to save it in the stack

    // Change drawing color to brown and draw the rest
    gl.uniform1i(gl.getUniformLocation(program, "green"), 0);

    modelViewMatrix = mult(modelViewMatrix, treeStructure.rootNode.relativeRotationMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));

    // Bottom tube
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

/*     // Middle tube
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(RADIUS_RATIO, 2, RADIUS_RATIO));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);

    // Top tube
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, 3 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(Math.pow(RADIUS_RATIO, 2), 3, Math.pow(RADIUS_RATIO, 2)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount); */

    // Cone on the top
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, 6 * baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(Math.pow(RADIUS_RATIO, 3), 6, Math.pow(RADIUS_RATIO, 3)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.drawArrays(gl.TRIANGLE_FAN, groundVertexCount + tubeVertexCount, coneVertexCount);
	
}

function drawLimb(rotationMatrix, length, position, depth, rotationDifference) {
    let limbTransformationMatrix;

    modelViewMatrix = ctmStack[ctmStack.length - 1];

    modelViewMatrix = mult(modelViewMatrix, translate(0, baseTubeLength * position, 0));
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
            1 * (Math.random() - MIN_BRANCHING_POSITION) + MIN_BRANCHING_POSITION,
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
            selectedBranchNode = parentNode;
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

function addKeyframe() {
    currentAnimation.keyFrames.push(structuredClone(treeStructure));
    currentAnimation.durations.push(parseInt(document.getElementById("duration-input").value));
}

function deleteLastKeyframe() {
    currentAnimation.keyFrames.pop();
    currentAnimation.durations.pop();
}

// Used for adding the additional rotation in each frame when animating
function setRotationDifferences(realNode, firstKeyframeNode, secondKeyframeNode) {
    // Rotation amount between keyframes
    let rotationDifference = subtractElementwise(secondKeyframeNode.rotationAngles, firstKeyframeNode.rotationAngles);

    realNode.rotationAngles[0] += rotationDifference[0] / (60 * currentAnimation.durations[keyframeIndex]);
    realNode.rotationAngles[1] += rotationDifference[1] / (60 * currentAnimation.durations[keyframeIndex]);
    realNode.rotationAngles[2] += rotationDifference[2] / (60 * currentAnimation.durations[keyframeIndex]);
    realNode.relativeRotationMatrix = setRelativeRotationMatrix(realNode.rotationAngles);

    for (let i = 0; i < realNode.children.length; i++) {
        setRotationDifferences(realNode.children[i], firstKeyframeNode.children[i], secondKeyframeNode.children[i]);
    }
}

function startAnimation() {
    if (currentAnimation.keyFrames.length < 2)
        return;

    let keyframeCount = currentAnimation.keyFrames.length;
    let totalTime = 0;
    for (let i = 1; i < keyframeCount; i++) {
        setTimeout(() => {
            keyframeIndex = i;
        }, totalTime * 1000);
        totalTime += currentAnimation.durations[i];
    }

    setTimeout(() => {
        keyframeIndex = -1;
    }, totalTime * 1000);
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
	
	let colorRender = document.getElementById("color-render");
    colorRender.addEventListener("click", function () {
        renderShadingOption = 0;
		gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
    });
	
	let shadingRender = document.getElementById("shading-render");
    shadingRender.addEventListener("click", function () {
        renderShadingOption = 1;
		gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
    });

    let addKeyframeButton = document.getElementById("add-keyframe-button");
    addKeyframeButton.addEventListener("click", function (event) {
        addKeyframe();
    });

    let startAnimationButton = document.getElementById("start-animation-button");
    startAnimationButton.addEventListener("click", function (event) {
        startAnimation();
    });

    let saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", function (event) {
        let jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAnimation));
        let linkElement = document.getElementById('download-link');

        linkElement.setAttribute("href", jsonString);
        linkElement.setAttribute("download", "scene_" + new Date().toLocaleString() + ".json");
        linkElement.click();
    });

    let loadButton = document.getElementById("load-button");
    loadButton.addEventListener("click", function (event) {
        currentAnimation = JSON.parse(uploadedJson);
        console.log(currentAnimation);
    });

    let fileInputElement = document.getElementById("file-input");
    fileInputElement.addEventListener("change", function () {
        let reader = new FileReader();

        // When a new json is uploaded, the uploadedJson variable is updated
        reader.onload = function () {
            uploadedJson = reader.result;
        };

        reader.readAsText(this.files[0]);
    });

    let deleteLastKeyframeButton = document.getElementById("delete-last-keyframe-button");
    deleteLastKeyframeButton.addEventListener("click", function (event) {
        deleteLastKeyframe();
    });

    let deleteAllKeyframesButton = document.getElementById("delete-keyframes-button");
    deleteAllKeyframesButton.addEventListener("click", function (event) {
        currentAnimation = new Animation();
    });

    xRotationInputNum = document.getElementById("x-rotation-number");
    xRotationInputNum.addEventListener("change", function (event) {
       xRotationInputSlider.value = parseInt(xRotationInputNum.value);
       selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
       selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    xRotationInputSlider = document.getElementById("x-rotation-range");
    xRotationInputSlider.addEventListener("change", function (event) {
        xRotationInputNum.value = xRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    yRotationInputNum = document.getElementById("y-rotation-number");
    yRotationInputNum.addEventListener("change", function (event) {
        yRotationInputSlider.value = yRotationInputNum.value;
        selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    yRotationInputSlider = document.getElementById("y-rotation-range");
    yRotationInputSlider.addEventListener("change", function (event) {
        yRotationInputNum.value = yRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    zRotationInputNum = document.getElementById("z-rotation-number");
    zRotationInputNum.addEventListener("change", function (event) {
        zRotationInputSlider.value = zRotationInputNum.value;
        selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        selectedBranchNode.relativeRotationMatrix = setRelativeRotationMatrix(selectedBranchNode.rotationAngles);
    });

    zRotationInputSlider = document.getElementById("z-rotation-range");
    zRotationInputSlider.addEventListener("change", function (event) {
        zRotationInputNum.value = zRotationInputSlider.value;
        selectedBranchNode.rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
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
	
	// ground normal calculation
	var t1 = subtract(vertices[0], vertices[1]); // 1 - 2
	var t2 = subtract(vertices[2], vertices[1]); // 3 - 2
	var normal = cross(t1, t2);
	var normal = vec3(normal);
	normal = normalize(normal);
		
	for ( let i = 0; i < groundVertexCount; i++ )
		normalsArray.push(normal);
	
	// tube normal calculation
	for ( let i = groundVertexCount; i < tubeVertexCount + groundVertexCount; i++ )
	{
		var t1 = subtract(vertices[0], vertices[1]); // 1 - 2
		var t2 = subtract(vertices[2], vertices[1]); // 3 - 2
		var normal = cross(t1, t2);
		var normal = vec3(normal);
		normal = normalize(normal);
		
		//normalsArray.push(normal);
	}
		
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
	
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
	
	gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
	
	gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
	   
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));

    ctmStack = [mat4()];

    drawGround();

    // displayBranchRotations(selectedBranchNode.rotationAngles);   TODO: This breaks the rotation UI
    if (keyframeIndex !== -1)
        setRotationDifferences(treeStructure.rootNode, currentAnimation.keyFrames[keyframeIndex - 1], currentAnimation.keyFrames[keyframeIndex - 1]);
    drawTree(treeStructure.rootNode);

    requestAnimFrame(render);
}