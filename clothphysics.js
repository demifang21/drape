// Drape - a fabric simulation software
// Built using three.js starting from the simple cloth simulation
// http://threejs.org/examples/#webgl_animation_cloth

var guiEnabled = true;

var structuralSprings = true;
var shearSprings = false;
var bendingSprings = true;

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;

var springStiffness = 1; // number between 0 and 1. smaller = springier, bigger = stiffer

var restDistanceB = 2;
var springStiffnessB = 1;

var restDistanceS = Math.sqrt(2);
var springStiffnessS = 1;

var friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place

var xSegs = 30; // how many particles wide is the cloth
var ySegs = 30; // how many particles tall is the cloth

var fabricLength = 600; // sets the size of the cloth
var restDistance = fabricLength/xSegs;

var weight = 140;
//var newCollisionDetection = true;

var wind = true;
var windStrength;
var windForce = new THREE.Vector3( 0, 0, 0 );

if(guiEnabled){

  // GUI controls
  //sliders

  guiControls = new function(){
    //this.cameraHeight = 450;
    //this.particleMass = MASS*10;
    this.friction = friction;
    this.particles = xSegs;
    //this.particlesWide = xSegs;
    //this.particlesLong = ySegs;
    //this.newCollisionDetection = newCollisionDetection;
    //this.damping = DAMPING;

    this.weight = weight;

    //this.windStrength = windStrength;

    this.fabricLength = fabricLength;
    this.structuralSprings = structuralSprings;
    //this.structuralSpringStiffness = springStiffness;

    this.bendingSprings = bendingSprings;
    this.bendingSpringLengthMultiplier = restDistanceB;
    //this.bendingSpringStiffness = springStiffnessB;

    this.shearSprings = shearSprings;
    this.shearSpringLengthMultiplier = restDistanceS;
    //this.shearSpringStiffness = springStiffnessS;

    this.clothColor = 0xaa2929;
    this.clothSpecular = 0x030303;

    this.groundColor = 0x404761;
    this.groundSpecular = 0x404761;

    this.fogColor = 0xcce0ff;

  };

  gui = new dat.GUI();

  var f0 = gui.add(guiControls, 'fabricLength', 200, 1000).name('Fabric Length').onChange(function(value){fabricLength = value; restartCloth();});

  var f1 = gui.addFolder('Fabric Weave');

  f1.add(guiControls, 'structuralSprings').name('cross grain').onChange(function(value){structuralSprings = value; restartCloth();});
  //f1.add(guiControls, 'structuralSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffness = value; restartCloth();});
  f1.add(guiControls, 'shearSprings').name('bias grain').onChange(function(value){shearSprings = value; restartCloth();});
  //f1.add(guiControls, 'shearSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffnessS = value; restartCloth();});
  //f1.add(guiControls, 'shearSpringLengthMultiplier', 1, 2).name('multiplier').onChange(function(value){restDistanceS = value; restartCloth();});
  f1.add(guiControls, 'bendingSprings').name('drape').onChange(function(value){bendingSprings = value; restartCloth();});
  //f1.add(guiControls, 'bendingSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffnessB = value; restartCloth();});
  //f1.add(guiControls, 'bendingSpringLengthMultiplier', 1.5, 2.5).name('multiplier').onChange(function(value){restDistanceB = value; restartCloth();});

  var f2 = gui.addFolder('Fabric Physics');

  //f2.add(guiControls, 'newCollisionDetection').name('use raycasting').onChange(function(value){newCollisionDetection = value;});
  f2.add(guiControls, 'friction', 0, 1).onChange(function(value){friction = value;});
  f2.add(guiControls, 'weight', 0, 500).step(1).onChange(function(value){weight = value; restartCloth();});
  f2.add(guiControls, 'particles', 10, 50).step(1).onChange(function(value){xSegs = value; ySegs = value; restartCloth();});
  //f2.add(guiControls, 'windStrength', 0, 4).name('wind strength').onChange(function(value){windStrength = value;});


  var f3 = gui.addFolder('Colors');
  f3.addColor(guiControls, 'clothColor').name('cloth color').onChange(function(value){clothMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'clothSpecular').name('cloth reflection').onChange(function(value){clothMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'groundColor').name('ground color').onChange(function(value){groundMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'groundSpecular').name('gnd reflection').onChange(function(value){groundMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'fogColor').onChange(function(value){scene.fog.color.setHex(value); renderer.setClearColor(scene.fog.color);});

  //var f4 = gui.addFolder('Physics');

  //f4.add(guiControls, 'particleMass', 0, 10).onChange(function(value){MASS = value/10; restartCloth();});
  //f4.add(guiControls, 'damping', 0, 1).onChange(function(value){DAMPING = value; DRAG = 1 - DAMPING; restartCloth();});

  //f4.add(guiControls, 'friction', 0, 1).onChange(function(value){friction = value; restartCloth();});

  gui.remember(guiControls);

}

var clothInitialPosition = plane( 500, 500 );
var cloth = new Cloth( xSegs, ySegs, fabricLength );

var GRAVITY = 9.81 * weight; //
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

//var pins = [];
var pinned = true;


var ballSize = 500/4; //40
var ballPosition = new THREE.Vector3( 0, -250+ballSize, 0 );
var prevBallPosition = new THREE.Vector3( 0, -250+ballSize, 0 );

var tmpForce = new THREE.Vector3();

var lastTime;

var pos;

// var ray = new THREE.Raycaster();
// var collisionResults, newCollisionResults;
var whereAmI, whereWasI;
// var directionOfMotion, distanceTraveled;

var posFriction = new THREE.Vector3( 0, 0, 0 );
var posNoFriction = new THREE.Vector3( 0, 0, 0 );

var diff = new THREE.Vector3();
var objectCenter = new THREE.Vector3();

var a,b,c,d,e,f;

var nearestX, nearestY, nearestZ;
var currentX, currentY, currentZ;
var xDist, yDist, zDist;

function createBall(){
  sphere.visible = !sphere.visible;
  if(table.visible){table.visible = false;}
  if(sphere.visible){restartCloth();}
}

function createTable(){

  table.visible = !table.visible;
  if(sphere.visible){sphere.visible = false;}
  if(table.visible){
    a = boundingBox.min.x;
    b = boundingBox.min.y;
    c = boundingBox.min.z;
    d = boundingBox.max.x;
    e = boundingBox.max.y;
    f = boundingBox.max.z;
    restartCloth();
  }
}

function wireFrame(){

  poleMat.wireframe = !poleMat.wireframe;
  clothMaterial.wireframe = !clothMaterial.wireframe;
  ballMaterial.wireframe = !ballMaterial.wireframe;

}

function plane( width, height ) {

  return function( u, v ) {

    //var x = u * width - width/2;
    //var y = v * height + height/2;
    //var z = 0;

    var x = u * width - width/2;
    var y = 125; //height/2;
    var z = v * height - height/2;

    return new THREE.Vector3( x, y, z );

  };

}

function Particle( x, y, z, mass ) {

  this.position = clothInitialPosition( x, y ); // position
  this.previous = clothInitialPosition( x, y ); // previous
  this.original = clothInitialPosition( x, y );
  this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();

}

Particle.prototype.lockToOriginal = function() {

    this.position.copy( this.original );
    this.previous.copy( this.original );
}

Particle.prototype.lock = function() {

    this.position.copy( this.previous );
    this.previous.copy( this.previous );

}


// Force -> Acceleration
Particle.prototype.addForce = function( force ) {

  this.a.add(
    this.tmp2.copy( force ).multiplyScalar( this.invMass )
  );

};


// Performs verlet integration
Particle.prototype.integrate = function( timesq ) {

  var newPos = this.tmp.subVectors( this.position, this.previous );
  newPos.multiplyScalar( DRAG ).add( this.position );
  newPos.add( this.a.multiplyScalar( timesq ) );

  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;

  this.a.set( 0, 0, 0 );

};



function satisifyConstrains( p1, p2, distance, stiffness ) {

  diff.subVectors( p2.position, p1.position );
  var currentDist = diff.length();
  if ( currentDist == 0 ) return; // prevents division by 0
  var correction = diff.multiplyScalar( stiffness*(currentDist - distance) / currentDist);
  var correctionHalf = correction.multiplyScalar( 0.5 );
  p1.position.add( correctionHalf );
  p2.position.sub( correctionHalf );

}


function Cloth( w, h, l ) {

  //w = w || 10;
  //h = h || 10;
  this.w = w;
  this.h = h;
  restDistance = l/w;


  var particles = [];
  var constrains = [];

  var u, v;

  // Create particles
  for (v=0; v<=h; v++) {
    for (u=0; u<=w; u++) {
      particles.push(
        new Particle(u/w, v/h, 0, MASS)
      );
    }
  }

    for (v=0; v<=h; v++) {
      for (u=0; u<=w; u++) {

        if(v<h && (u == 0 || u == w)){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v + 1 ) ],
            restDistance,
            springStiffness
          ] );
        }

        if(u<w && (v == 0 || v == h)){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u + 1, v ) ],
            restDistance,
            springStiffness
          ] );
        }
      }
    }


  // Structural

  if(structuralSprings){

    for (v=0; v<h; v++) {
      for (u=0; u<w; u++) {

        if(u!=0){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v+1 ) ],
            restDistance,
            springStiffness
          ] );
        }

        if(v!=0){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u+1, v ) ],
            restDistance,
            springStiffness
          ] );
        }

      }
    }
  }

  // Shear

  if(shearSprings){

   for (v=0;v<=h;v++)
   {
    for (u=0;u<=w;u++)
    {

      if(v<h && u<w){
        constrains.push([
          particles[index(u, v)],
          particles[index(u+1, v+1)],
          restDistanceS*restDistance,
          springStiffnessS
        ]);

        constrains.push([
          particles[index(u+1, v)],
          particles[index(u, v+1)],
          restDistanceS*restDistance,
          springStiffnessS
        ]);
      }

    }
   }
  }



