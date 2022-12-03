// Constants
const EYE_HEIGHT = 1.5; // The y component of eye point in lookAt function. Bigger values mean we are looking more from the top.
const CAMERA_ANGLE_CHANGE_AMOUNT = 15;  // When you change the camera angle, it changes this much.
const INNER_RADIUS = 0.1;   // The inner radius of the tube model.
const OUTER_RADIUS = 0.17;  // The outer radius of the tube model. Also used as the radius of the cone model
const CONE_HEIGHT = 0.02;   // The height of the cone model.
const RADIUS_RATIO = INNER_RADIUS / OUTER_RADIUS;   // Used to scale a tube such that its outer radius is equal to the inner radius of the previous tube.
const MAX_LIMB_ANGLE = 60; // A limb can be rotated at most 110 degrees about each axis.
const MAX_LEVEL_TWO_NODES = 5;
const MIN_LEVEL_TWO_NODES = 3;
const MAX_LEVEL_THREE_NODES = 10;
const MIN_LEVEL_THREE_NODES = 3;
const MAX_BRANCHING_POSITION = 0.96;
const MIN_BRANCHING_POSITION = 0.3; // The position on the parent where this limb is located. 0 means where the parent starts, 1 means where the parent ends. This constant indicates the minimum amount of this parameter.
const MAX_LIMB_LENGTH_LEVEL_TWO = 1.75;
const MIN_LIMB_LENGTH_LEVEL_TWO = 0.75;
const MAX_LIMB_LENGTH_LEVEL_THREE = 0.5;
const MIN_LIMB_LENGTH_LEVEL_THREE = 0.3;
const TUBE_Y_AXIS = 30;
const MIN_TRUNK_LENGTH_MULTIPLIER = 0.75;
const TRUNK_LENGTH_MULTIPLIER_RANGE = 0.5;


var sphereRadius;
// LIGHT VARIABLES
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0 );
var lightDiffuse = vec4( 0.9, 0.9, 0.9, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.5, 0.5, 0.5, 1.0 );
var materialDiffuse = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialShininess = 40.0;

let ambientColor, diffuseColor, specularColor;
let renderShadingOption = 0;
let wireframeOption = 0;

var vColor;

const black = vec4(0.0, 0.0, 0.0, 1.0);
const white = vec4(1.0, 1.0, 1.0, 1.0);
const green = vec4(0.0, 0.7, 0.0, 1.0);
const brown = vec4(0.59, 0.29, 0.0, 1.0);

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
let faceCount = 20;

let vertices = [];
var normalsArray = [];
let treeStructure;      // Root has index 1
let selectedBranchNodeIndex;     // The index of node in the data structure that corresponds to the branch selected from the dropdowns
let ctmStack;    // This works as a stack that keeps track of the current transformation matrix

//=====Application Parameters=====
let trunkLength = 6.0;  // TODO: This value can be changed between 3 and 6
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
    return a.map((e, i) => e - b[i]);
}

function addGroundVertices() {
    vertices.push(vec4(-1.0, 0.0, -1.0, 1.0));
	
    vertices.push(vec4(1.0, 0.0, -1.0, 1.0));
	
    vertices.push(vec4(-1.0, 0.0, 1.0, 1.0));
	
    vertices.push(vec4(1.0, 0.0, 1.0, 1.0));

    groundVertexCount = 4;
}

