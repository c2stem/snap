/* This file defines the physics engine extending Snap */

"use strict";

modules.physics = '2016-October-1';

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
        scale = stage.scale,
        pos = new Point(center.x + aabb.lowerBound[0] * scale,
            center.y - aabb.upperBound[1] * scale),
        delta = pos.subtract(this.topLeft());

    if (Math.abs(delta.x) >= 0.5 || Math.abs(delta.y) >= 0.5) {
        this.setPosition(pos);
        this.drawNew();
        this.changed();
    }
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

//PhysicsMorph.prototype.isRetinaEnabled = function() {
//    console.log("PhysicsMorph.isRetinaEnabled");
//    return false;
//}

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
        defaults: [1000]
    };
    blocks.angularForceLeft = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply %counterclockwise torque of %n',
        defaults: [1000]
    };
    blocks.applyForceForward = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force of %n',
        defaults: [1000]
    };
    blocks.applyForce = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'apply force %n in direction %dir',
        defaults: [100]
    };
    blocks.setMass = { // not enabled in objects.js
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'set mass to %n',
        defaults: [100]
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
    blocks.changeXVelocity = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'change x velocity by %n',
        defaults: [0]
    };
    blocks.changeYVelocity = {
        only: SpriteMorph,
        type: 'command',
        category: 'physics',
        spec: 'change y velocity by %n',
        defaults: [0]
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
    blocks.xGravity = {
        type: 'reporter',
        category: 'physics',
        spec: 'x gravity'
    };
    blocks.yGravity = {
        type: 'reporter',
        category: 'physics',
        spec: 'y gravity'
    };
    blocks.friction = {
        type: 'reporter',
        category: 'physics',
        spec: 'friction'
    };

    var labels = SnapSerializer.prototype.watcherLabels;
    // labels.mass = blocks.mass.spec;
    labels.xVelocity = blocks.xVelocity.spec;
    labels.yVelocity = blocks.yVelocity.spec;
    labels.deltaTime = blocks.deltaTime.spec;
};

SpriteMorph.prototype.initPhysicsBlocks();

SpriteMorph.prototype.deltaTime = function () {
    var stage = this.parentThatIsA(StageMorph);
    return (stage && stage.physicsElapsed) || 0;
};

SpriteMorph.prototype.xGravity = function () {
    var stage = this.parentThatIsA(StageMorph);
    return stage && stage.physicsWorld.gravity[0];
};

SpriteMorph.prototype.yGravity = function () {
    var stage = this.parentThatIsA(StageMorph);
    return stage && stage.physicsWorld.gravity[1];
};

SpriteMorph.prototype.friction = function () {
    var stage = this.parentThatIsA(StageMorph);
    return stage && stage.physicsWorld.defaultContactMaterial.friction;
};

SpriteMorph.prototype.setMass = function (m) {
    this.physicsMass = +m > 0 ? +m : 0.001;
    if (this.physicsBody) {
        this.physicsBody.mass = this.physicsMass;
        this.physicsBody.updateMassProperties();
    }
};

