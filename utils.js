class Node {
    type;
    length;
    position;   // 0 to 1. Determines where on the parent the branch is positioned
    rotationAngles;
    relativeRotationMatrix;
    parent;
    children;
    name;   // Like 2.1

    constructor(type, parent, length, position, rotationAngles, name) {
        this.type = type;
        this.parent = parent;
        this.length = length;
        this.position = position;
        this.children = [];
        this.name = name;
        this.rotationAngles = rotationAngles;

        this.relativeRotationMatrix = mult(rotate(rotationAngles[2], [0, 0, 1]), rotate(rotationAngles[1], [0, 1, 0]));
        this.relativeRotationMatrix = mult(this.relativeRotationMatrix, rotate(rotationAngles[0], [1, 0, 0]));
    }
}

class Tree {
    rootNode;

    constructor() {
        this.rootNode = null;
    }
}