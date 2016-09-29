/* global p2, Point, Morph, SpriteMorph, radians, StageMorph, IDE_Morph, degrees */
// This file defines the physics engine that is used in netsblox.
// That is, this is the netsblox object that interfaces with the
// stage and the matterjs physics engine

"use strict";

modules.physics = '2016-September-1';

var PhysicsEngine;
var PhysicsMorph;
var CLONE_ID = 0;

PhysicsEngine = function(stage) {
    this.world = new p2.World({
        gravity: [0, -9.78]
    });
    this.sprites = {};
    this.clones = {};
    this.bodies = {};
    this.morphs = {};
    this.ground = null;
    this.stage = stage;

    this.enableGround();
    this.lastUpdated = Date.now();
};

PhysicsEngine.prototype.addSprite = function(sprite) {
    sprite.addPhysicsBody(this.world);

    var name = this._getSpriteName(sprite);
    this.sprites[name] = sprite;
}

PhysicsEngine.prototype.step = function() {
    var time = Date.now(),  // in milliseconds
        delta = (time - this.lastUpdated) * 0.001,
        names;  // in seconds

    this.lastUpdated = time;
    if (delta < 0.1) {
        this.world.step(delta);

        names = Object.keys(this.sprites);
        for (var i = names.length; i--;) {
            this.sprites[names[i]].updateMorphic();
        }

        names = Object.keys(this.morphs);
        for (var i = names.length; i--;) {
            this.morphs[names[i]].updateMorphic();
        }
    }
};

PhysicsEngine.prototype.enableGround = function() {
    var shape;

    shape = new p2.Box({
        width: 200,
        height: 50
    });

    this.ground = new p2.Body({
        mass: 0,
        position: [-110, -100],
        angle: -0.1
    });

    this.ground.addShape(shape);
    this.world.addBody(this.ground);

    var morph = new PhysicsMorph(this.ground);
    this.morphs['_ground'] = morph;
    this.stage.addBack(morph);
    morph.updateMorphic();
};

PhysicsEngine.prototype.removeSprite = function(sprite) {
    var name = this._getSpriteName(sprite);

    // remove clone if necessary
    if (this.sprites[name].isClone) {
        delete this.clones[name];
    }

    this.world.removeBody(this.bodies[name]);
    delete this.bodies[name];
    delete this.sprites[name];
    delete this.morphs[name];

    console.log('sprite removed', name);
};

PhysicsEngine.prototype._getCloneName = function(/*sprite*/) {
    return '__clone__' + (++CLONE_ID);
};

PhysicsEngine.prototype._getSpriteName = function(sprite) {
    if (!sprite.isClone) {
        return sprite.name;
    }
    // Compare to the values in the clones list
    // ... if only js supported non-hash maps
    var names = Object.keys(this.clones);
    for (var i = names.length; i--;) {
        if (this.clones[names[i]] === sprite) {
            return names[i];
        }
    }
    return null;
};

PhysicsEngine.prototype.updateSpriteName = function(oldName, newName) {
    // console.log('updateSpriteName', oldName, newName);
    if (oldName !== newName) {
        this.bodies[newName] = this.bodies[oldName];
        delete this.bodies[oldName];

        this.sprites[newName] = this.sprites[oldName];
        delete this.sprites[oldName];
    }
};

// ------- PhysicsMorph -------

PhysicsMorph.prototype = new Morph();
PhysicsMorph.prototype.constructor = PhysicsMorph;
PhysicsMorph.uber = Morph.prototype;

function PhysicsMorph(physicsBody) {
    this.init(physicsBody);
};

PhysicsMorph.prototype.init = function(physicsBody) {
    this.physicsBody = physicsBody;
    PhysicsMorph.uber.init.call(this);
};