SpriteMorph.prototype.mass = function () {
    return this.physicsMass || 0;
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

SpriteMorph.prototype.changeXVelocity = function (delta) {
    this.setXVelocity(this.xVelocity() + (+delta || 0));
};

SpriteMorph.prototype.changeYVelocity = function (delta) {
    this.setYVelocity(this.yVelocity() + (+delta || 0));
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
    this.physicsMode = '';
    this.physicsBody = null;
    this.physicsMass = 100;
};

SpriteMorph.prototype.phyFullCopy = SpriteMorph.prototype.fullCopy;
SpriteMorph.prototype.fullCopy = function (forClone) {
    var s = this.phyFullCopy();
    s.physicsBody = null;
    return s;
};

SpriteMorph.prototype.updatePhysicsBody = function () {
    var body = this.physicsBody;
    // console.log("body", this.physicsMode, !!this.physicsBody, !!this.parentThatIsA(StageMorph));

    if (this.physicsMode) {
        var stage = this.parentThatIsA(StageMorph);
        if (stage && !body) {
            body = this.getPhysicsContour();
            if (body) {
                stage.physicsWorld.addBody(body);
                this.physicsBody = body;

                var morph = new PhysicsMorph(body);
                stage.addBack(morph);
                morph.updateMorphicPosition();
                body.morph = morph;
            }
        }

        if (body) {
            body.type = this.physicsMode === 'dynamic' ? p2.Body.DYNAMIC : p2.Body.STATIC;
            if (body.type === p2.Body.STATIC) {
                body.velocity[0] = 0;
                body.velocity[1] = 0;
                body.angularVelocity = 0;
                body.mass = Infinity;
                body.updateMassProperties();
            }
            else {
                body.mass = this.physicsMass;
                body.updateMassProperties();
            }
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
};

// TODO: we need updateShapes
SpriteMorph.prototype.getPhysicsContour = function () {
    if (this.costume && typeof this.costume.loaded === 'function') {
        return null;
    }

    var body = new p2.Body({
        position: [this.xPosition(), this.yPosition()],
        angle: radians(-this.direction() + 90),
        damping: 0
    });

    if (this.costume) {
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
    if (!body || this.phyMorphicUpdating) {
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
    this.phyMorphicUpdating = true;

    var position = this.physicsBody.position,
        heading = -degrees(this.physicsBody.angle) + 90;

    if (Math.abs(position[0] - this.xPosition()) >= 0.5 ||
        Math.abs(position[1] - this.yPosition()) >= 0.5) {
        this.phyGotoXY(position[0], position[1]);
    }

    if (Math.abs(this.heading - heading) >= 1 &&
        Math.abs(this.heading - heading) <= 359) {
        this.phySetHeading(heading);
    }

    this.phyMorphicUpdating = false;
};

SpriteMorph.prototype.phyWearCostume = SpriteMorph.prototype.wearCostume;
SpriteMorph.prototype.wearCostume = function (costume) {
    var loading = costume && typeof costume.loaded === 'function';
    // console.log("wearcostume", !!costume, loading, this.physicsMode, !!this.physicsBody);

    this.phyWearCostume(costume);
    if (!loading && this.physicsMode) {
        var mode = this.physicsMode;
        this.physicsMode = '';
        this.updatePhysicsBody();
        this.physicsMode = mode;
        this.updatePhysicsBody();
    }
};

SpriteMorph.prototype.phyDestroy = SpriteMorph.prototype.destroy;
SpriteMorph.prototype.destroy = function () {
    this.physicsMode = '';
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
    console.log('mode', this.physicsMode);
};

SpriteMorph.prototype.allHatBlocksForSimulation = function () {
    return this.scripts.children.filter(function (morph) {
        return morph.selector === 'doSimulationStep';
    });
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
    }
    return menu;
};

// ------- StageMorph -------

StageMorph.prototype.phyInit = StageMorph.prototype.init;
StageMorph.prototype.init = function (globals) {
    this.phyInit(globals);

    this.physicsWorld = new p2.World({
        gravity: [0, -9.81]
    });
    this.physicsWorld.useFrictionGravityOnZeroGravity = false;
    this.physicsWorld.setGlobalStiffness(1e18); // make it stiffer

    this.physicsElapsed = 0;
    this.physicsUpdated = Date.now();
    this.physicsFloor = null;
};

StageMorph.prototype.setPhysicsFloor = function (enable) {
    if (this.physicsFloor) {
        this.physicsFloor.destroy();
        this.physicsFloor = null;
    }

    if (enable) {
        var body = new p2.Body({
            mass: 0,
            position: [0, -175],
            angle: 0
        });
        body.addShape(new p2.Box({
            width: 2000,
            height: 20
        }));
        this.physicsWorld.addBody(body);
        this.physicsFloor = new PhysicsMorph(body);
        this.addBack(this.physicsFloor);
        this.physicsFloor.updateMorphicPosition();
    }
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
    // console.log("add", morph.physicsMode, !!morph.physicsBody);
    this.phyAdd(morph);
    if (morph.updatePhysicsBody) {
        morph.updatePhysicsBody();
    }
};

StageMorph.prototype.allHatBlocksForSimulation = SpriteMorph.prototype.allHatBlocksForSimulation;
StageMorph.prototype.deltaTime = SpriteMorph.prototype.deltaTime;
StageMorph.prototype.xGravity = SpriteMorph.prototype.xGravity;
StageMorph.prototype.yGravity = SpriteMorph.prototype.yGravity;
StageMorph.prototype.friction = SpriteMorph.prototype.friction;

// ------- PhysicTabMorph -------

PhysicsTabMorph.prototype = new ScrollFrameMorph();
PhysicsTabMorph.prototype.constructor = PhysicsTabMorph;
PhysicsTabMorph.uber = ScrollFrameMorph.prototype;

function PhysicsTabMorph(aSprite, sliderColor) {
    this.init(aSprite, sliderColor);
};

PhysicsTabMorph.prototype.init = function (aSprite, sliderColor) {
    PhysicsTabMorph.uber.init.call(this, null, null, sliderColor);
    this.acceptDrops = false;
    this.padding = 10;
    this.contents.acceptsDrops = false;
    var textColor = new Color(255, 255, 255);

    function inputField(string, object, getter, setter, lowerLimit, upperLimit, unit) {
        var entry = new AlignmentMorph('row', 4);
        entry.alignment = 'left';
        var text = new TextMorph(localize(string),
            10, null, true, null, 'right', 100);
        text.setColor(textColor);
        entry.add(text);

        if (typeof lowerLimit !== 'number') {
            lowerLimit = Number.MIN_VALUE;
        }
        if (typeof upperLimit !== 'number') {
            upperLimit = Number.MAX_VALUE;
        }

        var value = typeof object[getter] !== 'function' ? +object[getter] : +object[getter]();
        var field = new InputFieldMorph(value.toFixed(2), true, null, !setter);
        field.fixLayout();
        field.accept = function () {
            var value = +field.getValue();
            value = Math.min(Math.max(value, lowerLimit), upperLimit);
            if (typeof object[setter] === 'function') {
                object[setter](value);
            } else {
                object[setter] = value;
            }
            field.setContents(value.toFixed(2));
        };
        entry.add(field);

        if (unit) {
            var text = new TextMorph(localize(unit),
                10, null, true);
            text.setColor(textColor);
            entry.add(text);
        }

        entry.fixLayout();
        return entry;
    };

    function toggleField(string, object, getter, setter, radio) {
        var entry = new AlignmentMorph('row', 4);
        entry.alignment = 'left';

        var getter2 = typeof getter === 'function' ? getter :
            function () {
                return this[getter];
            };
        var field = new ToggleMorph(radio ? 'radiobutton' : 'checkbox',
            object, setter, string, getter2);
        field.label.setColor(textColor);
        entry.add(field);

        entry.fixLayout();
        entry.toggle = field;
        return entry;
    };

    var elems = new AlignmentMorph('column', 6);
    elems.alignment = 'left';
    elems.setColor(this.color);

    if (aSprite instanceof StageMorph) {
        var world = aSprite.physicsWorld;

        elems.add(inputField('gravity x:', world.gravity, 0, 0, -100, 100, 'm/s\u00b2'));
        elems.add(inputField('gravity y:', world.gravity, 1, 1, -100, 100, 'm/s\u00b2'));
        elems.add(inputField('friction:', world.defaultContactMaterial,
            'friction', 'friction', 0, 100));
        elems.add(inputField('restitution:', world.defaultContactMaterial,
            'restitution', 'restitution', 0, 1));
        elems.add(toggleField("enable ground", aSprite, 'physicsFloor',
            function () {
                this.setPhysicsFloor(!this.physicsFloor);
            }));
    } else if (aSprite instanceof SpriteMorph) {
        elems.add(inputField('mass:', aSprite, 'mass', 'setMass', 0, 1e6, 'kg'));

        var radioDisabled = toggleField("physics disabled", aSprite, function () {
                    return !this.physicsMode;
                },
                function () {
                    if (this.physicsMode) {
                        this.physicsMode = '';
                        radioStatic.toggle.refresh();
                        radioDynamic.toggle.refresh();
                        aSprite.updatePhysicsBody();
                    }
                }, true),
            radioStatic = toggleField("static object", aSprite, function () {
                    return this.physicsMode === 'static'
                },
                function () {
                    if (this.physicsMode !== 'static') {
                        this.physicsMode = 'static';
                        radioDisabled.toggle.refresh();
                        radioDynamic.toggle.refresh();
                        aSprite.updatePhysicsBody();
                    }
                }, true),
            radioDynamic = toggleField("dynamic object", aSprite, function () {
                    return this.physicsMode === 'dynamic'
                },
                function () {
                    if (this.physicsMode !== 'dynamic') {
                        this.physicsMode = 'dynamic';
                        radioDisabled.toggle.refresh();
                        radioStatic.toggle.refresh();
                        aSprite.updatePhysicsBody();
                    }
                }, true);

        elems.add(radioDisabled);
        elems.add(radioStatic);
        elems.add(radioDynamic);
    }

    elems.fixLayout();
    elems.setPosition(new Point(5, 5));
    this.add(elems);
};

PhysicsTabMorph.prototype.wantsDropOf = function (morph) {
    return false;
};

// ------- SnapSerializer -------

SnapSerializer.prototype.phyRawLoadProjectModel = SnapSerializer.prototype.rawLoadProjectModel;
SnapSerializer.prototype.rawLoadProjectModel = function (xmlNode) {
    var project = this.phyRawLoadProjectModel(xmlNode);
    project.stage.setPhysicsFloor(true);
    return project;
};

// ------- IDE_Morph -------

IDE_Morph.prototype.phyCreateStage = IDE_Morph.prototype.createStage;
IDE_Morph.prototype.createStage = function () {
    this.phyCreateStage();
    this.stage.setPhysicsFloor(true);
};

IDE_Morph.prototype.phyCreateSpriteEditor = IDE_Morph.prototype.createSpriteEditor;
IDE_Morph.prototype.createSpriteEditor = function () {
    if (this.currentTab === 'physics') {
        if (this.spriteEditor) {
            this.spriteEditor.destroy();
        }

        this.spriteEditor = new PhysicsTabMorph(this.currentSprite, this.sliderColor);
        this.spriteEditor.color = this.groupColor;
        this.add(this.spriteEditor);
    } else {
        this.phyCreateSpriteEditor();
    }
};