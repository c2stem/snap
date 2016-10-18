/* This file defines the physics engine extending Snap */

"use strict";

modules.physics = '2016-September-1';

// ------- PhysicsMorph -------

function PhysicsMorph(physicsBody) {
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

PhysicsMorph.prototype.updateMorphicPosition = function () {
    var stage = this.parentThatIsA(StageMorph);
    if (!stage) {
        return;
    }

    var aabb = this.physicsBody.getAABB(),
        center = stage.center(),
        scale = stage.scale;

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
    menu.addItem("update morphic", "updateMorphicPosition");
    menu.addItem("update physics", "updatePhisics");

    return menu;
};

// ------- SpriteMorph -------

SpriteMorph.prototype.categories.push('physics');
SpriteMorph.prototype.blockColor.physics = new Color(100, 140, 250);

SpriteMorph.prototype.initPhysicsBlocks = function () {
    var blocks = SpriteMorph.prototype.blocks;
    blocks.angularForce = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply %clockwise torque of %n',
        defaults: [2000]
    };
    blocks.angularForceLeft = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply %counterclockwise torque of %n',
        defaults: [2000]
    };
    blocks.applyForceForward = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force of %n',
        defaults: [2000]
    };
    blocks.applyForce = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force %n in direction %dir',
        defaults: [50]
    };
    blocks.setMass = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set mass to %n',
        defaults: [200]
    };
    blocks.mass = {
        only: SpriteMorph,
        type: 'reporter',
        category: 'physics',
        spec: 'mass'
    };
    blocks.setVelocity = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set velocity to x: %n y: %n',
        defaults: [0, 0]
    };
    blocks.setXVelocity = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set x velocity to %n',
        defaults: [0]
    };
    blocks.setYVelocity = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set y velocity to %n',
        defaults: [0]
    };
    blocks.xVelocity = {
        only: SpriteMorph,
        type: 'reporter',
        category: 'physics',
        spec: 'x velocity'
    };
    blocks.yVelocity = {
        only: SpriteMorph,
        type: 'reporter',
        category: 'physics',
        spec: 'y velocity'
    };
    blocks.deltaTime = {
        type: 'reporter',
        category: 'physics',
        spec: '\u2206t'
    };
    blocks.doSimulationStep = {
        type: 'hat',
        category: 'physics',
        spec: 'simulation step'
    };
}

SpriteMorph.prototype.initPhysicsBlocks();

SpriteMorph.prototype.deltaTime = function () {
    var stage = this.parentThatIsA(StageMorph);
    return (stage && stage.physicsElapsed) || 0;
};

SpriteMorph.prototype.setMass = function (m) {
    if (this.physicsBody) {
        if (+m > 0) {
            this.physicsBody.style = p2.Body.DYNAMIC;
            this.physicsBody.mass = +m;
            this.physicsBody.updateMassProperties();
        } else {
            this.physicsBody.style = p2.Body.STATIC;
            this.physicsBody.mass = 0;
        }
    } else {
        this.physicsMass = +m;
    }
};

SpriteMorph.prototype.mass = function () {
    if (this.physicsBody) {
        return this.physicsBody.mass;
    } else {
        return this.physicsMass || 0;
    }
};

SpriteMorph.prototype.setVelocity = function (vx, vy) {
    if (this.physicsBody) {
        this.physicsBody.velocity[0] = +vx;
        this.physicsBody.velocity[1] = +vy;
    } else {
        this.physicsXVelocity = +vx;
        this.physicsYVelocity = +vx;
    }
};

SpriteMorph.prototype.setXVelocity = function (v) {
    if (this.physicsBody) {
        this.physicsBody.velocity[0] = +v;
    } else {
        this.physicsXVelocity = +v;
    }
};

SpriteMorph.prototype.setYVelocity = function (v) {
    if (this.physicsBody) {
        this.physicsBody.velocity[1] = +v;
    } else {
        this.physicsYVelocity = +v;
    }
};

SpriteMorph.prototype.xVelocity = function () {
    if (this.physicsBody) {
        return this.physicsBody.velocity[0];
    } else {
        return this.physicsXVelocity || 0;
    }
};

