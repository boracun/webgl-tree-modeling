class Node {
    type;
    length;
    position;   // 0 to 1. Determines where on the parent the branch is positioned
    rotationAngles;
    relativeRotationMatrix;
    parent;     // The parent's index
    children;   // Array of indices that refer to the children
    name;   // Like 2.1

    constructor(type, parent, length, position, rotationAngles, name) {
        this.type = type;
        this.parent = parent;
        this.length = length;
        this.position = position;
        this.children = [];
        this.name = name;
        this.rotationAngles = rotationAngles;

        this.relativeRotationMatrix = setRelativeRotationMatrix(rotationAngles);
    }
}

class Animation {
    keyFrames;
    durations;

    constructor() {
        this.keyFrames = [];
        this.durations = [];
    }
}

function setRelativeRotationMatrix(rotationAngles) {
    let relativeRotationMatrix = mult(rotate(rotationAngles[2], [0, 0, 1]), rotate(rotationAngles[1], [0, 1, 0]));
    relativeRotationMatrix = mult(relativeRotationMatrix, rotate(rotationAngles[0], [1, 0, 0]));

    return relativeRotationMatrix;
}