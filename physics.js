/* This file defines the physics engine extending Snap */

"use strict";

modules.physics = "2016-November-28";

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
    aabb = this.physicsBody.getAABB(),
    scale = this.physicsScale();

  if (stage) {
    scale = scale * stage.scale;
  }

  this.silentSetExtent(
    new Point(
      scale * (aabb.upperBound[0] - aabb.lowerBound[0]),
      scale * (aabb.upperBound[1] - aabb.lowerBound[1])));

  this.image = newCanvas(this.extent());
  var context = this.image.getContext("2d"),
    bodyAngle = this.physicsBody.angle,
    bodySin = Math.sin(bodyAngle),
    bodyCos = Math.cos(bodyAngle),
    bodyPos = this.physicsBody.position,
    xOffset = bodyPos[0] - aabb.lowerBound[0],
    yOffset = aabb.upperBound[1] - bodyPos[1];

  context.fillStyle = new Color(0, 255, 0, 0.1);
  context.strokeStyle = new Color(0, 0, 0, 0.7);
  this.physicsBody.shapes.forEach(function (shape) {
    if (shape.type === p2.Shape.BOX || shape.type === p2.Shape.CONVEX) {
      var v = shape.vertices,
        x = xOffset + bodyCos * shape.position[0] -
        bodySin * shape.position[1],
        y = yOffset - bodySin * shape.position[0] -
        bodyCos * shape.position[1],
        s = Math.sin(bodyAngle + shape.angle),
        c = Math.cos(bodyAngle + shape.angle);

      context.beginPath();
      context.moveTo(
        scale * (x + c * v[0][0] + s * v[0][1]),
        scale * (y - s * v[0][0] + c * v[0][1]));
      for (var i = 1; i < v.length; i++) {
        context.lineTo(
          scale * (x + c * v[i][0] + s * v[i][1]),
          scale * (y - s * v[i][0] + c * v[i][1]));
      }
      context.closePath();
      context.fill();
      context.stroke();
    }
  });

  // context.strokeStyle = new Color(255, 0, 0, 0.5);
  // context.beginPath();
  // context.rect(0, 0, this.width(), this.height());
  // context.stroke();
};

PhysicsMorph.prototype.physicsScale = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.physicsScale) || 1.0;
};

PhysicsMorph.prototype.updateMorphicPosition = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (!stage) {
    return;
  }

  var aabb = this.physicsBody.getAABB(),
    center = stage.center(),
    scale = stage.scale * this.physicsScale(),
    pos = new Point(
      center.x + aabb.lowerBound[0] * scale,
      center.y - aabb.upperBound[1] * scale);

  this.setPosition(pos);
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
  var menu = new MenuMorph(this);

  menu.addItem("delete", "destroy");
  menu.addItem("redraw", "drawNew");
  menu.addItem("update morphic", "updateMorphicPosition");
  menu.addItem("update physics", "updatePhisics");

  return menu;
};

// ------- SpriteMorph -------

SpriteMorph.prototype.initPhysicsBlocks = function () {
  var physicsBlocks = {
    angularForce: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "apply %clockwise torque of %n",
      defaults: [1000]
    },
    angularForceLeft: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "apply %counterclockwise torque of %n",
      defaults: [1000]
    },
    applyForceForward: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "apply force of %n",
      defaults: [1000]
    },
    applyForce: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "apply force %n in direction %dir",
      defaults: [100]
    },
    setMass: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set mass to %n kg",
      defaults: [100]
    },
    mass: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "mass in kg"
    },
    setVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set velocity to x: %n y: %n m/s",
      defaults: [0, 0]
    },
    setXVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set x velocity to %n m/s",
      defaults: [0]
    },
    setYVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set y velocity to %n m/s",
      defaults: [0]
    },
    xVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "x velocity in m/s"
    },
    yVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "y velocity in m/s"
    },
    changeVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change velocity by x: %n y: %n m/s",
      defaults: [0, 0]
    },
    changeXVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change x velocity by %n m/s",
      defaults: [0]
    },
    changeYVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change y velocity by %n m/s",
      defaults: [0]
    },
    simulationTime: {
      type: "reporter",
      category: "physics",
      spec: "time in s"
    },
    deltaTime: {
      type: "reporter",
      category: "physics",
      spec: "\u2206t in s"
    },
    doSimulationStep: {
      type: "hat",
      category: "physics",
      spec: "simulation step"
    },
    xGravity: {
      type: "reporter",
      category: "physics",
      spec: "x gravity in m/s\u00b2"
    },
    yGravity: {
      type: "reporter",
      category: "physics",
      spec: "y gravity in m/s\u00b2"
    },
    friction: {
      type: "reporter",
      category: "physics",
      spec: "friction"
    },
    setPhysicsPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set position to x: %n y: %n m",
      defaults: [0, 0]
    },
    setPhysicsXPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set x position to %n m",
      defaults: [0]
    },
    setPhysicsYPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set y position to %n m",
      defaults: [0]
    },
    physicsXPosition: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "x position in m"
    },
    physicsYPosition: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "y position in m"
    },
    changePhysicsXPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change x position by %n m",
      defaults: [0]
    },
    changePhysicsYPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change y position by %n m",
      defaults: [0]
    },
    changePhysicsPosition: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change position by x: %n y: %n m",
      defaults: [0, 0]
    },
    setPhysicsAngle: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set angle to %n deg",
      defaults: [0]
    },
    changePhysicsAngle: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change angle by %n deg",
      defaults: [0]
    },
    physicsAngle: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "angle in deg"
    },
    setAngularVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "set angular velocity to %n deg/s",
      defaults: [0]
    },
    changeAngularVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "physics",
      spec: "change angular velocity by %n deg/s",
      defaults: [0]
    },
    angularVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "physics",
      spec: "angular velocity in deg/s"
    },
    startSimulation: {
      type: "command",
      category: "physics",
      spec: "start simulation"
    },
    stopSimulation: {
      type: "command",
      category: "physics",
      spec: "stop simulation"
    },
    runSimulationSteps: {
      type: "command",
      category: "physics",
      spec: "run simulation steps"
    },
    getPhysicsAttrOf: {
      type: "reporter",
      category: "physics",
      spec: "%phy of %spr",
      defaults: [
        ["x position"]
      ]
    },
    setPhysicsAttrOf: {
      type: "command",
      category: "physics",
      spec: "set %phy of %spr to %n",
      defaults: [
        ["x position"], null, [0]
      ]
    },
    graphData: {
      type: "reporter",
      category: "physics",
      spec: "graph data"
    },
    clearGraphData: {
      type: "command",
      category: "physics",
      spec: "clear graph data"
    },
    recordGraphData: {
      type: "command",
      category: "physics",
      spec: "record graph data"
    }
  };

  var spriteBlocks = SpriteMorph.prototype.blocks,
    watcherLabels = SnapSerializer.prototype.watcherLabels;

  for (var key in physicsBlocks) {
    spriteBlocks[key] = physicsBlocks[key];
    if (physicsBlocks[key].type === "reporter") {
      watcherLabels[key] = physicsBlocks[key].spec;
    }
  }
};