function addTubeVertices(innerRadius, outerRadius, height) {	
	for ( let yCount = 0; yCount < faceCount - 1; yCount++ )
	{
		let y1 = TUBE_Y_AXIS * yCount / faceCount;
		
		if (y1 / TUBE_Y_AXIS > height)
		{
			let lastY2 = TUBE_Y_AXIS * (yCount) / faceCount;
			sphereRadius = 5 - Math.log(lastY2 + 1);
			break;
		}
		
		else
		{
			let radius1 = 5 - Math.log(y1 + 1);
			
			let y2 = TUBE_Y_AXIS * (yCount + 1) / faceCount;

			let radius2 = 5 - Math.log(y2 + 1);
			
			for ( let xCount = 0; xCount < faceCount; xCount++ )
			{
				let theta1 = 2 * Math.PI * xCount / faceCount;
				let theta2 = 2 * Math.PI * (xCount + 1) / faceCount;
				
				
				// FIRST POINT
				let x1 = radius1 * Math.cos(theta1);
				let z1 = Math.sqrt(Math.pow(radius1, 2) - Math.pow(x1, 2));
				
				if ( Math.sin(theta1) > 0 )
					z1 *= -1 ;
				
				// SECOND POINT
				let x2 = radius2 * Math.cos(theta1);
				let z2 = Math.sqrt(Math.pow(radius2, 2) - Math.pow(x2, 2));
				
				if ( Math.sin(theta1) > 0 )
					z2 *= -1 ;
				
				// THIRD POINT
				let x3 = radius2 * Math.cos(theta2);
				let z3 = Math.sqrt(Math.pow(radius2, 2) - Math.pow(x3, 2));
				
				if ( Math.sin(theta2) > 0 )
					z3 *= -1 ;
				
				// FOURTH POINT
				let x4 = radius1 * Math.cos(theta2);
				let z4 = Math.sqrt(Math.pow(radius1, 2) - Math.pow(x4, 2));
				
				if ( Math.sin(theta2) > 0 )
					z4 *= -1 ;
				
				let vertex1 = vec4(x1/TUBE_Y_AXIS, y1/TUBE_Y_AXIS, z1/TUBE_Y_AXIS, 1.0);
				let vertex2 = vec4(x2/TUBE_Y_AXIS, y2/TUBE_Y_AXIS, z2/TUBE_Y_AXIS, 1.0);
				let vertex3 = vec4(x3/TUBE_Y_AXIS, y2/TUBE_Y_AXIS, z3/TUBE_Y_AXIS, 1.0);
				let vertex4 = vec4(x4/TUBE_Y_AXIS, y1/TUBE_Y_AXIS, z4/TUBE_Y_AXIS, 1.0);
				
				let normal1 = normalize(vec4( radius1 * Math.exp(5 - radius1) * Math.cos(theta1),
											radius1, 
											radius1 * Math.exp(5 - radius1) * Math.sin(theta1)));
								
				let normal2 = normalize(vec4( radius2 * Math.exp(5 - radius2) * Math.cos(theta1),
											radius2, 
											radius2 * Math.exp(5 - radius2) * Math.sin(theta1)));
				
				let normal3 = normalize(vec4( radius2 * Math.exp(5 - radius2) * Math.cos(theta2),
											radius2, 
											radius2 * Math.exp(5 - radius2) * Math.sin(theta2)));			
				
				let normal4 = normalize(vec4( radius1 * Math.exp(5 - radius1) * Math.cos(theta2),
											radius1, 
											radius1 * Math.exp(5 - radius1) * Math.sin(theta2)));	
											

				vertices.push(vertex1);
				vertices.push(vertex2);
				vertices.push(vertex3);
				vertices.push(vertex4);
				
				normalsArray.push(normal1);
				normalsArray.push(normal2);
				normalsArray.push(normal3);
				normalsArray.push(normal4);
				
				tubeVertexCount += 4;
			}
		}
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

function addSphereVertices(radius, height)
{
}

function drawGround() {
	// Change drawing color to green and draw the ground
    gl.uniform1i(gl.getUniformLocation(program, "green"), 1);
	
	if ( !wireframeOption )
	{
		gl.clearColor(0.53, 0.81, 0.94, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		for (var i = 0; i < groundVertexCount; i += 4)
		{
			gl.uniform4fv(vColor, flatten(green));
			gl.drawArrays( gl.TRIANGLE_STRIP, i, 4 );
		}
	}
	else
	{
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
		
	//console.log(vertices);
}

// Bottom tube has length: baseTubeLength
// Middle tube length has length: baseTubeLength * 2
// Top tube length has length: baseTubeLength * 3
function drawTrunk(trunkLengthScaleFactor) {
    let trunkTransformationMatrix;  // This is used when we want to scale an object but not want to save it in the stack

    // Change drawing color to brown and draw the rest
    gl.uniform1i(gl.getUniformLocation(program, "green"), 0);

    modelViewMatrix = mult(modelViewMatrix, treeStructure[0].relativeRotationMatrix);
    trunkTransformationMatrix = mult(modelViewMatrix, scale(1, trunkLengthScaleFactor, 1));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));

    // Bottom tube
	if ( wireframeOption )
	{
		for (var i = groundVertexCount; i < groundVertexCount + tubeVertexCount; i += 4)
		{
			gl.uniform4fv(vColor, flatten(white));
			gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
			gl.uniform4fv(vColor, flatten(black));
			gl.drawArrays( gl.LINE_LOOP, i, 4 );
		}
	
	}
	else
	{
		for(var i = groundVertexCount; i < groundVertexCount + tubeVertexCount; i += 4)
		{
			gl.uniform4fv(vColor, flatten(brown));
			gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
		}
	}

    // Cone on the top
    trunkTransformationMatrix = mult(modelViewMatrix, translate(0, baseTubeLength, 0));
    trunkTransformationMatrix = mult(trunkTransformationMatrix, scale(Math.pow(RADIUS_RATIO, 3), 6, Math.pow(RADIUS_RATIO, 3)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(trunkTransformationMatrix));
    gl.uniform4fv(vColor, flatten(brown));
	gl.drawArrays(gl.TRIANGLE_FAN, groundVertexCount + tubeVertexCount, coneVertexCount);
	
}

function drawLimb(rotationMatrix, parentLength, length, position, depth) {
    let limbTransformationMatrix;

    modelViewMatrix = ctmStack[ctmStack.length - 1];

    modelViewMatrix = mult(modelViewMatrix, translate(0, baseTubeLength * position * parentLength, 0));
    modelViewMatrix = mult(modelViewMatrix, rotationMatrix);
    limbTransformationMatrix = mult(modelViewMatrix, scale(Math.pow(RADIUS_RATIO, depth), length, Math.pow(RADIUS_RATIO, depth)))

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(limbTransformationMatrix));
	
	if ( wireframeOption )
	{
		for (var i = groundVertexCount; i < tubeVertexCount + groundVertexCount; i += 4)
		{
			gl.uniform4fv(vColor, flatten(white));
			gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
			gl.uniform4fv(vColor, flatten(black));
			gl.drawArrays( gl.LINE_LOOP, i, 4 );
		}
	}
	else
	{
		for(var i = groundVertexCount; i < tubeVertexCount + groundVertexCount; i += 4)
		{
			gl.uniform4fv(vColor, flatten(brown));
			gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
		}
	}
		
    //gl.drawArrays(gl.TRIANGLE_STRIP, groundVertexCount, tubeVertexCount);
}

function getRandomRotationAngles() {
    return [
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE),    // Between -max and +max
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE),    // Between -max and +max
        Math.floor(Math.random() * MAX_LIMB_ANGLE * 2 - MAX_LIMB_ANGLE)    // Between -max and +max
    ];
}