PhysicsMorph.prototype.drawNew = function() {
    var stage = this.parentThatIsA(StageMorph),
        scale = 1;
    if (stage) {
        scale = stage.scale;
        var aabb = this.physicsBody.getAABB();
        this.silentSetExtent(new Point(scale * (aabb.upperBound[0] - aabb.lowerBound[0]),
            scale * (aabb.upperBound[1] - aabb.lowerBound[1])));
    }

    this.image = newCanvas(this.extent());
    var context = this.image.getContext('2d'),
        bodyAngle = this.physicsBody.angle,
        bodySin = Math.sin(bodyAngle),
        bodyCos = Math.cos(bodyAngle),
        bodyPos = this.physicsBody.position,
        aabb = this.physicsBody.getAABB(),
        xOffset = bodyPos[0] - aabb.lowerBound[0],
        yOffset = aabb.upperBound[1] - bodyPos[1];

    context.fillStyle = new Color(0, 255, 0, 0.1);
    context.strokeStyle = new Color(0, 0, 0, 0.7);
    this.physicsBody.shapes.forEach(function(shape) {
        // console.log(shape.position, bodyAngle);

        var v = shape.vertices,
            x = xOffset + bodyCos*shape.position[0] + bodySin*shape.position[1],
            y = yOffset - bodySin*shape.position[0] + bodyCos*shape.position[1],
            s = Math.sin(bodyAngle + shape.angle),
            c = Math.cos(bodyAngle + shape.angle);

        context.beginPath();
        context.moveTo(scale * (x + c*v[0][0] + s*v[0][1]), scale * (y - s*v[0][0] + c*v[0][1]));
        for (var i = 1; i < v.length; i++) {
            context.lineTo(scale * (x + c*v[i][0] + s*v[i][1]), scale * (y - s*v[i][0] + c*v[i][1]));
        }
        context.closePath();
        context.fill();
        context.stroke();
    });

    context.strokeStyle = new Color(255, 0, 0, 0.5);
    context.beginPath();
    context.rect(0, 0, this.width(), this.height());
    context.stroke();
};

PhysicsMorph.prototype.updateMorphic = function() {
    var stage = this.parentThatIsA(StageMorph);
    if (!stage) {
        return;
    }

    var aabb = this.physicsBody.getAABB(),
        center = stage.center(),
        scale = stage.scale;

    // console.log('PhysicsMorph.updateMorphic', aabb.lowerBound, aabb.upperBound, this.body.position);

    this.setPosition(new Point(center.x + aabb.lowerBound[0] * scale,
        center.y - aabb.upperBound[1] * scale));
    this.drawNew();
    this.changed();
};

// ------- SpriteMorph -------

SpriteMorph.prototype.addPhysicsBody = function(world) {
    var shape = this.getPhysicsShape(),
        body = new p2.Body({
            mass: 1,
            position: [this.xPosition(), this.yPosition()],
            angle: radians(-this.direction() + 90)
        });

    body.addShape(shape);
    shape = new p2.Box({
        width: 30,
        height: 10
    });
    body.addShape(shape);
    shape.position[0] = 45;

    console.log('sprite added', name);
    this.physicsBody = body;
    world.addBody(body);

    var morph = new PhysicsMorph(body);
    this.parentThatIsA(StageMorph).addBack(morph);
    morph.updateMorphic();

    body.morph = morph;
};

SpriteMorph.prototype.getPhysicsShape = function() {
    var cxt = this.image.getContext('2d'),
        //width = this.image.width,
        //height = this.image.height,
        // FIXME: Add the precise bounding box support
        image = this.costume || this.image,
        width = this.costume ? this.costume.width() : this.image.width,
        height = this.costume ? this.costume.height() : this.image.height,
        data = cxt.getImageData(1, 1, width, height).data,
        granularity = 1,
        vertices = [],
        shape,
        row = 0,
        col = 0,
        index,
        isEmpty;

    console.log(this.constume);
    console.log(this.image);

    // Get the left most points for every row of pixels
    while (row < height) {

        // get the first non-zero column
        col = -1;
        isEmpty = true;
        while (col < width && isEmpty) {
            col++;
            index = row*width*4 + col*4;
            isEmpty = !(data[index] + data[index+1] + data[index+2] + data[index+3]);
        }
        if (!isEmpty) {
            vertices.unshift([col, row]);
        }

        row += granularity;
    }

    // Get the right most points for every row of pixels
    row = height - 1;
    while (row > 0) {

        // get the last non-zero place
        col = width;
        isEmpty = true;
        while (col > 0 && isEmpty) {
            col--;
            index = row*width*4 + col*4;
            isEmpty = !(data[index] + data[index+1] + data[index+2] + data[index+3]);
        }
        if (!isEmpty) {
            vertices.unshift([col, row]);
        }

        row -= granularity;
    }

    // Create a custom shape from this
    shape = new p2.Convex({
        vertices: vertices
    });

    //return shape;
    return new p2.Box({
        width: height,
        height: width
    });
};