SpriteMorph.prototype.categories.push("physics");
SpriteMorph.prototype.blockColor.physics = new Color(100, 140, 250);

SpriteMorph.prototype.initPhysicsBlocks();

SpriteMorph.prototype.phyInitBlocks = SpriteMorph.prototype.initBlocks;
SpriteMorph.prototype.initBlocks = function () {
  SpriteMorph.prototype.phyInitBlocks();
  SpriteMorph.prototype.initPhysicsBlocks();
};

SpriteMorph.prototype.phyInit = SpriteMorph.prototype.init;
SpriteMorph.prototype.init = function (globals) {
  this.phyInit(globals);
  this.physicsMode = "";
  this.physicsBody = null;
  this.physicsMass = 100;
};

SpriteMorph.prototype.startSimulation = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (stage) {
    stage.startSimulation();
  }
};

SpriteMorph.prototype.stopSimulation = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (stage) {
    stage.stopSimulation();
  }
};

SpriteMorph.prototype.deltaTime = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.deltaTime()) || 0;
};

SpriteMorph.prototype.simulationTime = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.simulationTime()) || 0;
};

SpriteMorph.prototype.xGravity = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.xGravity()) || 0;
};

SpriteMorph.prototype.yGravity = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.yGravity()) || 0;
};

SpriteMorph.prototype.friction = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.friction()) || 0;
};

SpriteMorph.prototype.graphData = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.graphData()) || null;
};

SpriteMorph.prototype.clearGraphData = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (stage) {
    stage.clearGraphData();
  }
};

SpriteMorph.prototype.recordGraphData = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (stage) {
    stage.recordGraphData();
  }
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
  if (this.physicsBody && this.physicsMode === "dynamic") {
    this.physicsBody.velocity[0] = +vx;
    this.physicsBody.velocity[1] = +vy;
  } else {
    this.physicsXVelocity = +vx;
    this.physicsYVelocity = +vy;
  }
};

SpriteMorph.prototype.setXVelocity = function (v) {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    this.physicsBody.velocity[0] = +v;
  } else {
    this.physicsXVelocity = +v;
  }
};

SpriteMorph.prototype.setYVelocity = function (v) {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    this.physicsBody.velocity[1] = +v;
  } else {
    this.physicsYVelocity = +v;
  }
};

SpriteMorph.prototype.xVelocity = function () {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    return this.physicsBody.velocity[0];
  } else {
    return this.physicsXVelocity || 0;
  }
};

SpriteMorph.prototype.yVelocity = function () {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    return this.physicsBody.velocity[1];
  } else {
    return this.physicsYVelocity || 0;
  }
};

SpriteMorph.prototype.changeVelocity = function (dx, dy) {
  this.setVelocity(this.xVelocity() + (+dx || 0), this.yVelocity() + (+dy || 0));
};

SpriteMorph.prototype.changeXVelocity = function (delta) {
  this.setXVelocity(this.xVelocity() + (+delta || 0));
};

SpriteMorph.prototype.changeYVelocity = function (delta) {
  this.setYVelocity(this.yVelocity() + (+delta || 0));
};

SpriteMorph.prototype.physicsScale = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.physicsScale) || 1.0;
};

SpriteMorph.prototype.setPhysicsPosition = function (x, y) {
  this.gotoXY(+x * this.physicsScale(), +y * this.physicsScale());
};

