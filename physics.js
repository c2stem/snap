/* This file defines the physics engine extending Snap */

"use strict";

modules.physics = "2018-June-16";

// ------- PhysicsMorph -------

function PhysicsMorph(physicsBody) {
  this.init(physicsBody);
}

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

PhysicsMorph.prototype.physicsOrigin = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.physicsOrigin) || new Point(0, 0);
};

PhysicsMorph.prototype.getPhysicsAxisAngle = function () {
  var stage = this.parentThatIsA(StageMorph);
  return (stage && stage.physicsAxisAngle) || 0;
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
      center.x + stage.physicsOrigin.x * stage.scale + aabb.lowerBound[0] * scale,
      center.y - stage.physicsOrigin.y * stage.scale - aabb.upperBound[1] * scale);

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
      category: "simulation",
      spec: "apply %clockwise torque of %n",
      defaults: [1000]
    },
    angularForceLeft: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "apply %counterclockwise torque of %n",
      defaults: [1000]
    },
    applyForceForward: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "apply force of %n",
      defaults: [1000]
    },
    applyForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "apply force %n in direction %dir",
      defaults: [100]
    },
    setMass: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set mass to %n kg",
      defaults: [100],
      concepts: ["mass"]
    },
    mass: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "mass in kg",
      concepts: ["mass"]
    },
    setVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set velocity to x: %n y: %n m/s",
      defaults: [0, 0],
      concepts: ["x_velocity", "y_velocity"]
    },
    setXVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set x velocity to %n m/s",
      defaults: [0],
      concepts: ["x_velocity"]
    },
    setYVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set y velocity to %n m/s",
      defaults: [0],
      concepts: ["y_velocity"]
    },
    xVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "x velocity in m/s",
      concepts: ["x_velocity"]
    },
    yVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "y velocity in m/s",
      concepts: ["y_velocity"]
    },
    changeVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change velocity by x: %n y: %n m/s",
      defaults: [0, 0],
      concepts: ["x_velocity", "y_velocity"]
    },
    changeXVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change x velocity by %n m/s",
      defaults: [0],
      concepts: ["x_velocity"]
    },
    changeYVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change y velocity by %n m/s",
      defaults: [0],
      concepts: ["y_velocity"]
    },
    setAcceleration: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set acceleration to x: %n y: %n m/s\u00b2",
      defaults: [0, 0],
      concepts: ["x_acceleration", "y_acceleration"]
    },
    setXAcceleration: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set x acceleration to %n m/s\u00b2",
      defaults: [0],
      concepts: ["x_acceleration"]
    },
    setYAcceleration: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set y acceleration to %n m/s\u00b2",
      defaults: [0],
      concepts: ["y_acceleration"]
    },
    xAcceleration: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "x acceleration in m/s\u00b2",
      concepts: ["x_acceleration"]
    },
    yAcceleration: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "y acceleration in m/s\u00b2",
      concepts: ["y_acceleration"]
    },
    setNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set net force to x: %n y: %n N",
      defaults: [0, 0],
      concepts: ["x_net_force", "y_net_force"]
    },
    setXNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set x net force to %n N",
      defaults: [0],
      concepts: ["x_net_force"]
    },
    setYNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set y net force to %n N",
      defaults: [0],
      concepts: ["y_net_force"]
    },
    xNetForce: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "x net force in N",
      concepts: ["x_net_force"]
    },
    yNetForce: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "y net force in N",
      concepts: ["y_net_force"]
    },
    changeNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change net force by x: %n y: %n N",
      defaults: [0, 0],
      concepts: ["x_net_force", "y_net_force"]
    },
    changeXNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change x net force by %n N",
      defaults: [0],
      concepts: ["x_net_force"]
    },
    changeYNetForce: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change y net force by %n N",
      defaults: [0],
      concepts: ["y_net_force"]
    },
    simulationTime: {
      type: "reporter",
      category: "simulation",
      spec: "time in s",
      concepts: ["simulation_time"]
    },
    deltaTime: {
      type: "reporter",
      category: "simulation",
      spec: "\u2206t in s",
      concepts: ["delta_time"]
    },
    setDeltaTime: {
      type: "command",
      category: "simulation",
      spec: "set \u2206t to %n in s",
      defaults: [0],
      concepts: ["delta_time"]
    },
    doSimulationStep: {
      type: "hat",
      category: "simulation",
      spec: "simulation_step"
    },
    yGravity: {
      type: "reporter",
      category: "simulation",
      spec: "gravity in m/s\u00b2",
      concepts: ["gravity"]
    },
    friction: {
      type: "reporter",
      category: "simulation",
      spec: "friction",
      concepts: ["friction"]
    },
    setPhysicsPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set position to x: %n y: %n m",
      defaults: [0, 0],
      concepts: ["x_position", "y_position"]
    },
    setPhysicsXPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set x position to %n m",
      defaults: [0],
      concepts: ["x_position"]
    },
    setPhysicsYPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set y position to %n m",
      defaults: [0],
      concepts: ["y_position"]
    },
    physicsXPosition: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "x position in m",
      concepts: ["x_position"]
    },
    physicsYPosition: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "y position in m",
      concepts: ["y_position"]
    },
    changePhysicsXPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change x position by %n m",
      defaults: [0],
      concepts: ["x_position"]
    },
    changePhysicsYPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change y position by %n m",
      defaults: [0],
      concepts: ["y_position"]
    },
    changePhysicsPosition: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change position by x: %n y: %n m",
      defaults: [0, 0],
      concepts: ["x_position", "y_position"]
    },
    setPhysicsAngle: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set heading to %n deg",
      defaults: [0],
      concepts: ["heading"]
    },
    changePhysicsAngle: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change heading by %n deg",
      defaults: [0],
      concepts: ["heading"]
    },
    physicsAngle: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "heading in deg",
      concepts: ["heading"]
    },
    setAngularVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "set angular velocity to %n deg/s",
      defaults: [0],
      concepts: ["angular_velocity"]
    },
    changeAngularVelocity: {
      only: SpriteMorph,
      type: "command",
      category: "simulation",
      spec: "change angular velocity by %n deg/s",
      defaults: [0],
      concepts: ["angular_velocity"]
    },
    angularVelocity: {
      only: SpriteMorph,
      type: "reporter",
      category: "simulation",
      spec: "angular velocity in deg/s",
      concepts: ["angular_velocity"]
    },
    startSimulation: {
      type: "command",
      category: "simulation",
      spec: "start simulation"
    },
    stopSimulation: {
      type: "command",
      category: "simulation",
      spec: "stop simulation"
    },
    runSimulationSteps: {
      type: "command",
      category: "simulation",
      spec: "run simulation step"
    },
    getPhysicsAttrOf: {
      type: "reporter",
      category: "simulation",
      spec: "%phy of %spr",
      defaults: [
        ["x position"]
      ]
    },
    setPhysicsAttrOf: {
      type: "command",
      category: "simulation",
      spec: "set %phy of %spr to %n",
      defaults: [
        ["x position"], null, [0]
      ]
    },
    graphData: {
      type: "reporter",
      category: "simulation",
      spec: "graph data"
    },
    clearGraphData: {
      type: "command",
      category: "simulation",
      spec: "clear graph data"
    },
    recordGraphData: {
      type: "command",
      category: "simulation",
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

SpriteMorph.prototype.categories.push('simulation');
SpriteMorph.prototype.blockColor.simulation = new Color(100, 140, 250);

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

SpriteMorph.prototype.getStage = function () {
  var stage = this.parentThatIsA(StageMorph);
  if (!stage) {
    var hand = this.parentThatIsA(HandMorph);
    if (hand.world instanceof WorldMorph &&
      hand.world.children[0] instanceof IDE_Morph &&
      hand.world.children[0].stage instanceof StageMorph) {
      stage = hand.world.children[0].stage;
    }
  }
  return stage;
};

SpriteMorph.prototype.startSimulation = function () {
  var stage = this.getStage();
  if (stage) {
    stage.startSimulation();
  }
};

SpriteMorph.prototype.stopSimulation = function () {
  var stage = this.getStage();
  if (stage) {
    stage.stopSimulation();
  }
};

SpriteMorph.prototype.deltaTime = function () {
  var stage = this.getStage();
  return (stage && stage.deltaTime()) || 0;
};

SpriteMorph.prototype.setDeltaTime = function (dt) {
  var stage = this.getStage();
  if (stage) {
    stage.setDeltaTime(dt);
  }
};

SpriteMorph.prototype.simulationTime = function () {
  var stage = this.getStage();
  return (stage && stage.simulationTime()) || 0;
};

SpriteMorph.prototype.yGravity = function () {
  var stage = this.getStage();
  return (stage && stage.yGravity()) || 0;
};

SpriteMorph.prototype.friction = function () {
  var stage = this.getStage();
  return (stage && stage.friction()) || 0;
};

SpriteMorph.prototype.graphData = function () {
  var stage = this.getStage();
  return (stage && stage.graphData()) || null;
};

SpriteMorph.prototype.clearGraphData = function () {
  var stage = this.getStage();
  if (stage) {
    stage.clearGraphData();
  }
};

SpriteMorph.prototype.recordGraphData = function () {
  var stage = this.getStage();
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

SpriteMorph.prototype.setAcceleration = function (ax, ay) {
  this.physicsXAcceleration = +ax;
  this.physicsYAcceleration = +ay;
};

SpriteMorph.prototype.setXAcceleration = function (a) {
  this.physicsXAcceleration = +a;
};

SpriteMorph.prototype.setYAcceleration = function (a) {
  this.physicsYAcceleration = +a;
};

SpriteMorph.prototype.xAcceleration = function () {
  return this.physicsXAcceleration || 0;
};

SpriteMorph.prototype.yAcceleration = function () {
  return this.physicsYAcceleration || 0;
};

SpriteMorph.prototype.setNetForce = function (x, y) {
  this.physicsXNetForce = +x;
  this.physicsYNetForce = +y;
};

SpriteMorph.prototype.setXNetForce = function (x) {
  this.physicsXNetForce = +x;
};

SpriteMorph.prototype.setYNetForce = function (y) {
  this.physicsYNetForce = +y;
};

SpriteMorph.prototype.xNetForce = function () {
  return this.physicsXNetForce || 0;
};

SpriteMorph.prototype.yNetForce = function () {
  return this.physicsYNetForce || 0;
};

SpriteMorph.prototype.changeNetForce = function (x, y) {
  this.physicsXNetForce = (this.physicsXNetForce || 0) + +x;
  this.physicsYNetForce = (this.physicsYNetForce || 0) + +y;
};

SpriteMorph.prototype.changeXNetForce = function (x) {
  this.physicsXNetForce = (this.physicsXNetForce || 0) + +x;
};

SpriteMorph.prototype.changeYNetForce = function (y) {
  this.physicsYNetForce = (this.physicsYNetForce || 0) + +y;
};

SpriteMorph.prototype.physicsScale = function () {
  var stage = this.getStage();
  return (stage && stage.physicsScale) || 1;
};

SpriteMorph.prototype.physicsOrigin = function () {
  var stage = this.getStage();
  return (stage && stage.physicsOrigin) || new Point(0, 0);
};

SpriteMorph.prototype.getPhysicsAxisAngle = function () {
  var stage = this.getStage();
  return (stage && stage.physicsAxisAngle) || 0;
};

SpriteMorph.prototype.setPhysicsPosition = function (x, y) {
  var s = this.physicsScale(),
    o = this.physicsOrigin(),
    a = radians(this.getPhysicsAxisAngle());
  this.gotoXY((+x * Math.cos(a) - +y * Math.sin(a)) * s + o.x,
    (x * Math.sin(a) + +y * Math.cos(a)) * s + o.y);
};

SpriteMorph.prototype.setPhysicsXPosition = function (x) {
  this.setPhysicsPosition(+x, this.physicsYPosition());
};

SpriteMorph.prototype.setPhysicsYPosition = function (y) {
  this.setPhysicsPosition(this.physicsXPosition(), +y);
};

SpriteMorph.prototype.changePhysicsXPosition = function (dx) {
  this.setPhysicsPosition(this.physicsXPosition() + +dx,
    this.physicsYPosition());
};

SpriteMorph.prototype.changePhysicsYPosition = function (dy) {
  this.setPhysicsPosition(this.physicsXPosition(),
    this.physicsYPosition() + +dy);
};

SpriteMorph.prototype.changePhysicsPosition = function (dx, dy) {
  this.setPhysicsPosition(this.physicsXPosition() + dx, this.physicsYPosition() + dy);
};

SpriteMorph.prototype.physicsXPosition = function () {
  var s = this.physicsScale(),
    o = this.physicsOrigin(),
    a = radians(this.getPhysicsAxisAngle());
  return ((this.xPosition() - o.x) * Math.cos(-a) -
    (this.yPosition() - o.y) * Math.sin(-a)) / s;
};

SpriteMorph.prototype.physicsYPosition = function () {
  var s = this.physicsScale(),
    o = this.physicsOrigin(),
    a = radians(this.getPhysicsAxisAngle());
  return ((this.xPosition() - o.x) * Math.sin(-a) +
    (this.yPosition() - o.y) * Math.cos(-a)) / s;
};

SpriteMorph.prototype.setPhysicsAngle = function (angle) {
  this.setHeading(-angle + 90 - this.getPhysicsAxisAngle());
};

SpriteMorph.prototype.changePhysicsAngle = function (delta) {
  this.setHeading(this.direction() - delta);
};

SpriteMorph.prototype.physicsAngle = function () {
  var angle = (-this.direction() + 90 - this.getPhysicsAxisAngle()) % 360;
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
    var stage = this.getStage();
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
    origin = this.physicsOrigin(),
    posX = this.physicsBody.position[0] * scale + origin.x,
    posY = this.physicsBody.position[1] * scale + origin.y,
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

SpriteMorph.prototype.setPhysicsMode = function (mode) {
  if (mode !== this.physicsMode) {
    this.physicsMode = mode;
    this.updatePhysicsBody();
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsModeDisabled.refresh();
    ide.spriteEditor.physicsModeStatic.refresh();
    ide.spriteEditor.physicsModeDynamic.refresh();
  }
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

SpriteMorph.prototype.physicsDebug = function () {
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
  var myself = this;

  function getConceptList(level) {
    var result, name;
    for (name in myself.conceptLevels) {
      if (myself.conceptLevels[name] === level) {
        result = result ? result + ' ' + name : name;
      }
    }
    return result;
  }

  return serializer.format(
    "<physics" +
    " mass=\"@\"" +
    " mode=\"@\"" +
    " concepts_disabled=\"@\"" +
    " concepts_readonly=\"@\"" +
    " concepts_getandset=\"@\"" +
    "></physics>",
    this.physicsMass,
    this.physicsMode || "morphic",
    getConceptList(0),
    getConceptList(1),
    getConceptList(2) // 3 is the default value
  );
};

SpriteMorph.prototype.physicsLoadFromXML = function (model) {
  var myself = this,
    attrs = model.attributes;

  if (attrs.mass) {
    this.setMass(parseFloat(attrs.mass));
  }

  if (attrs.mode) {
    this.physicsMode = attrs.mode !== "morphic" ? attrs.mode : "";
  }

  if (attrs.concepts_disabled) {
    attrs.concepts_disabled.split(' ').forEach(function (concept) {
      myself.conceptLevels[concept] = 0;
    });
  }

  if (attrs.concepts_readonly) {
    attrs.concepts_readonly.split(' ').forEach(function (concept) {
      myself.conceptLevels[concept] = 1;
    });
  }

  if (attrs.concepts_getandset) {
    attrs.concepts_getandset.split(' ').forEach(function (concept) {
      myself.conceptLevels[concept] = 2;
    });
  }
};

SpriteMorph.prototype.getConceptLevel = function (concept) {
  var level = this.conceptLevels[concept];
  if (typeof level === 'undefined') {
    level = 3;
  }
  return Math.min(Math.max(+level, 0), 3);
};

SpriteMorph.prototype.setConceptLevel = function (concept, level) {
  if (+level === 3) {
    delete this.conceptLevels[concept];
  } else {
    this.conceptLevels[concept] = +level;
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide) {
    ide.flushBlocksCache('simulation');
    ide.refreshPalette();

    if (ide.currentTab === 'simulation' &&
      ide.currentSprite === this && ide.spriteEditor.concepts &&
      ide.spriteEditor.concepts[concept]) {
      ide.spriteEditor.concepts[concept].refresh();
    }
  }
};

SpriteMorph.prototype.isBlockDisabled = function (selector) {
  var info = SpriteMorph.prototype.blocks[selector];
  if (!info.concepts) {
    return false;
  }

  var i, level = 3;
  for (i = 0; i < info.concepts.length; i++) {
    level = Math.min(level, this.getConceptLevel(info.concepts[i]));
  }

  if (info.type === 'command') {
    if (info.spec.startsWith('change')) {
      return level < 3;
    } else {
      return level < 2;
    }
  } else if (info.type === 'reporter') {
    return level < 1;
  } else {
    return true;
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

  if (typeof object.physicsDebug === 'function') {
    menu.addItem("debug", function () {
      object.physicsDebug();
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
  this.physicsSimulationTime = 0;
  this.physicsLastUpdated = null;
  this.physicsDeltaTime = 0;
  this.targetDeltaTime = 0;
  this.physicsFloor = null;
  this.physicsScale = 10;
  this.physicsOrigin = new Point(0, 0);
  this.physicsAxisAngle = 0;

  this.graphWatchers = [];
  if (false) { // test data
    this.graphTable = new Table(3, 0); // cols, rows
    this.graphTable.setColNames(['Time', 'Sprite x position', 'Sprite y position']);
    for (var t = 0; t < 2.0; t += 0.03) {
      this.graphTable.addRow([t, 2 * t, Math.sin(t)]);
    }
  } else {
    this.graphTable = new Table(0, 0);
  }
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
      }),
      o = this.physicsOrigin.multiplyBy(1.0 / this.physicsScale);
    body.addShape(new p2.Plane(), [-o.y, -o.y - ext.y / 2]);
    body.addShape(new p2.Plane(), [-o.x + ext.x / 2, -o.x], Math.PI * 0.5);
    body.addShape(new p2.Plane(), [-o.y, -o.y + ext.y / 2], Math.PI);
    body.addShape(new p2.Plane(), [-o.x - ext.x / 2, -o.x], Math.PI * 1.5);
    this.physicsWorld.addBody(body);
    this.physicsFloor = body;
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.hasPhysicsFloor.refresh();
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

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsScale.refresh();
  }
};

StageMorph.prototype.physicsXOrigin = function () {
  return this.physicsOrigin.x;
};

StageMorph.prototype.physicsYOrigin = function () {
  return this.physicsOrigin.y;
};

StageMorph.prototype.getPhysicsAxisAngle = function () {
  return this.physicsAxisAngle;
};

StageMorph.prototype.setPhysicsXOrigin = function (x) {
  this.physicsOrigin.x = +x;

  this.setPhysicsFloor(!!this.physicsFloor);
  if (this.coordinateMorph) {
    this.coordinateMorph.drawNew();
    this.coordinateMorph.changed();
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsXOrigin.refresh();
  }
};

StageMorph.prototype.setPhysicsYOrigin = function (y) {
  this.physicsOrigin.y = +y;

  this.setPhysicsFloor(!!this.physicsFloor);
  if (this.coordinateMorph) {
    this.coordinateMorph.drawNew();
    this.coordinateMorph.changed();
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsYOrigin.refresh();
  }
};

StageMorph.prototype.setPhysicsAxisAngle = function (a) {
  this.physicsAxisAngle = +a;

  this.setPhysicsFloor(!!this.physicsFloor);
  if (this.coordinateMorph) {
    this.coordinateMorph.drawNew();
    this.coordinateMorph.changed();
  }

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsAxisAngle.refresh();
  }
};

StageMorph.prototype.physicsYGravity = function () {
  return this.physicsWorld.gravity[1];
};

StageMorph.prototype.setPhysicsYGravity = function (y) {
  this.physicsWorld.gravity[1] = +y;

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsYGravity.refresh();
  }
};

StageMorph.prototype.physicsFriction = function () {
  return this.physicsWorld.defaultContactMaterial.friction;
};

StageMorph.prototype.setPhysicsFriction = function (a) {
  this.physicsWorld.defaultContactMaterial.friction = +a;

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsFriction.refresh();
  }
};

StageMorph.prototype.physicsRestitution = function () {
  return this.physicsWorld.defaultContactMaterial.restitution;
};

StageMorph.prototype.setPhysicsRestitution = function (a) {
  this.physicsWorld.defaultContactMaterial.restitution = +a;

  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.currentTab === 'simulation' && ide.currentSprite === this) {
    ide.spriteEditor.physicsRestitution.refresh();
  }
};

StageMorph.prototype.toggleCoordinateAxes = function () {
  if (this.coordinateMorph) {
    this.coordinateMorph.destroy();
    this.coordinateMorph = null;
  } else {
    var stage = this;

    this.coordinateMorph = new Morph();
    this.coordinateMorph.drawNew = function () {
      this.image = newCanvas(stage.extent());

      var ctx = this.image.getContext('2d'),
        xorigin = this.image.width * 0.5 + stage.physicsOrigin.x * stage.scale,
        yorigin = this.image.height * 0.5 - stage.physicsOrigin.y * stage.scale,
        angle = stage.physicsAxisAngle % 90;

      if (angle < -45) {
        angle += 90;
      } else if (angle > 45) {
        angle -= 90;
      }
      angle = Math.sin(radians(angle));

      ctx.strokeStyle = (new Color(120, 120, 120, 0.3)).toString();
      ctx.lineWidth = 1;
      ctx.moveTo(0, yorigin + xorigin * angle);
      ctx.lineTo(this.image.width, yorigin - (this.image.width - xorigin) * angle);
      ctx.stroke();
      ctx.moveTo(xorigin - yorigin * angle, 0);
      ctx.lineTo(xorigin + (this.image.height - yorigin) * angle, this.image.height);
      ctx.stroke();

      this.silentSetWidth(this.image.width);
      this.silentSetHeight(this.image.height);
    };

    this.coordinateMorph.drawNew();
    this.add(this.coordinateMorph);
    this.coordinateMorph.setPosition(this.topLeft());
  }
};

StageMorph.prototype.isCoordinateAxesEnabled = function () {
  return !!this.coordinateMorph;
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

    if (this.targetDeltaTime + 0.01 < delta) {
      if (this.targetDeltaTime > 0.0) {
        delta = this.targetDeltaTime;
      } else if (delta > 0.2) {
        delta = 0.2;
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
  this.physicsSimulationTime = 0;
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

  this.refreshGraphViews();
};

StageMorph.prototype.phyFireGreenFlagEvent = StageMorph.prototype.fireGreenFlagEvent;
StageMorph.prototype.fireGreenFlagEvent = function () {
  var r = this.phyFireGreenFlagEvent();
  // this.physicsSimulationTime = 0;
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

StageMorph.prototype.setDeltaTime = function (dt) {
  this.targetDeltaTime = Math.max(dt || 0, 0);
  this.physicsDeltaTime = this.targetDeltaTime;
};

StageMorph.prototype.simulationTime = function () {
  return this.physicsSimulationTime;
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
    " ygravity=\"@\"" +
    " friction=\"@\"" +
    " restitution=\"@\"" +
    " scale=\"@\"" +
    " floor=\"@\"" +
    " xorigin=\"@\"" +
    " yorigin=\"@\"" +
    " axisangle=\"@\"" +
    "></physics>",
    world.gravity[1],
    material.friction,
    material.restitution,
    this.physicsScale, !!this.physicsFloor,
    this.physicsOrigin.x,
    this.physicsOrigin.y,
    this.physicsAxisAngle
  );
};

StageMorph.prototype.physicsLoadFromXML = function (model) {
  var attrs = model.attributes,
    world = this.physicsWorld,
    material = world.defaultContactMaterial;

  var loadFloat = function (object, property, name, defval) {
    if (attrs[name]) {
      object[property] = parseFloat(attrs[name]);
    } else {
      object[property] = defval;
    }
  };

  world.gravity[0] = 0;
  loadFloat(world.gravity, 1, "ygravity", -9.81);
  loadFloat(material, "friction", "friction", 0.3);
  loadFloat(material, "restitution", "restitution", 0);
  loadFloat(this, "physicsScale", "scale", 10);
  loadFloat(this.physicsOrigin, "x", "xorigin", 0);
  loadFloat(this.physicsOrigin, "y", "yorigin", 0);
  loadFloat(this, "physicsAxisAngle", "axisangle", 0);

  if (attrs.floor) {
    this.setPhysicsFloor(attrs.floor === "true");
  }
};

StageMorph.prototype.refreshGraphViews = function () {
  var ide = this.parentThatIsA(IDE_Morph);
  if (ide && ide.graphDialog) {
    ide.graphDialog.refresh();
  }
  if (ide && ide.tableDialog) {
    ide.tableDialog.refresh();
  }
};

StageMorph.prototype.clearGraphData = function () {
  this.graphWatchers = this.watchers().filter(function (w) {
    return w.isVisible && !w.isTemporary();
  });

  this.graphChanged = Date.now();
  this.graphTable.clear(1 + this.graphWatchers.length, 0);
  this.graphTable.setColNames(["Time in s"].concat(this.graphWatchers.map(
    function (w) {
      return w.objName + w.labelText;
    })));

  this.refreshGraphViews();
};

StageMorph.prototype.recordGraphData = function () {
  if (this.graphTable.rows() >= 1000) {
    return;
  }

  this.graphTable.addRow([this.simulationTime()].concat(this.graphWatchers.map(
    function (w) {
      if (w.target instanceof VariableFrame) {
        var v = w.target.vars[w.getter];
        return v ? v.value : NaN;
      } else {
        return w.target[w.getter]();
      }
    })));

  var t = Date.now();
  if (t - this.graphChanged >= 500) {
    this.graphChanged = t;
    this.refreshGraphViews();
  }
};

StageMorph.prototype.physicsDebug = function () {
  console.log(this.physicsWorld);
};

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
        case 'x acceleration':
          return thatObj.xAcceleration ? thatObj.xAcceleration() : '';
        case 'y acceleration':
          return thatObj.yAcceleration ? thatObj.yAcceleration() : '';
        case 'heading':
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
        case 'x acceleration':
          thatObj.setXAcceleration(value);
          break;
        case 'y acceleration':
          thatObj.setYAcceleration(value);
          break;
        case 'heading':
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
}

PhysicsTabMorph.prototype.addInputField = function (string, object,
  getter, setter, lowerLimit, upperLimit, unit) {
  var entry = new AlignmentMorph("row", 4);
  entry.alignment = "left";
  var text =
    new TextMorph(localize(string) + ':', 10, null, true, null, "right", 100);
  text.setColor(this.textColor);
  entry.add(text);

  if (typeof lowerLimit !== "number") {
    lowerLimit = Number.MIN_VALUE;
  }
  if (typeof upperLimit !== "number") {
    upperLimit = Number.MAX_VALUE;
  }

  var value = +(typeof object[getter] === "function" ?
    object[getter]() : object[getter]);
  var field = new InputFieldMorph(value.toFixed(2), true, null, !setter);
  field.fixLayout();
  field.accept = function () {
    var value = +field.getValue();
    value = Math.min(Math.max(value, lowerLimit), upperLimit);
    object[setter](value);
  };
  entry.add(field);

  if (unit) {
    text = new TextMorph(localize(unit), 10, null, true);
    text.setColor(this.textColor);
    entry.add(text);
  }

  entry.refresh = function () {
    var value = +(typeof object[getter] === "function" ?
      object[getter]() : object[getter]);
    field.setContents(value.toFixed(2));
  };

  entry.fixLayout();
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addCheckField = function (string, object, getter, setter) {
  var entry = new AlignmentMorph("row", 4);
  entry.alignment = "left";

  var field = new ToggleMorph("checkbox", object, setter, localize(string), getter);
  field.label.setColor(this.textColor);
  entry.add(field);

  entry.refresh = function () {
    field.refresh();
  };

  entry.fixLayout();
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addRadioField = function (string, object, getter, setter, value) {
  var entry = new AlignmentMorph("row", 4);
  entry.alignment = "left";

  var field = new ToggleMorph("radiobutton", object, function () {
    object[setter](value);
  }, localize(string), function () {
    return value === (typeof object[getter] === "function" ?
      object[getter]() : object[getter]);
  });
  field.label.setColor(this.textColor);
  entry.add(field);

  entry.refresh = function () {
    field.refresh();
  };

  entry.fixLayout();
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addLine = function (width) {
  var entry = new Morph();
  entry.color = new Color(120, 120, 120);
  entry.setHeight(1);
  entry.setWidth(width);
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addText = function (text) {
  var entry = new TextMorph(localize(text), 12, null, true);
  entry.setColor(this.textColor);
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addSpacer = function (height) {
  var entry = new Morph();
  entry.setHeight(height);
  entry.setWidth(0);
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.addConceptButtons = function (sprite, concept, max_level) {
  var myself = this;

  var entry = new AlignmentMorph("row", 4);
  entry.alignment = "left";

  var text = new TextMorph(
    localize(concept.replace(new RegExp('_', 'g'), ' ')) + ":",
    12, null, true, null, "left", 100);
  text.setColor(this.textColor);
  entry.add(text);

  var buttons = [];

  function createButton(level, name) {
    var spacer = new Morph();
    spacer.setHeight(0);
    spacer.setWidth(4);
    entry.add(spacer);

    buttons[level] = new ToggleMorph(
      "radiobutton",
      null,
      function () {
        sprite.setConceptLevel(concept, level);
      },
      name,
      function () {
        return Math.min(sprite.getConceptLevel(concept), max_level) ===
          level;
      });
    buttons[level].label.setColor(myself.textColor);
    entry.add(buttons[level]);
  }

  createButton(0, "not needed");
  createButton(1, "get property");
  if (max_level >= 2) {
    createButton(2, "set property");
  }
  if (max_level >= 3) {
    createButton(3, "change");
  }

  entry.refresh = function () {
    buttons.forEach(function (b) {
      b.refresh();
    });
  };

  entry.fixLayout();
  this.elems.add(entry);
  return entry;
};

PhysicsTabMorph.prototype.init = function (aSprite, sliderColor) {
  PhysicsTabMorph.uber.init.call(this, null, null, sliderColor);
  this.acceptDrops = false;
  this.padding = 10;
  this.contents.acceptsDrops = false;
  this.textColor = new Color(255, 255, 255);

  this.elems = new AlignmentMorph("column", 6);
  this.elems.alignment = "left";
  this.elems.setColor(this.color);

  if (aSprite instanceof StageMorph) {
    this.physicsYGravity = this.addInputField("gravity",
      aSprite, "physicsYGravity", "setPhysicsYGravity", -100, 100, "m/s\u00b2");
    this.physicsFriction = this.addInputField("friction",
      aSprite, "physicsFriction", "setPhysicsFriction", 0, 100);
    this.physicsRestitution = this.addInputField("restitution",
      aSprite, "physicsRestitution", "setPhysicsRestitution", 0, 1);
    this.physicsScale = this.addInputField("scale",
      aSprite, "physicsScale", "setPhysicsScale", 0.01, 100, "pixel/m");
    this.physicsXOrigin = this.addInputField("origin x",
      aSprite, "physicsXOrigin", "setPhysicsXOrigin", -1000, 1000, "pixel");
    this.physicsYOrigin = this.addInputField("origin y",
      aSprite, "physicsYOrigin", "setPhysicsYOrigin", -1000, 1000, "pixel");
    this.physicsAxisAngle = this.addInputField("axis angle",
      aSprite, "physicsAxisAngle", "setPhysicsAxisAngle", -360, 360, "deg");
    this.hasPhysicsFloor = this.addCheckField("enable ground",
      aSprite, "hasPhysicsFloor", "togglePhysicsFloor");
  } else if (aSprite instanceof SpriteMorph) {
    this.physicsModeDisabled = this.addRadioField(
      "physics disabled", aSprite, "physicsMode", "setPhysicsMode", "");
    this.physicsModeStatic = this.addRadioField(
      "static object", aSprite, "physicsMode", "setPhysicsMode", "static");
    this.physicsModeDynamic = this.addRadioField(
      "dynamic object", aSprite, "physicsMode", "setPhysicsMode", "dynamic");

    this.addLine(200);
    this.addText("Global concepts:");
    this.concepts = {};
    this.concepts.simulation_time = this.addConceptButtons(aSprite, "simulation_time", 1);
    this.concepts.delta_time = this.addConceptButtons(aSprite, "delta_time", 2);
    this.concepts.gravity = this.addConceptButtons(aSprite, "gravity", 1);
    this.concepts.friction = this.addConceptButtons(aSprite, "friction", 1);

    this.addSpacer(6);
    this.addText("Object concepts:");
    this.concepts.x_position = this.addConceptButtons(aSprite, "x_position", 3);
    this.concepts.y_position = this.addConceptButtons(aSprite, "y_position", 3);
    this.concepts.heading = this.addConceptButtons(aSprite, "heading", 3);
    this.concepts.x_velocity = this.addConceptButtons(aSprite, "x_velocity", 3);
    this.concepts.y_velocity = this.addConceptButtons(aSprite, "y_velocity", 3);
    this.concepts.angular_velocity = this.addConceptButtons(aSprite, "angular_velocity", 3);
    this.concepts.x_acceleration = this.addConceptButtons(aSprite, "x_acceleration", 3);
    this.concepts.y_acceleration = this.addConceptButtons(aSprite, "y_acceleration", 3);
    this.concepts.mass = this.addConceptButtons(aSprite, "mass", 3);
    this.concepts.x_net_force = this.addConceptButtons(aSprite, "x_net_force", 3);
    this.concepts.y_net_force = this.addConceptButtons(aSprite, "y_net_force", 3);
  }

  this.elems.fixLayout();
  this.elems.setPosition(new Point(5, 5));
  this.add(this.elems);
};

PhysicsTabMorph.prototype.wantsDropOf = function (morph) {
  return false;
};

// ------- SnapSerializer -------

SnapSerializer.prototype.phyOpenProject = SnapSerializer.prototype.openProject;
SnapSerializer.prototype.openProject = function (project, ide) {
  var result = this.phyOpenProject(project, ide);
  ide.stage.setPhysicsFloor(true);
  ide.stage.updateScaleMorph();
  if (ide.controlBar.physicsButton) {
    ide.controlBar.physicsButton.refresh();
  }
  return result;
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
  if (this.currentTab === 'simulation') {
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

IDE_Morph.prototype.openTableDialog = function () {
  if (!this.tableDialog) {
    this.tableDialog = new GraphDialogMorph(this.stage.graphTable, 'table');
  }

  this.tableDialog.popUp(this.world());
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
      'heading in deg': ['heading'],
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

function GraphMorph(table) {
  this.init(table);
}

GraphMorph.prototype = new Morph();
GraphMorph.prototype.constructor = GraphMorph;
GraphMorph.uber = Morph.prototype;

GraphMorph.prototype.init = function (table) {
  GraphMorph.uber.init.call(this);
  this.table = table;
};

GraphMorph.prototype.colors = ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)',
  'rgb(255,255,0)', 'rgb(255,0,255)', 'rgb(0,255,255)', 'rgb(0,0,0)'
];

GraphMorph.prototype.drawNew = function () {
  if (!this.table) {
    return;
  }

  // ChartJS is trying to be too clever for us
  var pixelRatioHack = window.devicePixelRatio || 1.0;
  if (this.image) {
    this.image.width = this.width() / pixelRatioHack;
    this.image.height = this.height() / pixelRatioHack;
  } else {
    this.image = newCanvas(this.extent().scaleBy(1.0 / pixelRatioHack));
  }
  var ctx = this.image.getContext('2d');

  var r, c, labels = [];
  for (r = 1; r < this.table.rows(); r++) {
    var v = +this.table.get(1, r);
    labels.push(v.toFixed(3));
  }

  var datasets = [];
  for (c = 2; c <= this.table.cols(); c++) {
    var data = [],
      color = this.colors[c - 2 % this.colors.length];

    for (r = 1; r < this.table.rows(); r++) {
      data.push(this.table.get(c, r));
    }

    datasets.push({
      label: this.table.get(c, 0),
      borderColor: color,
      backgroundColor: color,
      data: data,
      borderWidth: 1,
      pointRadius: 2
    });
  }

  this.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: false,
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0,
      },
      responsiveAnimationDuration: 0,
      elements: {
        line: {
          fill: false,
          tension: 0
        }
      },
      scales: {
        xAxes: [{
          gridLines: {
            // color: 'rgba(255,0,0,0.7)'
          },
          ticks: {
            autoSkipPadding: 20
          },
          scaleLabel: {
            display: true,
            labelString: 'Time in s'
          }
        }]
      }
    }
  });

  if (false) {
    ctx.fillStyle = "red";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.lineTo(this.width() - 1, 1);
    ctx.lineTo(this.width() - 1, this.height() - 1);
    ctx.lineTo(1, this.height() - 1);
    ctx.lineTo(1, 1);
    ctx.moveTo(0, 0);
    ctx.lineTo(this.width(), this.height());
    ctx.moveTo(this.width(), 0);
    ctx.lineTo(0, this.height());
    ctx.stroke();
  }
};

// ------- GraphDialogMorph -------

GraphDialogMorph.prototype = new DialogBoxMorph();
GraphDialogMorph.prototype.constructor = GraphDialogMorph;
GraphDialogMorph.uber = DialogBoxMorph.prototype;

function GraphDialogMorph(table, mode) {
  this.init(table, mode);
}

GraphDialogMorph.prototype.init = function (table, mode) {
  // additional properties:
  this.handle = null;
  this.table = table;
  this.mode = mode;

  // initialize inherited properties:
  GraphDialogMorph.uber.init.call(this);

  // override inherited properites:
  this.labelString = 'Simulation Data';
  this.createLabel();

  this.buildContents();
};

GraphDialogMorph.prototype.buildContents = function () {
  if (this.mode === 'table') {
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
  } else {
    this.addBody(new GraphMorph(this.table));
  }
  this.addButton('ok', 'Close');
  this.addButton('exportTable', 'Export');
  this.addButton('refresh', 'Refresh');
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
    mex = world.extent().subtract(new Point(this.padding, this.padding));
  this.setExtent(new Point(300, 300).min(mex));
  this.setCenter(this.world().center());
};

GraphDialogMorph.prototype.popUp = function (world) {
  if (world) {
    GraphDialogMorph.uber.popUp.call(this, world);
    if (this.handle) {
      this.handle.destroy();
    } else {
      this.setInitialDimensions();
    }
    this.handle = new HandleMorph(
      this,
      280,
      250,
      this.corner,
      this.corner
    );
    this.refresh();
  }
};

GraphDialogMorph.prototype.fixLayout = BlockEditorMorph.prototype.fixLayout;

GraphDialogMorph.prototype.refresh = function () {
  if (this.body instanceof TableFrameMorph) {
    this.body.tableMorph.drawNew();
  } else if (this.body instanceof GraphMorph) {
    this.body.drawNew();
    this.body.changed();
  }
};

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
};

// ------- TableMorph -------

TableMorph.prototype.step = function () {
  if (this.dragAnchor) {
    this.shiftCells(this.world().hand.position());
  } else if (this.resizeAnchor) {
    this.resizeCells(this.world().hand.position());
  }

  if (this.wantsUpdate) {
    this.update(); // disable automatic refresh
  }
};

// ------- ScriptsMorph -------

ScriptsMorph.prototype.hasHiddenCode = function () {
  return this.children.some(function (block) {
    return (block instanceof HatBlockMorph) && !block.isVisible;
  });
};

ScriptsMorph.prototype.showHiddenCode = function () {
  this.children.forEach(function (block) {
    if ((block instanceof HatBlockMorph) && !block.isVisible) {
      block.show();
    }
  });
};

// ------- HatBlockMorph -------

HatBlockMorph.prototype.physicsSaveToXML = function (serializer) {
  return this.isVisible ? '' : '<physics hidden="true"></physics>';
};

HatBlockMorph.prototype.physicsLoadFromXML = function (model) {
  if (model.attributes.hidden === "true") {
    this.hide();
  }
};