// Bending springs

  if(bendingSprings){

    for (v=0; v<h; v++)
    {

      for (u=0; u<w; u++)
      {

        if(v<h-1){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v+2 ) ],
            restDistanceB*restDistance,
            springStiffnessB
          ] );
        }

        if(u<w-1){
          constrains.push( [
            particles[ index( u, v ) ],
            particles[ index( u+2, v ) ],
            restDistanceB*restDistance,
            springStiffnessB
          ] );
        }


      }
    }
  }




  this.particles = particles;
  this.constrains = constrains;

  function index( u, v ) {

    return u + v * ( w + 1 );

  }

  this.index = index;

}

function map(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
}

function simulate( time ) {

  if ( ! lastTime ) {

    lastTime = time;
    return;

  }

  var i, il, particles, particle, pt, constrains, constrain;

  // Aerodynamics forces
  if ( wind )
  {

    windStrength = Math.cos( time / 7000 ) * 20 + 40;
    windForce.set(
      Math.sin( time / 2000 ),
      Math.cos( time / 3000 ),
      Math.sin( time / 1000 )
      ).normalize().multiplyScalar( windStrength);

    // apply the wind force to the cloth particles
    var face, faces = clothGeometry.faces, normal;
    particles = cloth.particles;
    for ( i = 0, il = faces.length; i < il; i ++ ) {
      face = faces[ i ];
      normal = face.normal;
      tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
      particles[ face.a ].addForce( tmpForce );
      particles[ face.b ].addForce( tmpForce );
      particles[ face.c ].addForce( tmpForce );
    }

  }

  for ( particles = cloth.particles, i = 0, il = particles.length ; i < il; i ++ )
  {
    particle = particles[ i ];
    particle.addForce( gravity );
    particle.integrate( TIMESTEP_SQ ); // performs verlet integration
  }

  // Start Constrains

  constrains = cloth.constrains,
  il = constrains.length;
  for ( i = 0; i < il; i ++ ) {
    constrain = constrains[ i ];
    satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ], constrain[ 3] );
  }

    prevBallPosition.copy(ballPosition);
    ballPosition.y = 50*Math.sin(Date.now()/600);
    ballPosition.x = 50*Math.sin(Date.now()/600);
    ballPosition.z = 50*Math.cos(Date.now()/600);
    sphere.position.copy( ballPosition ); //maybe remove this since it's also in render()

    for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ )
    {

      particle = particles[ i ];
      whereAmI = particle.position;
      whereWasI = particle.previous;

      // check to see if point is inside sphere
      if(sphere.visible){

        diff.subVectors( whereAmI, ballPosition );
        if ( diff.length() < ballSize ) {
          // if yes, we've collided, so take correcting action

          // no friction behavior:
          // project point out to nearest point on sphere surface
          diff.normalize().multiplyScalar( ballSize );
          posNoFriction.copy( ballPosition ).add( diff );

          diff.subVectors(whereWasI,ballPosition);

          if (!diff.length()<ballSize ) { // if statement added for bugfix
            // with friction behavior:
            // add the distance that the sphere moved in the last frame
            // to the previous position of the particle
            diff.subVectors(ballPosition,prevBallPosition);
            posFriction.copy(whereWasI).add(diff);

            posNoFriction.multiplyScalar(1-friction);
            posFriction.multiplyScalar(friction);
            whereAmI.copy(posFriction.add(posNoFriction));
          }
          else{
            whereAmI.copy(posNoFriction);
          }
        }
      }

      // check to see if point is inside table
      if(table.visible){
        if(boundingBox.containsPoint(whereAmI)){
          // if yes, we've collided, so take correcting action

          // no friction behavior:
          // place point at the nearest point on the surface of the cube
          currentX = whereAmI.x;
          currentY = whereAmI.y;
          currentZ = whereAmI.z;

          if(currentX <= (a + d)/2){nearestX = a;}
          else{nearestX = d;}

          if(currentY <= (b + e)/2){nearestY = b;}
          else{nearestY = e;}

          if(currentZ <= (c + f)/2){nearestZ = c;}
          else{nearestZ = f;}

          xDist = Math.abs(nearestX-currentX);
          yDist = Math.abs(nearestY-currentY);
          zDist = Math.abs(nearestZ-currentZ);

          posNoFriction.copy(whereAmI);

          if(zDist<=xDist && zDist<=yDist)
          {
            posNoFriction.z = nearestZ;
          }
          else if(yDist<=xDist && yDist<=zDist)
          {
            posNoFriction.y = nearestY;
          }
          else if(xDist<=yDist && xDist<=zDist)
          {
            posNoFriction.x = nearestX;
          }

          if(!boundingBox.containsPoint(whereWasI)){ // if statement added for bugfix
            // with friction behavior:
            // set particle to its previous position
            posFriction.copy(whereWasI);
            whereAmI.copy(posFriction.multiplyScalar(friction).add(posNoFriction.multiplyScalar(1-friction)));
          }
          else{
            whereAmI.copy(posNoFriction);
          }
        }
      }

    }

  // Floor Constains
  for ( particles = cloth.particles, i = 0, il = particles.length
      ; i < il; i ++ )
  {
    particle = particles[ i ];
    pos = particle.position;
    if ( pos.y < - 249 ) {pos.y = - 249;}
  }

  // Pin Constrains
  if(pinned){
    particles[cloth.index(0,0)].lockToOriginal();
    particles[cloth.index(xSegs,0)].lockToOriginal();
    particles[cloth.index(0,ySegs)].lockToOriginal();
    particles[cloth.index(xSegs,ySegs)].lockToOriginal();
  }

}