SpriteMorph.prototype.setPhysicsXPosition = function (pos) {
  this.setXPosition(+pos * this.physicsScale());
};

SpriteMorph.prototype.setPhysicsYPosition = function (pos) {
  this.setYPosition(+pos * this.physicsScale());
};

SpriteMorph.prototype.changePhysicsXPosition = function (delta) {
  this.changeXPosition(+delta * this.physicsScale());
};

SpriteMorph.prototype.changePhysicsYPosition = function (delta) {
  this.changeYPosition(+delta * this.physicsScale());
};

SpriteMorph.prototype.changePhysicsPosition = function (dx, dy) {
  this.setPhysicsPosition(this.physicsXPosition() + dx, this.physicsYPosition() + dy);
};

SpriteMorph.prototype.physicsXPosition = function () {
  return this.xPosition() / this.physicsScale();
};

SpriteMorph.prototype.physicsYPosition = function () {
  return this.yPosition() / this.physicsScale();
};

SpriteMorph.prototype.setPhysicsAngle = function (angle) {
  var heading = -angle + 90;
  this.phySetHeading(heading);
  this.updatePhysicsPosition();
};

SpriteMorph.prototype.changePhysicsAngle = function (delta) {
  this.setPhysicsAngle(this.physicsAngle() + delta);
};

SpriteMorph.prototype.physicsAngle = function () {
  var angle = (-this.direction() + 90) % 360;
  return angle >= 0 ? angle : angle + 360;
};

SpriteMorph.prototype.setAngularVelocity = function (speed) {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    this.physicsBody.angularVelocity = radians(+speed);
  } else {
    this.physicsAngularVelocity = radians(+speed);
  }
};

SpriteMorph.prototype.changeAngularVelocity = function (delta) {
  this.setAngularVelocity(this.angularVelocity() + delta);
};

SpriteMorph.prototype.angularVelocity = function () {
  if (this.physicsBody && this.physicsMode === "dynamic") {
    return degrees(this.physicsBody.angularVelocity);
  } else {
    return degrees(this.physicsAngularVelocity) || 0;
  }
};

SpriteMorph.prototype.applyForce = function (
  force, direction) {
  if (this.physicsBody) {
    var r = radians(direction);
    this.physicsBody.applyForce([force * Math.cos(r), force * Math.sin(r)]);
  }
};

SpriteMorph.prototype.applyForceForward = function (force) {
  this.applyForce(force, -this.direction() + 90);
};

SpriteMorph.prototype.angularForce = function (torque) {
  if (this.physicsBody) {
    this.physicsBody.angularForce -= +torque;
  }
};

SpriteMorph.prototype.angularForceLeft = function (torque) {
  this.angularForce(-torque);
};

SpriteMorph.prototype.phyFullCopy = SpriteMorph.prototype.fullCopy;
SpriteMorph.prototype.fullCopy = function (forClone) {
  var s = this.phyFullCopy();
  s.physicsBody = null;
  return s;
};