function randomizeTreeStructure() {
    treeStructure = [new Node(0, null, (Math.random() * TRUNK_LENGTH_MULTIPLIER_RANGE) + MIN_TRUNK_LENGTH_MULTIPLIER, 1, [0, 0, 0], "1")];
    selectedBranchNodeIndex = 0;

    let levelTwoNodeCount = Math.floor(Math.random() * MAX_LEVEL_TWO_NODES + MIN_LEVEL_TWO_NODES);

    for (let i = 0; i < levelTwoNodeCount; i++) {
        let newNode = new Node(
            1,
            0,
            Math.random() * (MAX_LIMB_LENGTH_LEVEL_TWO - MIN_LIMB_LENGTH_LEVEL_TWO) + MIN_LIMB_LENGTH_LEVEL_TWO,
            1.0,
            getRandomRotationAngles(),
            "1." + (i + 1));

        treeStructure.push(newNode);    // Add this child to the tree
        treeStructure[0].children.push(treeStructure.length - 1);   // Add this node's index to the parent's children indices

        let levelThreeNodeCount = Math.floor(Math.random() * MAX_LEVEL_THREE_NODES + MIN_LEVEL_THREE_NODES);
        for (let j = 0; j < levelThreeNodeCount; j++) {
            treeStructure.push(new Node(
                1,
                treeStructure[0].children[i],
                Math.random() * (MAX_LIMB_LENGTH_LEVEL_THREE - MIN_LIMB_LENGTH_LEVEL_THREE) + MIN_LIMB_LENGTH_LEVEL_THREE,
                Math.random() * (MAX_BRANCHING_POSITION - MIN_BRANCHING_POSITION) + MIN_BRANCHING_POSITION,
                getRandomRotationAngles(),
                "1." + (i + 1) + "." + (j + 1)));
            newNode.children.push(treeStructure.length - 1);
        }
    }

    displayDropDownMenus();
}