SpriteMorph.prototype.yVelocity = function () {
    if (this.physicsBody) {
        return this.physicsBody.velocity[1];
    } else {
        return this.physicsYVelocity || 0;
    }
};

SpriteMorph.prototype.applyForce = function (force, direction) {
    if (this.physicsBody) {
        var r = radians(-direction + 90);
        this.physicsBody.applyForce([force * Math.cos(r), force * Math.sin(r)]);
    }
};

SpriteMorph.prototype.applyForceForward = function (force) {
    this.applyForce(force, this.direction());
};

SpriteMorph.prototype.angularForce = function (torque) {
    if (this.physicsBody) {
        this.physicsBody.angularForce -= +torque;
    }
};

SpriteMorph.prototype.angularForceLeft = function (torque) {
    this.angularForce(-torque);
};

SpriteMorph.prototype.phyInit = SpriteMorph.prototype.init;
SpriteMorph.prototype.init = function (globals) {
    this.phyInit(globals);
    this.isPhysicsEnabled = true;
    this.physicsBody = null;
}

SpriteMorph.prototype.phyFullCopy = SpriteMorph.prototype.fullCopy;
SpriteMorph.prototype.fullCopy = function (forClone) {
    var s = this.phyFullCopy();
    s.physicsBody = null;
    return s;
}

SpriteMorph.prototype.updatePhysicsBody = function () {
    var body = this.physicsBody;
    // console.log("body", this.isPhysicsEnabled, !!this.physicsBody, !!this.parentThatIsA(StageMorph));

    if (this.isPhysicsEnabled) {
        var stage = this.parentThatIsA(StageMorph);
        if (stage && !body) {
            body = this.getPhysicsContour();
            stage.physicsWorld.addBody(body);
            this.physicsBody = body;

            var morph = new PhysicsMorph(body);
            stage.addBack(morph);
            morph.updateMorphicPosition();
            body.morph = morph;
        }
    } else if (body) {
        if (body.world) {
            body.world.removeBody(body);

            if (body.morph) {
                body.morph.destroy();
            }
        }
        this.physicsBody = null;
    }
}

