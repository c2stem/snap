/* This file defines the physics engine extending Snap */

"use strict";

modules.physics = '2016-September-1';

var PhysicsEngine;
var PhysicsMorph;

// ------- PhysicsEngine -------

PhysicsEngine = function (stage) {
    this.world = new p2.World({
        gravity: [0, -9.78]
    });
    this.ground = null;
    this.stage = stage;

    this.elapsed = 0;
    this.lastUpdated = Date.now();
};

PhysicsEngine.prototype.addSprite = function (sprite) {
    sprite.enablePhysics(this.world);
};

PhysicsEngine.prototype.step = function () {
    var time = Date.now(), // in milliseconds
        delta = (time - this.lastUpdated) * 0.001;

    this.lastUpdated = time;
    if (delta < 0.1) {
        this.world.step(delta);
        this.stage.updateMorphic();
        this.elapsed = delta;
    } else {
        this.elapsed = 0;
    }
};

PhysicsEngine.prototype.enableGround = function () {
    var shape = new p2.Box({
            width: 2000,
            height: 20
        }),
        body = new p2.Body({
            mass: 0,
            position: [0, -175],
            angle: 0
        });
    body.addShape(shape);
    this.world.addBody(body);
    this.ground = new PhysicsMorph(body);
    this.stage.addBack(this.ground);
    this.ground.updateMorphic();
};

// ------- PhysicsMorph -------

PhysicsMorph = function (physicsBody) {
    this.init(physicsBody);
};

PhysicsMorph.prototype = new Morph();
PhysicsMorph.prototype.constructor = PhysicsMorph;
PhysicsMorph.uber = Morph.prototype;

PhysicsMorph.prototype.init = function (physicsBody) {
    this.physicsBody = physicsBody;
    PhysicsMorph.uber.init.call(this);
};

PhysicsMorph.prototype.drawNew = function () {
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
    this.physicsBody.shapes.forEach(function (shape) {
        // console.log(shape.position, bodyAngle);

        var v = shape.vertices,
            x = xOffset + bodyCos * shape.position[0] + bodySin * shape.position[1],
            y = yOffset - bodySin * shape.position[0] + bodyCos * shape.position[1],
            s = Math.sin(bodyAngle + shape.angle),
            c = Math.cos(bodyAngle + shape.angle);

        context.beginPath();
        context.moveTo(scale * (x + c * v[0][0] + s * v[0][1]), scale * (y - s * v[0][0] + c * v[0][1]));
        for (var i = 1; i < v.length; i++) {
            context.lineTo(scale * (x + c * v[i][0] + s * v[i][1]), scale * (y - s * v[i][0] + c * v[i][1]));
        }
        context.closePath();
        context.fill();
        context.stroke();
    });

    // context.strokeStyle = new Color(255, 0, 0, 0.5);
    // context.beginPath();
    // context.rect(0, 0, this.width(), this.height());
    // context.stroke();
};

PhysicsMorph.prototype.updateMorphic = function () {
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

PhysicsMorph.prototype.destroy = function () {
    var body = this.physicsBody;
    if (body && body.world) {
        body.world.removeBody(body);
    }

    PhysicsMorph.uber.destroy.call(this);
};

PhysicsMorph.prototype.userMenu = function () {
    var ide = this.parentThatIsA(IDE_Morph),
        menu = new MenuMorph(this);

    menu.addItem("delete", 'destroy');
    menu.addItem("redraw", 'drawNew');
    menu.addItem("update morphic", "updateMorphic");
    menu.addItem("update physics", "updatePhisics");

    return menu;
};

// ------- SpriteMorph -------

SpriteMorph.prototype.phyInit = SpriteMorph.prototype.init;
SpriteMorph.prototype.init = function (globals) {
    this.phyInit(globals);

    var p = SpriteMorph.prototype;

    p.categories.push('physics');
    p.blockColor.physics = new Color(100, 140, 250);

    p.blocks.angularForce = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply %clockwise torque of %n',
        defaults: [2000]
    };
    p.blocks.angularForceLeft = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply %counterclockwise torque of %n',
        defaults: [2000]
    };
    p.blocks.applyForceForward = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force of %n',
        defaults: [2000]
    };
    p.blocks.applyForce = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force %n in direction %dir',
        defaults: [50]
    };
    p.blocks.setMass = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set mass to %n',
        defaults: [200]
    };
    p.blocks.mass = {
        only: SpriteMorph,
        type: 'reporter',
        category: 'physics',
        spec: 'mass'
    };
    p.blocks.elapsedTime = {
        type: 'reporter',
        category: 'physics',
        spec: 'old Δt'
    };
    p.blocks.updateDeltaT = {
        type: 'command',
        category: 'physics',
        spec: 'simulate for %upvar %c',
        defaults: ['Δt']
    };
}