function drawTree(node) {
    if (!node.type) {
        drawTrunk(node.length);
    }
    else {
        drawLimb(node.relativeRotationMatrix, treeStructure[node.parent].length, node.length, node.position, ctmStack.length + 1);
    }

    // Push the CTM to the stack as we are going deeper
    ctmStack.push(modelViewMatrix);

    for (let i = 0; i < node.children.length; i++) {
        drawTree(treeStructure[node.children[i]]);
    }

    // Pop the CTM stack as we are going back to the parent
    ctmStack.pop();
}

function displayDropDownMenus() {
    displayLimbOptions(2, 0);
}

function displayBranchRotations(rotationAngles) {
    xRotationInputNum.value = rotationAngles[0];
    xRotationInputSlider.value = rotationAngles[0];
    yRotationInputNum.value = rotationAngles[1];
    yRotationInputSlider.value = rotationAngles[1];
    zRotationInputNum.value = rotationAngles[2];
    zRotationInputSlider.value = rotationAngles[2];
}

function displayLimbOptions(levelNo, parentNodeIndex) {
    let parentNode = treeStructure[parentNodeIndex];
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
            selectedBranchNodeIndex = parentNodeIndex;
        }

        // Display one level lower
        else {
            if (branchListElement.children.length !== levelNo)
                deleteDropDowns(branchListElement, levelNo + 1);
            let nodeIndex = parseInt(selectElement.value.substring(selectElement.value.lastIndexOf(".") + 1)) - 1;
            displayLimbOptions(levelNo + 1, parentNode.children[nodeIndex]);
            displayBranchRotations(treeStructure[parentNode.children[nodeIndex]].rotationAngles);
            selectedBranchNodeIndex = parentNode.children[nodeIndex];
        }
    });

    addOptionToDropdown(selectElement, "None");

    console.log(structuredClone(parentNode));
    for (let i = 0; i < parentNode.children.length; i++) {
        addOptionToDropdown(selectElement, treeStructure[parentNode.children[i]].name);
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
    for (let i = startingLevel; i <= branchListElement.children.length + 2; i++) {
        try {
            branchListElement.removeChild(document.getElementById("level-" + i + "-select"));
        }
        catch(e) {
            console.log("No HTML element found on level " + i);
        }
    }
}

function addKeyframe() {
    currentAnimation.keyFrames.push(structuredClone(treeStructure));
    currentAnimation.durations.push(parseFloat(document.getElementById("duration-input").value));
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
        setRotationDifferences(treeStructure[realNode.children[i]], currentAnimation.keyFrames[keyframeIndex - 1][firstKeyframeNode.children[i]], currentAnimation.keyFrames[keyframeIndex][secondKeyframeNode.children[i]]);
	}
}