SpriteMorph.prototype.updatePhysicsBody = function () {
  var body = this.physicsBody;
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
      body.type =
        this.physicsMode === "dynamic" ? p2.Body.DYNAMIC : p2.Body.STATIC;
      if (body.type === p2.Body.STATIC) {
        body.velocity[0] = 0;
        body.velocity[1] = 0;
        body.angularVelocity = 0;
        body.mass = Infinity;
        body.updateMassProperties();
      } else {
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
  if (this.costume && typeof this.costume.loaded === "function") {
    return null;
  }

  var scale = this.scale / this.physicsScale(),
    body = new p2.Body({
      position: [this.physicsXPosition(), this.physicsYPosition()],
      angle: radians(-this.direction() + 90),
      damping: 0
    });

  if (this.costume) {
    var offsetX = this.costume.width() * 0.5 - this.costume.rotationCenter.x;
    var offsetY = this.costume.height() * 0.5 - this.costume.rotationCenter.y;
    body.addShape(new p2.Box({
      width: this.costume.width() * scale,
      height: this.costume.height() * scale
    }), [offsetX * scale, -offsetY * scale]);
  } else {
    body.addShape(new p2.Convex({
      vertices: [
        [1 * scale, 0 * scale],
        [-30 * scale, 8 * scale],
        [-30 * scale, -8 * scale]
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

  body.position[0] = this.physicsXPosition();
  body.position[1] = this.physicsYPosition();
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

  var scale = this.physicsScale(),
    posX = this.physicsBody.position[0] * scale,
    posY = this.physicsBody.position[1] * scale,
    heading = -degrees(this.physicsBody.angle) + 90,
    delta = Math.abs(this.heading - heading) % 360;

  if (Math.abs(posX - this.xPosition()) >= 0.5 ||
    Math.abs(posY - this.yPosition()) >= 0.5) {
    this.phyGotoXY(posX, posY);
  }

  if (1 <= delta && delta <= 359) {
    this.phySetHeading(heading);
  }

  this.phyMorphicUpdating = false;
};

SpriteMorph.prototype.phyWearCostume = SpriteMorph.prototype.wearCostume;
SpriteMorph.prototype.wearCostume = function (costume) {
  var loading = costume && typeof costume.loaded === "function",
    mode = this.physicsMode;

  if (!loading && mode) {
    this.physicsMode = "";
    this.updatePhysicsBody();
  }

  this.phyWearCostume(costume);

  if (!loading && mode) {
    this.physicsMode = mode;
    this.updatePhysicsBody();
  }
};

SpriteMorph.prototype.phySetScale = SpriteMorph.prototype.setScale;
SpriteMorph.prototype.setScale = function (percentage) {
  var mode = this.physicsMode;

  if (mode) {
    this.physicsMode = "";
    this.updatePhysicsBody();
  }

  this.phySetScale(percentage);

  if (mode) {
    this.physicsMode = mode;
    this.updatePhysicsBody();
  }
};

SpriteMorph.prototype.phyDestroy = SpriteMorph.prototype.destroy;
SpriteMorph.prototype.destroy = function () {
  this.physicsMode = "";
  this.updatePhysicsBody();
  this.phyDestroy();
};

SpriteMorph.prototype.phyJustDropped = SpriteMorph.prototype.justDropped;
SpriteMorph.prototype.justDropped = function () {
  this.phyJustDropped();
  this.updatePhysicsPosition();

  var world = this.parentThatIsA(WorldMorph),
    stage = this.parentThatIsA(StageMorph);
  if (stage && world && world.hand && world.hand.phyPosTrace) {
    var trace = world.hand.phyPosTrace;
    if (trace.length >= 2) {
      var i = trace.length - 1,
        n = Date.now();
      while (i >= 1 && n - trace[i].t < 200) {
        i = i - 1;
      }

      var x = trace[trace.length - 1].x - trace[i].x,
        y = trace[trace.length - 1].y - trace[i].y,
        t = trace[trace.length - 1].t - trace[i].t,
        s = this.physicsScale() * stage.scale;

      if (t > 20.0) {
        s = 1000.0 / (s * t);
        x = x * s;
        y = y * s;

        this.setVelocity(x, -y);
      } else {
        this.setVelocity(0, 0);
      }
    }
  }
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
  console.log("costume", this.costume);
  console.log("image", this.image);
  console.log("body", this.physicsBody);
  console.log("mode", this.physicsMode);
};

SpriteMorph.prototype.allHatBlocksForSimulation = function () {
  return this.scripts.children.filter(function (morph) {
    return morph.selector === "doSimulationStep";
  });
};

SpriteMorph.prototype.physicsSaveToXML = function (serializer) {
  return serializer.format(
    "<physics" +
    " mass=\"@\"" +
    " mode=\"@\"" +
    "></physics>",
    this.physicsMass,
    this.physicsMode || "morphic"
  );
};

SpriteMorph.prototype.physicsLoadFromXML = function (model) {
  var attrs = model.attributes;

  if (attrs.mass) {
    this.setMass(parseFloat(attrs.mass));
  }

  if (attrs.mode) {
    this.physicsMode = attrs.mode !== "morphic" ? attrs.mode : "";
  }
};

// ------- HandMorph -------

HandMorph.prototype.phyProcessMouseMove = HandMorph.prototype.processMouseMove;
HandMorph.prototype.processMouseMove = function (event) {
  this.phyProcessMouseMove(event);

  if (this.phyPosTrace instanceof Array) {
    while (this.phyPosTrace.length >= 10) {
      this.phyPosTrace.shift();
    }

    this.phyPosTrace.push({
      x: event.screenX,
      y: event.screenY,
      t: Date.now()
    });
  }
};

HandMorph.prototype.phyProcessMouseDown = HandMorph.prototype.processMouseDown;
HandMorph.prototype.processMouseDown = function (event) {
  this.phyProcessMouseDown(event);
  this.phyPosTrace = [];
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
  // this.physicsWorld.setGlobalStiffness(1e18); // make it stiffer

  this.physicsRunning = false;
  this.physicsSimulationTime = 0.0;
  this.physicsLastUpdated = null;
  this.physicsDeltaTime = 0;
  this.physicsFloor = null;
  this.physicsScale = 10.0;

  this.graphWatchers = [];
  this.graphTable = new Table(0, 0); // cols, rows
};

StageMorph.prototype.hasPhysicsFloor = function () {
  return !!this.physicsFloor;
};

StageMorph.prototype.setPhysicsFloor = function (enable) {
  if (this.physicsFloor) {
    this.physicsWorld.removeBody(this.physicsFloor);
    this.physicsFloor = null;
  }

  if (enable) {
    var ext = this.extent().multiplyBy(1.0 / this.physicsScale),
      body = new p2.Body({
        position: [0, 0],
        type: p2.Body.STATIC
      });
    body.addShape(new p2.Plane(), [0, -ext.y / 2]);
    body.addShape(new p2.Plane(), [ext.x / 2, 0], Math.PI * 0.5);
    body.addShape(new p2.Plane(), [0, ext.y / 2], Math.PI);
    body.addShape(new p2.Plane(), [-ext.x / 2, 0], Math.PI * 1.5);
    this.physicsWorld.addBody(body);
    this.physicsFloor = body;
  }
};

StageMorph.prototype.togglePhysicsFloor = function () {
  this.setPhysicsFloor(!this.physicsFloor);
};

StageMorph.prototype.updateScaleMorph = function () {
  if (this.scaleMorph) {
    this.scaleMorph.destroy();
  }

  var height = this.physicsScale * this.scale * 2.0; // two meters
  this.scaleMorph = new SymbolMorph("robot", height, new Color(120, 120, 120, 0.1));
  this.add(this.scaleMorph);
  this.scaleMorph.setPosition(this.bottomRight().subtract(new Point(5 + height * 0.96, 5 + height)));
};

StageMorph.prototype.setPhysicsScale = function (scale) {
  var rel = this.physicsScale / scale;

  this.physicsWorld.bodies.forEach(function (body) {
    body.position[0] = body.position[0] * rel;
    body.position[1] = body.position[1] * rel;
    body.aabbNeedsUpdate = true;

    body.velocity[0] = body.velocity[0] * rel;
    body.velocity[1] = body.velocity[1] * rel;

    body.shapes.forEach(function (shape) {
      shape.position[0] = shape.position[0] * rel;
      shape.position[1] = shape.position[1] * rel;

      if (shape.vertices) {
        shape.vertices.forEach(function (vertex) {
          vertex[0] = vertex[0] * rel;
          vertex[1] = vertex[1] * rel;
        });
      }
    });
  });

  this.physicsScale = scale;
  this.updateScaleMorph();
};

StageMorph.prototype.updateMorphicPosition = function () {
  this.children.forEach(function (morph) {
    if (morph.updateMorphicPosition) {
      morph.updateMorphicPosition();
    }
  });
};

StageMorph.prototype.simulationStep = function () {
  var i, delta, time,
    hats = this.allHatBlocksForSimulation();

  this.children.forEach(function (morph) {
    if (morph.allHatBlocksForSimulation) {
      hats = hats.concat(morph.allHatBlocksForSimulation());
    }
  });

  for (i = 0; i < hats.length; i++) {
    if (this.threads.findProcess(hats[i])) {
      return false; // step is still running
    }
  }

  time = Date.now(); // in milliseconds
  if (this.physicsLastUpdated) {
    delta = (time - this.physicsLastUpdated) * 0.001;

    if (0.001 < delta) {
      if (delta > 0.1) {
        delta = 0.1;
      }

      this.recordGraphData();

      this.physicsLastUpdated = time;
      this.physicsDeltaTime = delta;
      this.physicsSimulationTime += delta;
      this.physicsWorld.step(delta);
      this.updateMorphicPosition();
      for (i = 0; i < hats.length; i++) {
        this.threads.startProcess(hats[i], this.isThreadSafe);
      }
    }
  } else {
    this.physicsLastUpdated = time;
  }

  return true;
};

StageMorph.prototype.phyStep = StageMorph.prototype.step;
StageMorph.prototype.step = function () {
  this.phyStep();
  if (this.isSimulationRunning()) {
    this.simulationStep();
  }
};

StageMorph.prototype.isSimulationRunning = function () {
  return this.physicsRunning;
};

StageMorph.prototype.startSimulation = function (norefresh) {
  this.physicsSimulationTime = 0.0;
  this.physicsRunning = true;
  this.physicsLastUpdated = Date.now();
  this.clearGraphData();

  if (!norefresh) {
    var ide = this.parentThatIsA(IDE_Morph);
    if (ide && ide.controlBar.physicsButton) {
      ide.controlBar.physicsButton.refresh();
    }
  }
};

StageMorph.prototype.stopSimulation = function (norefresh) {
  this.physicsRunning = false;

  if (!norefresh) {
    var ide = this.parentThatIsA(IDE_Morph);
    if (ide && ide.controlBar.physicsButton) {
      ide.controlBar.physicsButton.refresh();
    }
  }
};

StageMorph.prototype.phyFireGreenFlagEvent = StageMorph.prototype.fireGreenFlagEvent;
StageMorph.prototype.fireGreenFlagEvent = function () {
  var r = this.phyFireGreenFlagEvent();
  // this.physicsSimulationTime = 0.0;
  // this.clearGraphData();
  return r;
};

StageMorph.prototype.phyFireStopAllEvent = StageMorph.prototype.fireStopAllEvent;
StageMorph.prototype.fireStopAllEvent = function () {
  var r = this.phyFireStopAllEvent();
  this.stopSimulation();
  return r;
};

StageMorph.prototype.phyAdd = StageMorph.prototype.add;
StageMorph.prototype.add = function (morph) {
  this.phyAdd(morph);
  if (morph.updatePhysicsBody) {
    morph.updatePhysicsBody();
  }
};

StageMorph.prototype.deltaTime = function () {
  return this.physicsDeltaTime;
};

StageMorph.prototype.simulationTime = function () {
  return this.physicsSimulationTime;
};

StageMorph.prototype.xGravity = function () {
  return this.physicsWorld.gravity[0];
};

StageMorph.prototype.yGravity = function () {
  return this.physicsWorld.gravity[1];
};

StageMorph.prototype.friction = function () {
  return this.physicsWorld.defaultContactMaterial.friction;
};

StageMorph.prototype.graphData = function () {
  return this.graphTable.toList();
};

StageMorph.prototype.allHatBlocksForSimulation = SpriteMorph.prototype.allHatBlocksForSimulation;

StageMorph.prototype.physicsSaveToXML = function (serializer) {
  var world = this.physicsWorld,
    material = world.defaultContactMaterial;

  return serializer.format(
    "<physics" +
    " xgravity=\"@\"" +
    " ygravity=\"@\"" +
    " friction=\"@\"" +
    " restitution=\"@\"" +
    " scale=\"@\"" +
    " floor=\"@\"" +
    "></physics>",
    world.gravity[0],
    world.gravity[1],
    material.friction,
    material.restitution,
    this.physicsScale, !!this.physicsFloor
  );
};

StageMorph.prototype.physicsLoadFromXML = function (model) {
  var attrs = model.attributes,
    world = this.physicsWorld,
    material = world.defaultContactMaterial;

  var loadFloat = function (object, property, name) {
    if (attrs[name]) {
      object[property] = parseFloat(attrs[name]);
    }
  };

  loadFloat(world.gravity, 0, "xgravity");
  loadFloat(world.gravity, 1, "ygravity");
  loadFloat(material, "friction", "friction");
  loadFloat(material, "restitution", "restitution");
  loadFloat(this, "physicsScale", "scale");

  if (attrs.floor) {
    this.setPhysicsFloor(attrs.floor === "true");
  }
};

StageMorph.prototype.clearGraphData = function () {
  this.graphWatchers = this.watchers().filter(function (w) {
    return w.isVisible && !w.isTemporary() &&
      w.target instanceof Morph && typeof w.getter === "string";
  });

  this.graphTable.clear(1 + this.graphWatchers.length, 0);
  this.graphTable.setColNames(["Time"].concat(this.graphWatchers.map(
    function (w) {
      return w.objName + w.labelText;
    })));

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.graphDialog) {
    ide.graphDialog.updateData();
  }
};

StageMorph.prototype.recordGraphData = function () {
  if (this.graphTable.rows() >= 1000) {
    return;
  }

  this.graphTable.addRow([this.simulationTime()].concat(this.graphWatchers.map(
    function (w) {
      return w.target[w.getter]();
    })));

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.graphDialog) {
    ide.graphDialog.updateData();
  }
}

// ------- ProcessMorph -------

Process.prototype.runSimulationSteps = function () {
  var stage = this.homeContext.receiver.parentThatIsA(StageMorph);
  if (stage && stage.simulationStep()) {
    this.popContext();
    this.pushContext('doYield');
  } else {
    this.context.inputs = [];
    this.pushContext('doYield');
    this.pushContext();
  }
};

Process.prototype.getPhysicsAttrOf = function (attribute, name) {
  var thisObj = this.blockReceiver(),
    thatObj;

  if (thisObj) {
    this.assertAlive(thisObj);
    thatObj = this.getOtherObject(name, thisObj);
    if (thatObj) {
      this.assertAlive(thatObj);
      switch (this.inputOption(attribute)) {
        case 'mass':
          return thatObj.mass ? thatObj.mass() : '';
        case 'x position':
          return thatObj.physicsXPosition ? thatObj.physicsXPosition() : '';
        case 'y position':
          return thatObj.physicsYPosition ? thatObj.physicsYPosition() : '';
        case 'x velocity':
          return thatObj.xVelocity ? thatObj.xVelocity() : '';
        case 'y velocity':
          return thatObj.yVelocity ? thatObj.yVelocity() : '';
        case 'angle':
          return thatObj.physicsAngle ? thatObj.physicsAngle() : '';
        case 'angular velocity':
          return thatObj.angularVelocity ? thatObj.angularVelocity() : '';
      }
    }
  }

  return '';
};

Process.prototype.setPhysicsAttrOf = function (attribute, name, value) {
  var thisObj = this.blockReceiver(),
    thatObj;

  if (thisObj) {
    this.assertAlive(thisObj);
    thatObj = this.getOtherObject(name, thisObj);
    if (thatObj) {
      this.assertAlive(thatObj);
      value = value || 0;
      switch (this.inputOption(attribute)) {
        case 'mass':
          thatObj.setMass(value);
          break;
        case 'x position':
          thatObj.setPhysicsXPosition(value);
          break;
        case 'y position':
          thatObj.setPhysicsYPosition(value);
          break;
        case 'x velocity':
          thatObj.setXVelocity(value);
          break;
        case 'y velocity':
          thatObj.setYVelocity(value);
          break;
        case 'angle':
          thatObj.setPhysicsAngle(value);
          break;
        case 'angular velocity':
          thatObj.setAngularVelocity(value);
          break;
      }
    }
  }
};

// ------- PhysicsTabMorph -------

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

  function inputField(
    string, object, getter, setter, lowerLimit, upperLimit, unit) {
    var entry = new AlignmentMorph("row", 4);
    entry.alignment = "left";
    var text =
      new TextMorph(localize(string), 10, null, true, null, "right", 100);
    text.setColor(textColor);
    entry.add(text);

    if (typeof lowerLimit !== "number") {
      lowerLimit = Number.MIN_VALUE;
    }
    if (typeof upperLimit !== "number") {
      upperLimit = Number.MAX_VALUE;
    }

    var value = typeof object[getter] !== "function" ? +object[getter] :
      +object[getter]();
    var field = new InputFieldMorph(value.toFixed(2), true, null, !setter);
    field.fixLayout();
    field.accept = function () {
      var value = +field.getValue();
      value = Math.min(Math.max(value, lowerLimit), upperLimit);
      if (typeof object[setter] === "function") {
        object[setter](value);
      } else {
        object[setter] = value;
      }
      field.setContents(value.toFixed(2));
    };
    entry.add(field);

    if (unit) {
      text = new TextMorph(localize(unit), 10, null, true);
      text.setColor(textColor);
      entry.add(text);
    }

    entry.fixLayout();
    return entry;
  }

  function toggleField(string, object, getter, setter, radio) {
    var entry = new AlignmentMorph("row", 4);
    entry.alignment = "left";

    var field = new ToggleMorph(
      radio ? "radiobutton" : "checkbox", object, setter, string, getter);
    field.label.setColor(textColor);
    entry.add(field);

    entry.fixLayout();
    entry.toggle = field;
    return entry;
  }

  var elems = new AlignmentMorph("column", 6);
  elems.alignment = "left";
  elems.setColor(this.color);

  if (aSprite instanceof StageMorph) {
    var world = aSprite.physicsWorld;

    elems.add(
      inputField(
        "gravity x:", world.gravity, "0", "0", -100, 100, "m/s\u00b2"));
    elems.add(
      inputField(
        "gravity y:", world.gravity, "1", "1", -100, 100, "m/s\u00b2"));
    elems.add(
      inputField(
        "friction:", world.defaultContactMaterial, "friction", "friction",
        0, 100));
    elems.add(
      inputField(
        "restitution:", world.defaultContactMaterial, "restitution",
        "restitution", 0, 1));
    elems.add(
      inputField(
        "scale:", aSprite, "physicsScale", "setPhysicsScale", 0.01, 100,
        "pixel/m"));
    elems.add(toggleField("enable ground", aSprite, "hasPhysicsFloor", "togglePhysicsFloor"));
  } else if (aSprite instanceof SpriteMorph) {
    elems.add(inputField("mass:", aSprite, "mass", "setMass", 0, 1e6, "kg"));

    var radioDisabled = toggleField(
        "physics disabled", aSprite,
        function () {
          return !this.physicsMode;
        },
        function () {
          if (this.physicsMode) {
            this.physicsMode = "";
            radioStatic.toggle.refresh();
            radioDynamic.toggle.refresh();
            aSprite.updatePhysicsBody();
          }
        },
        true),
      radioStatic = toggleField(
        "static object", aSprite,
        function () {
          return this.physicsMode === "static";
        },
        function () {
          if (this.physicsMode !== "static") {
            this.physicsMode = "static";
            radioDisabled.toggle.refresh();
            radioDynamic.toggle.refresh();
            aSprite.updatePhysicsBody();
          }
        },
        true),
      radioDynamic = toggleField(
        "dynamic object", aSprite,
        function () {
          return this.physicsMode === "dynamic";
        },
        function () {
          if (this.physicsMode !== "dynamic") {
            this.physicsMode = "dynamic";
            radioDisabled.toggle.refresh();
            radioStatic.toggle.refresh();
            aSprite.updatePhysicsBody();
          }
        },
        true);

    elems.add(radioDisabled);
    elems.add(radioStatic);
    elems.add(radioDynamic);

    if (false) {
      elems.add(toggleField("fixed x position", aSprite, function () {
        return this.physicsBody && this.physicsBody.fixedX;
      }, function () {
        if (this.physicsBody) {
          this.physicsBody.fixedX = !this.physicsBody.fixedX;
          if (this.physicsBody.fixedX) {
            this.physicsBody.velocity[0] = 0;
          }
        }
      }));

      elems.add(toggleField("fixed y position", aSprite, function () {
        return this.physicsBody && this.physicsBody.fixedY;
      }, function () {
        if (this.physicsBody) {
          this.physicsBody.fixedY = !this.physicsBody.fixedY;
          if (this.physicsBody.fixedY) {
            this.physicsBody.velocity[1] = 0;
          }
        }
      }));

      elems.add(toggleField("fixed angle", aSprite, function () {
        return this.physicsBody && this.physicsBody.fixedRotation;
      }, function () {
        if (this.physicsBody) {
          this.physicsBody.fixedRotation = !this.physicsBody.fixedRotation;
        }
      }));
    }
  }

  elems.fixLayout();
  elems.setPosition(new Point(5, 5));
  this.add(elems);
};

PhysicsTabMorph.prototype.wantsDropOf = function (morph) {
  return false;
};

// ------- SnapSerializer -------

SnapSerializer.prototype.phyOpenProject = SnapSerializer.prototype.openProject;
SnapSerializer.prototype.openProject = function (project, ide) {
  this.phyOpenProject(project, ide);
  ide.stage.setPhysicsFloor(true);
  ide.stage.updateScaleMorph();
  if (ide.controlBar.physicsButton) {
    ide.controlBar.physicsButton.refresh();
  }
};

// ------- IDE_Morph -------

IDE_Morph.prototype.phyCreateStage = IDE_Morph.prototype.createStage;
IDE_Morph.prototype.createStage = function () {
  this.phyCreateStage();
  this.stage.setPhysicsFloor(true);
  this.stage.updateScaleMorph();
  if (this.controlBar.physicsButton) {
    this.controlBar.physicsButton.refresh();
  }
};

IDE_Morph.prototype.phyCreateSpriteEditor = IDE_Morph.prototype.createSpriteEditor;
IDE_Morph.prototype.createSpriteEditor = function () {
  if (this.currentTab === "physics") {
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

IDE_Morph.prototype.openGraphDialog = function () {
  if (!this.graphDialog) {
    this.graphDialog = new GraphDialogMorph(this.stage.graphTable);
  }

  this.graphDialog.popUp(this.world());
};

// ------- InputSlotMorph -------

InputSlotMorph.prototype.physicsAttrMenu = function () {
  var block = this.parentThatIsA(BlockMorph),
    objName = block.inputs()[1].evaluate(),
    rcvr = block.receiver(),
    stage = rcvr.parentThatIsA(StageMorph),
    obj,
    dict = {},
    varNames = [];

  if (objName === stage.name) {
    obj = stage;
  } else {
    obj = detect(
      stage.children,
      function (morph) {
        return morph.name === objName;
      }
    );
  }
  if (!obj) {
    return dict;
  }
  if (obj instanceof SpriteMorph) {
    dict = {
      'mass in kg': ['mass'],
      'x position in m': ['x position'],
      'y position in m': ['y position'],
      'x velocity in m/s': ['x velocity'],
      'y velocity in m/s': ['y velocity'],
      'angle in rad': ['angle'],
      'angular velocity in rad/s': ['angular velocity']
    };
  } else { // the stage
    dict = {};
  }
  varNames = obj.variables.names();
  if (varNames.length > 0) {
    dict['~'] = null;
    varNames.forEach(function (name) {
      dict[name] = name;
    });
  }
  return dict;
};

// ------- GraphingMorph -------

function GraphingMorph() {
  this.init();
};

GraphingMorph.prototype = new Morph();
GraphingMorph.prototype.constructor = GraphingMorph;
GraphingMorph.uber = Morph.prototype;

GraphingMorph.prototype.init = function () {
  GraphingMorph.uber.init.call(this);
};

// ------- GraphDialogMorph -------

GraphDialogMorph.prototype = new DialogBoxMorph();
GraphDialogMorph.prototype.constructor = GraphDialogMorph;
GraphDialogMorph.uber = DialogBoxMorph.prototype;

function GraphDialogMorph(table) {
  this.init(table);
};

GraphDialogMorph.prototype.init = function (table) {
  // additional properties:
  this.handle = null;
  this.table = table;
  this.tableView = null;

  // initialize inherited properties:
  GraphDialogMorph.uber.init.call(this);

  // override inherited properites:
  this.labelString = 'Graph view';
  this.createLabel();

  this.buildContents();
};

GraphDialogMorph.prototype.buildContents = function () {
  this.tableView = new TableMorph(
    this.table,
    null, // scrollBarSize
    null, // extent
    null, // startRow
    null, // startCol
    null, // globalColWidth
    null, // colWidths
    null, // rowHeight
    null, // colLabelHeight
    null // padding
  );
  this.addBody(new TableFrameMorph(this.tableView, true));
  this.addButton('ok', 'Close');
  this.addButton('exportTable', 'Export');
};

GraphDialogMorph.prototype.exportTable = function () {
  if (this.parent instanceof WorldMorph) {
    var ide = this.parent.children[0];
    ide.saveFileAs(this.table.toCSV(), 'text/csv;chartset=utf-8', 'simdata');
    this.ok();
  }
};

GraphDialogMorph.prototype.setInitialDimensions = function () {
  var world = this.world(),
    mex = world.extent().subtract(new Point(this.padding, this.padding)),
    th = fontHeight(this.titleFontSize) + this.titlePadding * 3, // hm...
    bh = this.buttons.height();
  this.setExtent(
    this.tableView.globalExtent().add(
      new Point(this.padding * 2, this.padding * 2 + th + bh)
    ).min(mex).max(new Point(300, 300))
  );
  this.setCenter(this.world().center());
};

GraphDialogMorph.prototype.popUp = function (world) {
  if (world) {
    GraphDialogMorph.uber.popUp.call(this, world);
    this.setInitialDimensions();
    this.handle = new HandleMorph(
      this,
      100,
      100,
      this.corner,
      this.corner
    );
  }
};

GraphDialogMorph.prototype.fixLayout = BlockEditorMorph.prototype.fixLayout;

GraphDialogMorph.prototype.updateData = function () {
  if (this.body && this.body.tableMorph) {
    this.body.tableMorph.drawNew();
  }
}

// ------- Table -------

Table.prototype.clear = function (cols, rows) {
  this.colCount = +cols;
  this.rowCount = +rows;
  this.colNames = [];
  this.rowNames = [];
  this.contents = new Array(+rows);
  for (var i = 0; i < rows; i += 1) {
    this.contents[i] = new Array(+cols);
  }
  this.lastChanged = Date.now();
};

// TODO: do proper escaping
Table.prototype.toCSV = function () {
  var data = this.colNames.join(',') + '\n';
  for (var i = 0; i < this.contents.length; i++) {
    data += this.contents[i].join(',') + '\n';
  }
  return data;
}