SpriteMorph.prototype.updatePhysics = function() {
    var body = this.physicsBody;
    if (!body) {
        return;
    }

    body.position[0] = this.xPosition();
    body.position[1] = this.yPosition();
    body.aabbNeedsUpdate = true; 
    body.angle = radians(-this.direction() + 90);

    if (body.morph) {
        body.morph.updateMorphic();
    }
}

SpriteMorph.prototype.updateMorphic = function() {
    if (this.isPickedUp()) {
        return;
    }

    var position = this.physicsBody.position,
        angle = this.physicsBody.angle;

    this.prePhysicsGotoXY(position[0], position[1]);
    this.prePhysicsSetHeading(-degrees(angle) + 90);
}

SpriteMorph.prototype.prePhysicsJustDropped = SpriteMorph.prototype.justDropped;
SpriteMorph.prototype.justDropped = function () {
    this.prePhysicsJustDropped();
    this.updatePhysics();
};

SpriteMorph.prototype.prePhysicsGotoXY = SpriteMorph.prototype.gotoXY;
SpriteMorph.prototype.gotoXY = function(x, y, justMe) {
    this.prePhysicsGotoXY(x, y, justMe);
    this.updatePhysics();
};

SpriteMorph.prototype.prePhysicsSetHeading = SpriteMorph.prototype.setHeading;
SpriteMorph.prototype.setHeading = function(degrees) {
    this.prePhysicsSetHeading(degrees);
    this.updatePhysics();
};

SpriteMorph.prototype.prePhysicsForward = SpriteMorph.prototype.forward;
SpriteMorph.prototype.forward = function(steps) {
    this.prePhysicsForward(steps);
    this.updatePhysics();
};

SpriteMorph.prototype._setName = SpriteMorph.prototype.setName;
SpriteMorph.prototype.setName = function(name) {
    var oldName = this.name,
        stage = this.parentThatIsA(StageMorph);

    this._setName(name);

    // Update the PhysicsEngine
    stage.physics.updateSpriteName(oldName, name);
};

SpriteMorph.prototype.mass = function() {
    return this.physicsBody.mass;
};

SpriteMorph.prototype.setMass = function(mass) {
    this.physicsBody.mass = +mass;
    this.physicsBody.updateMassProperties();
};

SpriteMorph.prototype.applyForce = function(force, direction) {
    var r = radians(-direction + 90);
    this.physicsBody.applyForce([force*Math.cos(r), force*Math.sin(r)]);
};

SpriteMorph.prototype.applyForceForward = function(force) {
    this.applyForce(force, this.direction());
};

SpriteMorph.prototype.angularForce = function(torque) {
    this.physicsBody.angularForce -= +torque;
};

SpriteMorph.prototype.angularForceLeft = function(torque) {
    this.angularForce(-torque);
};

SpriteMorph.prototype.prePhysicsUserMenu = SpriteMorph.prototype.userMenu;
SpriteMorph.prototype.userMenu = function() {
    var menu = this.prePhysicsUserMenu();
    menu.addItem("debug", "debug");
    return menu;
}

SpriteMorph.prototype.debug = function() {
    console.log('costume', this.costume);
    console.log('image', this.image);

    var stage = this.parentThatIsA(StageMorph),
        name = stage.physics._getSpriteName(this),
        body = stage.physics.bodies[name];
    // console.log('body', body);
    console.log('body.position', body.position);
}

// ------- StageMorph -------

StageMorph.prototype.prePhysicsInit = StageMorph.prototype.init;
StageMorph.prototype.init = function(globals) {
    this.prePhysicsInit(globals);
    this.physics = new PhysicsEngine(this);
};


StageMorph.prototype.prePhysicsStep = StageMorph.prototype.step;
StageMorph.prototype.step = function() {
    this.prePhysicsStep();
    if (this.physics.engaged) {
        this.physics.step();
    }
};

// ------- SpriteIconMorph -------

SpriteIconMorph.prototype.prePhysicsUserMenu = SpriteIconMorph.prototype.userMenu;
SpriteIconMorph.prototype.userMenu = function() {
    var menu = this.prePhysicsUserMenu(),
        object = this.object;

    if (object instanceof StageMorph || object instanceof SpriteMorph) {
        menu.addItem("debug", function() {
            object.debug();
        });
    }
    return menu;
}