SpriteMorph.prototype.isPhysicsEnabled = function () {
    return this.physicsBody;
};

SpriteMorph.prototype.enablePhysics = function () {
    var stage = this.parentThatIsA(StageMorph);
    if (!stage || this.physicsBody) {
        return;
    }

    var body = this.getPhysicsContour();
    this.physicsBody = body;
    stage.physics.world.addBody(body);

    var morph = new PhysicsMorph(body);
    this.parentThatIsA(StageMorph).addBack(morph);
    morph.updateMorphic();

    body.morph = morph;
};

SpriteMorph.prototype.disablePhysics = function () {
    var body = this.physicsBody;
    if (body && body.world) {
        body.world.removeBody(body);

        if (body.morph) {
            body.morph.destroy();
        }
    }
    this.physicsBody = null;
};

// TODO: we need updateShapes
SpriteMorph.prototype.getPhysicsContour = function () {
    var body = new p2.Body({
        mass: 1,
        position: [this.xPosition(), this.yPosition()],
        angle: radians(-this.direction() + 90)
    });

    if (this.costume && typeof this.costume.loaded !== 'function') {
        body.addShape(new p2.Box({
            width: this.costume.width(),
            height: this.costume.height()
        }));
    } else {
        body.addShape(new p2.Convex({
            vertices: [
                [1, 0],
                [-30, 8],
                [-30, -8]
            ]
        }));
    }

    return body;
};

SpriteMorph.prototype.updatePhysics = function () {
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
};

SpriteMorph.prototype.updateMorphic = function () {
    if (this.isPickedUp() || !this.physicsBody) {
        return;
    }

    var position = this.physicsBody.position,
        angle = this.physicsBody.angle;

    this.phyGotoXY(position[0], position[1]);
    this.phySetHeading(-degrees(angle) + 90);
};

SpriteMorph.prototype.phyWearCostume = SpriteMorph.prototype.wearCostume;
SpriteMorph.prototype.wearCostume = function (costume) {
    this.disablePhysics();
    this.phyWearCostume(costume);
    this.enablePhysics();
};

SpriteMorph.prototype.phyDestroy = SpriteMorph.prototype.destroy;
SpriteMorph.prototype.destroy = function () {
    this.disablePhysics();
    this.phyDestroy();
};

SpriteMorph.prototype.phyJustDropped = SpriteMorph.prototype.justDropped;
SpriteMorph.prototype.justDropped = function () {
    this.phyJustDropped();
    this.updatePhysics();
};

SpriteMorph.prototype.phyGotoXY = SpriteMorph.prototype.gotoXY;
SpriteMorph.prototype.gotoXY = function (x, y, justMe) {
    this.phyGotoXY(x, y, justMe);
    this.updatePhysics();
};

SpriteMorph.prototype.phySetHeading = SpriteMorph.prototype.setHeading;
SpriteMorph.prototype.setHeading = function (degrees) {
    this.phySetHeading(degrees);
    this.updatePhysics();
};

SpriteMorph.prototype.phyForward = SpriteMorph.prototype.forward;
SpriteMorph.prototype.forward = function (steps) {
    this.phyForward(steps);
    this.updatePhysics();
};

SpriteMorph.prototype.mass = function () {
    return this.physicsBody.mass;
};

SpriteMorph.prototype.setMass = function (mass) {
    this.physicsBody.mass = +mass;
    this.physicsBody.updateMassProperties();
};

