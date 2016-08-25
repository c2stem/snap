/* global p2, Point, Morph, SpriteMorph, radians, StageMorph, IDE_Morph, degrees */
// This file defines the physics engine that is used in netsblox.
// That is, this is the netsblox object that interfaces with the
// stage and the matterjs physics engine
(function(globals) {
    'use strict';
    var CLONE_ID = 0;

    var PhysicsEngine = function() {
        this.world = new p2.World({
            gravity: [0, 9.8]
        });
        this.sprites = {};
        this.clones = {};
        this.bodies = {};
        this.ground = null;

        this.enableGround();
        this.lastUpdated = Date.now();
        this.lastDelta = 0;
    };

    PhysicsEngine.prototype.step = function() {
        var time = Date.now(),
            delta = (time - this.lastUpdated)/1000;  // TODO: fix the scaling
        this.lastUpdated = time;

        this.world.step(delta);
        this.updateUI();
    };

    PhysicsEngine.prototype.enableGround = function() {
        var height = 100,
            shape;

        shape = new p2.Box({
            width: 5000,
            height: height
        });

        this.ground = new p2.Body({
            mass: 0,
            position: [0, 180+height/2]
        });

        this.ground.addShape(shape);
        this.world.addBody(this.ground);
    };

    PhysicsEngine.prototype.updateUI = function() {
        var names = Object.keys(this.sprites);

        for (var i = names.length; i--;) {
            this._updateSpritePosition(this.sprites[names[i]], this.bodies[names[i]]);
            //this._updateSpriteDirection(this.sprites[names[i]], this.bodies[names[i]]);
            // TODO
        }

        // Update positions for each clone
        names = Object.keys(this.clones);
        // TODO
    };

    PhysicsEngine.prototype._updateSpritePosition = function(sprite, body) {
        var point,
            newX,
            newY,
            oldX,
            oldY,
            angle,
            direction;

        if (!sprite.isPickedUp()) {
            point = body.position;
            newX = point[0];
            newY = -point[1];  // engine is inverted; stage is not

            oldX = sprite.xPosition();
            oldY = sprite.yPosition();

            // Set the center and rotation for each sprite
            if (newX !== oldX || newY !== oldY) {
                sprite._gotoXY(newX, newY);
            }

            // Set the rotation for each sprite
            angle = body.angle % (2 * Math.PI);
            if (angle < 0) {
                angle += 2 * Math.PI;
            }
            direction = degrees(angle);
            if (this.round(sprite.direction(), 2) !== this.round(direction, 2)) {
                sprite.silentSetHeading(direction);
            }
        }
    };

    PhysicsEngine.prototype.round = function(num, places) {
        places = places || 0;
        var mult = Math.pow(10, places);
        return Math.round(num * mult)/mult;
    };

    PhysicsEngine.prototype.setDirection = function(sprite, degrees) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];
        if (body) {
            body.angle = radians(degrees);
        }
    };

    PhysicsEngine.prototype.updateSize = function(sprite) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];

        // Remove the old shape
        for (var i = body.shapes.length; i--;) {
            body.removeShape(body.shapes[0]);
        }

        // Add the new shape
        var shape = this.getShape(sprite);
        body.addShape(shape);
    };

    PhysicsEngine.prototype.addSprite = function(sprite) {
        var x = sprite.xPosition(),
            y = -sprite.yPosition(),  // engine is inverted; stage is not
            // TODO: Make this shape match the costume...
            // TODO: Set the mass to a reasonable amount
            shape = this.getShape(sprite),
            body = new p2.Body({
                mass: 1,
                position: [x, y]
            }),
            name = this._getSpriteName(sprite);

        body.addShape(shape);
        if (sprite.isClone) {
            // Create a unique id for the sprite
            name = this._getCloneName();
            this.clones[name] = sprite;
        }

        if (this.bodies[name]) {
            this.world.removeBody(this.bodies[name]);
        }

        console.log('sprite added', name);
        this.sprites[name] = sprite;
        this.bodies[name] = body;

        this.world.addBody(body);
    };

    PhysicsEngine.prototype.getShape = function(sprite) {
        var cxt = sprite.image.getContext('2d'),
            //width = sprite.image.width,
            //height = sprite.image.height,
            // FIXME: Add the precise bounding box support
            image = sprite.costume || sprite.image,
            width = sprite.costume ? sprite.costume.width() : sprite.image.width,
            height = sprite.costume ? sprite.costume.height() : sprite.image.height,
            data = cxt.getImageData(1, 1, width, height).data,
            granularity = 1,
            vertices = [],
            shape,
            row = 0,
            col = 0,
            index,
            isEmpty;

        console.log(sprite);
        console.log(sprite.constume);
        console.log(sprite.image);

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

    PhysicsEngine.prototype.removeSprite = function(sprite) {
        var name = this._getSpriteName(sprite);

        // remove clone if necessary
        if (this.sprites[name].isClone) {
            delete this.clones[name];
        }

        this.world.removeBody(this.bodies[name]);
        delete this.bodies[name];
        delete this.sprites[name];

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
        console.log('updateSpriteName', oldName, newName);
        console.log(new Error().stack);
        if (oldName !== newName) {
            this.bodies[newName] = this.bodies[oldName];
            delete this.bodies[oldName];

            this.sprites[newName] = this.sprites[oldName];
            delete this.sprites[oldName];
        }
    };


    PhysicsEngine.prototype.setPosition = function(sprite, x, y) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];
        if (body) {
            body.position = [x, -y];
        }
    };

    PhysicsEngine.prototype.applyForce = function(sprite, amt, angle) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name],
            rads;

        angle = -angle + 90;  // correct angle
        rads = radians(angle);
        // Get the direction
        body.applyForce([amt*Math.cos(rads), -amt*Math.sin(rads)]);
    };

    PhysicsEngine.prototype.setGravity = function(amt) {
        if (amt === 0 && this.ground) {
            this.world.removeBody(this.ground);
            this.ground = null;
        } else if (!this.ground){
            this.enableGround();
        }
        this.world.gravity = [0, amt];
    };

    PhysicsEngine.prototype.setMass = function(sprite, amt) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];

        body.mass = +amt;
        body.updateMassProperties();
    };

    PhysicsEngine.prototype.getMass = function(sprite) {
        var name = this._getSpriteName(sprite);
        return this.bodies[name].mass;
    };

    PhysicsEngine.prototype.angularForce = function(sprite, amt) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];
        body.angularForce += +amt;
    };

    PhysicsEngine.prototype.angularForceLeft = function(sprite, amt) {
        var name = this._getSpriteName(sprite),
            body = this.bodies[name];
        body.angularForce += -amt;
    };

    globals.PhysicsEngine = PhysicsEngine;

    // Overrides for SpriteMorph
    SpriteMorph.prototype.silentSetHeading = function(degrees) {
        // Bypass any position setting in the physics engine
        var x = this.xPosition(),
            y = this.yPosition(),
            dir = (+degrees || 0),
            turn = dir - this.heading;

        // apply to myself
        if (this.rotationStyle) {  // optimization, only redraw if rotatable
            this.changed();
            SpriteMorph.uber.setHeading.call(this, dir);

            var penState = this.isDown;
            this.isDown = false;
            this._gotoXY(x, y, true);  // just me
            this.isDown = penState;
            this.positionTalkBubble();
        } else {
            this.heading = parseFloat(degrees) % 360;
        }

        // propagate to my parts
        this.parts.forEach(function (part) {
            var pos = new Point(part.xPosition(), part.yPosition()),
                trg = pos.rotateBy(radians(turn), new Point(x, y));
            if (part.rotatesWithAnchor) {
                part.turn(turn);
            }
            part._gotoXY(trg.x, trg.y);
        });
    };

    SpriteMorph.prototype._setHeading = SpriteMorph.prototype.setHeading;
    SpriteMorph.prototype.setHeading = function(degrees) {
        var stage = this.parentThatIsA(StageMorph);
        // Update the physics engine
        stage.physics.setDirection(this, degrees);
    };

    SpriteMorph.prototype._setName = SpriteMorph.prototype.setName;
    SpriteMorph.prototype.setName = function(name) {
        var oldName = this.name,
            stage = this.parentThatIsA(StageMorph);

        this._setName(name);

        // Update the PhysicsEngine
        stage.physics.updateSpriteName(oldName, name);
    };

    SpriteMorph.prototype._gotoXY = SpriteMorph.prototype.gotoXY;
    SpriteMorph.prototype.gotoXY = function(x, y, justMe) {
        // Update the position of the object in the physics engine
        var stage = this.parentThatIsA(StageMorph);

        stage.physics.setPosition(this, x, y);
        this._gotoXY(x, y, justMe);
    };

    var oldStep = StageMorph.prototype.step;
    StageMorph.prototype.step = function() {
        // console.log(new Error().stack);
        oldStep.call(this);
        this.physics.step();
    };

    var superFn = SpriteMorph.prototype.setPosition;
    SpriteMorph.prototype.setPosition = function(pos) {
        superFn.call(this, pos);
        // Update the physics engine
        // TODO
    };

    SpriteMorph.prototype._wearCostume = SpriteMorph.prototype.wearCostume;
    SpriteMorph.prototype.xwearCostume = function(costume) {
        this._wearCostume(costume);
        // Update the shape
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.updateSize(this);
    };

    SpriteMorph.prototype.setGravity = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.setGravity(amt);
    };

    SpriteMorph.prototype.applyForce = function(amt, angle) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.applyForce(this, amt, angle);
    };

    SpriteMorph.prototype.applyForceForward = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.applyForce(this, amt, this.direction());
    };

    SpriteMorph.prototype.mass = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        return stage.physics.getMass(this, amt);
    };

    SpriteMorph.prototype.setMass = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.setMass(this, amt);
    };

    SpriteMorph.prototype.angularForce = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.angularForce(this, amt);
    };

    SpriteMorph.prototype.angularForceLeft = function(amt) {
        var stage = this.parentThatIsA(StageMorph);
        stage.physics.angularForceLeft(this, amt);
    };

    StageMorph.prototype.debug = function() {
        console.log('physics bodies:', this.physics.bodies);
        console.log('physics sprites:', this.physics.sprites);
    };

    SpriteMorph.prototype.debug = function() {
        console.log('costume', this.costume);
        console.log('image', this.image);
    }

})(this);