// TODO: we need updateShapes
SpriteMorph.prototype.getPhysicsContour = function () {
    var body = new p2.Body({
        mass: 1,
        position: [this.xPosition(), this.yPosition()],
        angle: radians(-this.direction() + 90),
        damping: 0
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

SpriteMorph.prototype.updatePhysicsPosition = function () {
    var body = this.physicsBody;
    if (!body) {
        return;
    }

    body.position[0] = this.xPosition();
    body.position[1] = this.yPosition();
    body.aabbNeedsUpdate = true;
    body.angle = radians(-this.direction() + 90);

    if (body.morph) {
        body.morph.updateMorphicPosition();
    }
};

SpriteMorph.prototype.updateMorphicPosition = function () {
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
    var loading = costume && typeof costume.loaded === 'function';
    // console.log("wearcostume", !!costume, loading, this.isPhysicsEnabled, !!this.physicsBody);

    this.phyWearCostume(costume);
    if (!loading && this.isPhysicsEnabled) {
        this.isPhysicsEnabled = false;
        this.updatePhysicsBody();
        this.isPhysicsEnabled = true;
        this.updatePhysicsBody();
    }
};

SpriteMorph.prototype.phyDestroy = SpriteMorph.prototype.destroy;
SpriteMorph.prototype.destroy = function () {
    this.isPhysicsEnabled = false;
    this.updatePhysicsBody();
    this.phyDestroy();
};

SpriteMorph.prototype.phyJustDropped = SpriteMorph.prototype.justDropped;
SpriteMorph.prototype.justDropped = function () {
    this.phyJustDropped();
    this.updatePhysicsPosition();
};

SpriteMorph.prototype.phyGotoXY = SpriteMorph.prototype.gotoXY;
SpriteMorph.prototype.gotoXY = function (x, y, justMe) {
    this.phyGotoXY(x, y, justMe);
    this.updatePhysicsPosition();
};

SpriteMorph.prototype.phyKeepWithin = SpriteMorph.prototype.keepWithin;
SpriteMorph.prototype.keepWithin = function (morph) {
    this.phyKeepWithin(morph);
    this.updatePhysicsPosition();
};

SpriteMorph.prototype.phySetHeading = SpriteMorph.prototype.setHeading;
SpriteMorph.prototype.setHeading = function (degrees) {
    this.phySetHeading(degrees);
    this.updatePhysicsPosition();
};

SpriteMorph.prototype.phyForward = SpriteMorph.prototype.forward;
SpriteMorph.prototype.forward = function (steps) {
    this.phyForward(steps);
    this.updatePhysicsPosition();
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
    console.log('body', this.physicsBody);
};

// ------- IDE_Morph -------

IDE_Morph.prototype.phyCreateStage = IDE_Morph.prototype.createStage;
IDE_Morph.prototype.createStage = function () {
    this.phyCreateStage();
    this.stage.addPhysicsFloor();
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
                sprite.isPhysicsEnabled = !sprite.isPhysicsEnabled;
                sprite.updatePhysicsBody();
            },
            localize('enable physics'),
            function () {
                return myself.currentSprite.isPhysicsEnabled;
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

SpriteMorph.prototype.allHatBlocksForSimulation = function () {
    return this.scripts.children.filter(function (morph) {
        return morph.selector === 'doSimulationStep';
    });
}

// ------- StageMorph -------

StageMorph.prototype.phyInit = StageMorph.prototype.init;
StageMorph.prototype.init = function (globals) {
    this.phyInit(globals);

    this.physicsWorld = new p2.World({
        gravity: [0, -9.81]
    });
    this.physicsElapsed = 0;
    this.physicsUpdated = Date.now();
    this.physicsGround = null;
};

StageMorph.prototype.addPhysicsFloor = function () {
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
    this.physicsWorld.addBody(body);
    this.physicsGround = new PhysicsMorph(body);
    this.addBack(this.physicsGround);
    this.physicsGround.updateMorphicPosition();
};

StageMorph.prototype.updateMorphicPosition = function () {
    this.children.forEach(function (morph) {
        if (morph.updateMorphicPosition) {
            morph.updateMorphicPosition();
        }
    });
};

StageMorph.prototype.phyStep = StageMorph.prototype.step;
StageMorph.prototype.step = function () {
    this.phyStep();
    if (this.physicsEngaged) {
        var time = Date.now(), // in milliseconds
            delta = (time - this.physicsUpdated) * 0.001;

        if (delta < 0.5) {
            var active = false,
                hats = this.allHatBlocksForSimulation();

            this.children.forEach(function (morph) {
                if (morph.allHatBlocksForSimulation)
                    hats = hats.concat(morph.allHatBlocksForSimulation());
            });

            for (var i = 0; !active && i < hats.length; i++) {
                active = this.threads.findProcess(hats[i]);
            }

            if (!active) {
                this.physicsWorld.step(delta);
                this.updateMorphicPosition();
                this.physicsElapsed = delta;
                this.physicsUpdated = time;

                for (var i = 0; i < hats.length; i++) {
                    this.threads.startProcess(hats[i], this.isThreadSafe);
                }
            }
        } else {
            this.physicsElapsed = 0;
            this.physicsUpdated = time;
        }
    }
};

StageMorph.prototype.phyAdd = StageMorph.prototype.add;
StageMorph.prototype.add = function (morph) {
    // console.log("add", morph.isPhysicsEnabled, !!morph.physicsBody);
    this.phyAdd(morph);
    if (morph.updatePhysicsBody) {
        morph.updatePhysicsBody();
    }
};

StageMorph.prototype.phySetExtent = StageMorph.prototype.setExtent;
StageMorph.prototype.setExtent = function (aPoint, silently) {
    this.phySetExtent(aPoint, silently);
    // this.addPhysicsFloor();
}

StageMorph.prototype.allHatBlocksForSimulation = SpriteMorph.prototype.allHatBlocksForSimulation;

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