SpriteMorph.prototype.applyForce = function (force, direction) {
    var r = radians(-direction + 90);
    this.physicsBody.applyForce([force * Math.cos(r), force * Math.sin(r)]);
};

SpriteMorph.prototype.applyForceForward = function (force) {
    this.applyForce(force, this.direction());
};

SpriteMorph.prototype.angularForce = function (torque) {
    this.physicsBody.angularForce -= +torque;
};

SpriteMorph.prototype.angularForceLeft = function (torque) {
    this.angularForce(-torque);
};

SpriteMorph.prototype.elapsedTime = function () {
    var stage = this.parentThatIsA(StageMorph);
    if (stage && stage.physics) {
        return stage.physics.elapsed;
    } else
        return 0;
};

SpriteMorph.prototype.phyUserMenu = SpriteMorph.prototype.userMenu;
SpriteMorph.prototype.userMenu = function () {
    var menu = this.phyUserMenu();
    menu.addItem("debug", "debug");
    return menu;
};

SpriteMorph.prototype.debug = function () {
    console.log('costume', this.costume);
    console.log('image', this.image);
    console.log('body.position', this.physicsBody.position);
};

// ------- IDE_Morph -------

IDE_Morph.prototype.phyCreateStage = IDE_Morph.prototype.createStage;
IDE_Morph.prototype.createStage = function () {
    this.phyCreateStage();
    this.stage.physics.enableGround();
}

IDE_Morph.prototype.phyCreateSpriteBar = IDE_Morph.prototype.createSpriteBar;
IDE_Morph.prototype.createSpriteBar = function () {
    this.phyCreateSpriteBar();

    var myself = this,
        physics = new ToggleMorph(
            'checkbox',
            null,
            function () {
                var sprite = myself.currentSprite;
                if (sprite.isPhysicsEnabled()) {
                    sprite.disablePhysics();
                } else {
                    sprite.enablePhysics();
                }
            },
            localize('enable physics'),
            function () {
                return myself.currentSprite instanceof SpriteMorph &&
                    myself.currentSprite.isPhysicsEnabled();
            }
        );
    physics.label.isBold = false;
    physics.label.setColor(this.buttonLabelColor);
    physics.color = this.tabColors[2];
    physics.highlightColor = this.tabColors[0];
    physics.pressColor = this.tabColors[1];
    physics.tick.shadowOffset = MorphicPreferences.isFlat ?
        new Point() : new Point(-1, -1);
    physics.tick.shadowColor = new Color();
    physics.tick.color = this.buttonLabelColor;
    physics.tick.isBold = false;
    physics.tick.drawNew();
    physics.setPosition(this.spriteBar.position().add(new Point(210, 8)));
    physics.drawNew();
    this.spriteBar.add(physics);
    if (this.currentSprite instanceof StageMorph) {
        physics.hide();
    }
}

// ------- StageMorph -------

StageMorph.prototype.phyInit = StageMorph.prototype.init;
StageMorph.prototype.init = function (globals) {
    this.phyInit(globals);
    this.physics = new PhysicsEngine(this);
};

StageMorph.prototype.updateMorphic = function () {
    this.children.forEach(function (morph) {
        if (morph.updateMorphic) {
            morph.updateMorphic();
        }
    });
};

StageMorph.prototype.phyStep = StageMorph.prototype.step;
StageMorph.prototype.step = function () {
    this.phyStep();
    if (this.physics.engaged) {
        this.physics.step(this);
    }
};

StageMorph.prototype.addPhysicsFloor = function () {
    this.physics.enableGround();
};

// ------- SpriteIconMorph -------

SpriteIconMorph.prototype.phyUserMenu = SpriteIconMorph.prototype.userMenu;
SpriteIconMorph.prototype.userMenu = function () {
    var menu = this.phyUserMenu(),
        object = this.object;

    if (object instanceof SpriteMorph) {
        menu.addItem("debug", function () {
            object.debug();
        });
    } else if (object instanceof StageMorph) {
        menu.addItem("add floor", function () {
            object.addPhysicsFloor();
        });
    }
    return menu;
}