function startAnimation() {
    if (currentAnimation.keyFrames.length < 2)
        return;

    treeStructure = structuredClone(currentAnimation.keyFrames[0]);
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
        deleteDropDowns(document.getElementById("branch-list"), 2);
        randomizeTreeStructure();
		render();
    });

    let increaseCameraAngleButton = document.getElementById("increase-camera-angle-button");
    increaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle += CAMERA_ANGLE_CHANGE_AMOUNT;
        eye = vec3(Math.sin(radians(cameraAngle)), EYE_HEIGHT, Math.cos(radians(cameraAngle)));
		render();
    });

    let decreaseCameraAngleButton = document.getElementById("decrease-camera-angle-button");
    decreaseCameraAngleButton.addEventListener("click", function () {
        cameraAngle -= CAMERA_ANGLE_CHANGE_AMOUNT;
        eye = vec3(Math.sin(radians(cameraAngle)), EYE_HEIGHT, Math.cos(radians(cameraAngle)));
		render();
    });
	
	let wireframeRender = document.getElementById("wireframe-render");
    wireframeRender.addEventListener("click", function () {
        renderShadingOption = 0;
		wireframeOption = 1;
		gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
		render();
    });
	
	let colorRender = document.getElementById("color-render");
    colorRender.addEventListener("click", function () {
        renderShadingOption = 0;
		wireframeOption = 0;
		gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
		render();
    });
	
	let shadingRender = document.getElementById("shading-render");
    shadingRender.addEventListener("click", function () {
        renderShadingOption = 1;
		wireframeOption = 0;
		gl.uniform1i(gl.getUniformLocation(program, "renderShadingOption"), renderShadingOption);
		render();
    });

    let addKeyframeButton = document.getElementById("add-keyframe-button");
    addKeyframeButton.addEventListener("click", function (event) {
        addKeyframe();
		render();
    });

    let startAnimationButton = document.getElementById("start-animation-button");
    startAnimationButton.addEventListener("click", function (event) {
        startAnimation();
		render();
    });

    let saveButton = document.getElementById("save-button");
    saveButton.addEventListener("click", function (event) {
        let jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAnimation));
        let linkElement = document.getElementById('download-link');

        linkElement.setAttribute("href", jsonString);
        linkElement.setAttribute("download", "scene_" + new Date().toLocaleString() + ".json");
        linkElement.click();
		render();
    });

    let loadButton = document.getElementById("load-button");
    loadButton.addEventListener("click", function (event) {
        currentAnimation = JSON.parse(uploadedJson);
		render();
    });

    let fileInputElement = document.getElementById("file-input");
    fileInputElement.addEventListener("change", function () {
        let reader = new FileReader();

        // When a new json is uploaded, the uploadedJson variable is updated
        reader.onload = function () {
            uploadedJson = reader.result;
        };

        reader.readAsText(this.files[0]);
		render();
    });

    let deleteLastKeyframeButton = document.getElementById("delete-last-keyframe-button");
    deleteLastKeyframeButton.addEventListener("click", function (event) {
        deleteLastKeyframe();
		render();
    });

    let deleteAllKeyframesButton = document.getElementById("delete-keyframes-button");
    deleteAllKeyframesButton.addEventListener("click", function (event) {
        currentAnimation = new Animation();
		render();
    });

    xRotationInputNum = document.getElementById("x-rotation-number");
    xRotationInputNum.addEventListener("change", function (event) {
        xRotationInputSlider.value = parseInt(xRotationInputNum.value);
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    xRotationInputSlider = document.getElementById("x-rotation-range");
    xRotationInputSlider.addEventListener("change", function (event) {
        xRotationInputNum.value = xRotationInputSlider.value;
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    yRotationInputNum = document.getElementById("y-rotation-number");
    yRotationInputNum.addEventListener("change", function (event) {
        yRotationInputSlider.value = yRotationInputNum.value;
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    yRotationInputSlider = document.getElementById("y-rotation-range");
    yRotationInputSlider.addEventListener("change", function (event) {
        yRotationInputNum.value = yRotationInputSlider.value;
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    zRotationInputNum = document.getElementById("z-rotation-number");
    zRotationInputNum.addEventListener("change", function (event) {
        zRotationInputSlider.value = zRotationInputNum.value;
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    zRotationInputSlider = document.getElementById("z-rotation-range");
    zRotationInputSlider.addEventListener("change", function (event) {
        zRotationInputNum.value = zRotationInputSlider.value;
        treeStructure[selectedBranchNodeIndex].rotationAngles = [parseInt(xRotationInputNum.value), parseInt(yRotationInputNum.value), parseInt(zRotationInputNum.value)];
        treeStructure[selectedBranchNodeIndex].relativeRotationMatrix = setRelativeRotationMatrix(treeStructure[selectedBranchNodeIndex].rotationAngles);
		render();
	});

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL isn't available");}

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.53, 0.81, 0.94, 1.0);
    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.POLYGON_OFFSET_FILL);
    //gl.polygonOffset(0.5, 0.5); 
	
	// Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
	vColor = gl.getUniformLocation(program, "vColor");

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
		
    // Create tree for hierarchy
    randomizeTreeStructure();

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

    // displayBranchRotations(selectedBranchNodeIndex.rotationAngles);   TODO: This breaks the rotation UI
    if (keyframeIndex !== -1)
        setRotationDifferences(treeStructure[0], currentAnimation.keyFrames[keyframeIndex - 1][0], currentAnimation.keyFrames[keyframeIndex][0]);
    drawTree(treeStructure[0]);

    //requestAnimFrame(render);
}