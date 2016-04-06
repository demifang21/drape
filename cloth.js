/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

var guiEnabled = true;

var structuralSprings = true;
var shearSprings = false;
var bendingSprings = true;

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;

var restDistance = 50; // sets the size of the cloth
var springStiffness = 1; // number between 0 and 1. smaller = springier, bigger = stiffer

var restDistanceB = 2*restDistance;
var springStiffnessB = 1;

var restDistanceS = Math.sqrt(2)*restDistance;
var springStiffnessS = 1;

var friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place

var xSegs = 10; // how many particles wide is the cloth
var ySegs = 10; // how many particles tall is the cloth

if(guiEnabled){

  // GUI controls
  //sliders

  guiControls = new function(){
    //this.cameraHeight = 450;
    this.particleMass = MASS*10;
    this.friction = friction;
    this.particlesWide = xSegs;
    this.particlesLong = ySegs;
    this.damping = DAMPING;

    this.structuralSprings = structuralSprings;
    this.structuralSpringLength = restDistance;
    this.structuralSpringStiffness = springStiffness;

    this.bendingSprings = bendingSprings;
    this.bedingSpringLength = restDistanceB;
    this.bendingSpringStiffness = springStiffnessB;

    this.shearSprings = shearSprings;
    this.shearSpringLength = restDistanceS;
    this.shearSpringStiffness = springStiffnessS;

    this.clothColor = 0x030303;
    this.clothSpecular = 0x030303;

    this.groundColor = 0x030303;
    this.groundSpecular = 0x111111;

    this.fogColor = 0xcce0ff;

  };

  gui = new dat.GUI();

  //gui.add(guiControls, 'cameraHeight', -1000, 1000).onChange(function(value){camera.position.y = value; restartCloth();});

  var f1 = gui.addFolder('Springs');

  f1.add(guiControls, 'structuralSprings').onChange(function(value){structuralSprings = value; restartCloth();});
  f1.add(guiControls, 'structuralSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffness = value; restartCloth();});
  f1.add(guiControls, 'structuralSpringLength', 10, 150).name('length').onChange(function(value){restDistance = value; restartCloth();});

  f1.add(guiControls, 'bendingSprings').onChange(function(value){bendingSprings = value; restartCloth();});
  f1.add(guiControls, 'bendingSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffnessB = value; restartCloth();});
  f1.add(guiControls, 'bedingSpringLength', 10, 150).name('length').onChange(function(value){restDistanceB = value; restartCloth();});

  f1.add(guiControls, 'shearSprings').onChange(function(value){shearSprings = value; restartCloth();});
  f1.add(guiControls, 'shearSpringStiffness', 0, 1).name('stiffness').onChange(function(value){springStiffnessS = value; restartCloth();});
  f1.add(guiControls, 'shearSpringLength', 10, 150).name('length').onChange(function(value){restDistanceS = value; restartCloth();});

  var f2 = gui.addFolder('Geometry');

  f2.add(guiControls, 'particlesWide', 0, 20).step(1).onChange(function(value){xSegs = value; restartCloth();});
  f2.add(guiControls, 'particlesLong', 0, 20).step(1).onChange(function(value){ySegs = value; restartCloth();});

  var f3 = gui.addFolder('Colors');
  f3.addColor(guiControls, 'clothColor').onChange(function(value){clothMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'clothSpecular').onChange(function(value){clothMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'groundColor').onChange(function(value){groundMaterial.color.setHex(value);});
  f3.addColor(guiControls, 'groundSpecular').onChange(function(value){groundMaterial.specular.setHex(value);});
  f3.addColor(guiControls, 'fogColor').onChange(function(value){scene.fog.color.setHex(value); renderer.setClearColor(scene.fog.color);});

  var f4 = gui.addFolder('Physics');

  f4.add(guiControls, 'particleMass', 0, 10).onChange(function(value){MASS = value/10; restartCloth();});
  f4.add(guiControls, 'damping', 0, 1).onChange(function(value){DAMPING = value; DRAG = 1 - DAMPING; restartCloth();});

  f4.add(guiControls, 'friction', 0, 1).onChange(function(value){friction = value; restartCloth();});

  gui.remember(guiControls);

}


var clothInitialPosition = plane( 500, 500 );
var cloth = new Cloth( xSegs, ySegs );

var GRAVITY = 9.81 * 140; //
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

//var pins = [];
var pinned = true;

var wind = true;
var windStrength = 2;
var windForce = new THREE.Vector3( 0, 0, 0 );

var ballSize = 500/4; //40
var ballPosition = new THREE.Vector3( 0, -250+ballSize, 0 );
var ballPositionOffset;

var tmpForce = new THREE.Vector3();

var lastTime;

var pos;

var ray = new THREE.Raycaster();
var collisionResults, newCollisionResults;
var whereAmI, whereWasI, directionOfMotion;

var newPosition = new THREE.Vector3( 0, 0, 0 );
var oldPosition = new THREE.Vector3( 0, 0, 0 );


function createBall(){
  sphere.visible = !sphere.visible;
  ballPositionOffset = Date.now();
  if(sphere.visible){
    collidableMeshList.push(sphere);
  }
  else{
    var i = collidableMeshList.indexOf(sphere);
    collidableMeshList.splice(i, 1);
  }
}

function createTable(){
  table.visible = !table.visible;
  if(table.visible){
    collidableMeshList.push(table);
  }
  else{
    var i = collidableMeshList.indexOf(table);
    collidableMeshList.splice(i, 1);
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


var diff = new THREE.Vector3();
var newPosition = new THREE.Vector3();

function satisifyConstrains( p1, p2, distance, stiffness ) {

  diff.subVectors( p2.position, p1.position );
  var currentDist = diff.length();
  if ( currentDist == 0 ) return; // prevents division by 0
  var correction = diff.multiplyScalar( stiffness*(currentDist - distance) / currentDist);
  var correctionHalf = correction.multiplyScalar( 0.5 );
  p1.position.add( correctionHalf );
  p2.position.sub( correctionHalf );

}


function Cloth( w, h ) {

  //w = w || 10;
  //h = h || 10;
  this.w = w;
  this.h = h;

  var particles = [];
  var constrains = [];

  var u, v;

  // Create particles
  for ( v = 0; v <= h; v ++ ) {

    for ( u = 0; u <= w; u ++ ) {

      particles.push(
        new Particle( u / w, v / h, 0, MASS )
      );

    }

  }

  // Structural

  if(structuralSprings){
    for ( v = 0; v < h; v ++ ) {

      for ( u = 0; u < w; u ++ ) {

        constrains.push( [
          particles[ index( u, v ) ],
          particles[ index( u, v + 1 ) ],
          restDistance,
          springStiffness
        ] );

        constrains.push( [
          particles[ index( u, v ) ],
          particles[ index( u + 1, v ) ],
          restDistance,
          springStiffness
        ] );

      }

    }

    for ( u = w, v = 0; v < h; v ++ ) {

      constrains.push( [
        particles[ index( u, v ) ],
        particles[ index( u, v + 1 ) ],
        restDistance,
        springStiffness
      ] );

    }

    for ( v = h, u = 0; u < w; u ++ ) {

      constrains.push( [
        particles[ index( u, v ) ],
        particles[ index( u + 1, v ) ],
        restDistance,
        springStiffness
      ] );

    }
  }

  // While many system uses shear and bend springs,
  // the relax constrains model seem to be just fine
  // using structural springs.
  // Shear

  if(shearSprings){
   //var diagonalDist = Math.sqrt(restDistance * restDistance * 2);


   for (v=0;v<h;v++) {
    for (u=0;u<w;u++) {

      constrains.push([
        particles[index(u, v)],
        particles[index(u+1, v+1)],
        restDistanceS,
        springStiffnessS
      ]);

      constrains.push([
        particles[index(u+1, v)],
        particles[index(u, v+1)],
        restDistanceS,
        springStiffnessS
      ]);

    }
   }
  }



// Bending springs

  if(bendingSprings){
    for ( v = 0; v < h-1; v ++ ) {

      for ( u = 0; u < w-1; u ++ ) {

        constrains.push( [
          particles[ index( u, v ) ],
          particles[ index( u, v + 2 ) ],
          restDistanceB,
          springStiffnessB
        ] );

        constrains.push( [
          particles[ index( u, v ) ],
          particles[ index( u + 2, v ) ],
          restDistanceB,
          springStiffnessB
        ] );

      }

    }

    for ( u = w, v = 0; v < h-1; v ++ ) {

      constrains.push( [
        particles[ index( u, v ) ],
        particles[ index( u, v + 2 ) ],
        restDistanceB,
        springStiffnessB
      ] );

    }

    for ( v = h, u = 0; u < w-1; u ++ ) {

      constrains.push( [
        particles[ index( u, v ) ],
        particles[ index( u + 2, v ) ],
        restDistanceB,
        springStiffnessB
      ] );

    }
  }




  this.particles = particles;
  this.constrains = constrains;

  function index( u, v ) {

    return u + v * ( w + 1 );

  }

  this.index = index;



}

function simulate( time ) {

  if ( ! lastTime ) {

    lastTime = time;
    return;

  }

  var i, il, particles, particle, pt, constrains, constrain;

  // Aerodynamics forces
  if ( wind ) {

    windStrength = Math.cos( time / 7000 ) * 20 + 40;
    //windForce.set( Math.sin( time / 2000 ), Math.sin( time / 3000 ), Math.cos( time / 1000 ) ).normalize().multiplyScalar( windStrength );
    windForce.set(
      Math.sin( time / 2000 ),
      Math.cos( time / 3000 ),
      Math.sin( time / 1000 )
      ).normalize().multiplyScalar( windStrength);


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

  for ( particles = cloth.particles, i = 0, il = particles.length
      ; i < il; i ++ ) {

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

    //ballPosition.y = map(Math.sin( ((Date.now()-ballPositionOffset) / 600) - Math.PI/2 ),-1,1,-250+ballSize,250); //+ 40;
    //sphere.position.copy( ballPosition );

    if(sphere.visible){

      for ( particles = cloth.particles, i = 0, il = particles.length
          ; i < il; i ++ ) {

        particle = particles[ i ];
        pos = particle.position;
        diff.subVectors( pos, ballPosition );
        if ( diff.length() < ballSize ) {

          // collided
          diff.normalize().multiplyScalar( ballSize );
          pos.copy( ballPosition ).add( diff );

        }

      }


    }
    /*
    for ( particles = cloth.particles, i = 0, il = particles.length
        ; i < il; i ++ ) {

      particle = particles[ i ];
      whereAmI = particle.position;
      whereWasI = particle.previous;

      diff.subVectors(whereAmI,whereWasI);
      directionOfMotion = diff.clone().normalize();

      ray.set(whereWasI, directionOfMotion); // set origin and direction of a ray
      collisionResults = ray.intersectObjects( collidableMeshList ); // calculate intersections of this ray with stuff


      if(collisionResults.length > 0){


        // if distance to collision is less than distance covered in this frame
        // we're about to collide

        if(collisionResults[0].distance < diff.length()){

          ray.set(whereAmI, collisionResults[0].face.normal);
          newCollisionResults = ray.intersectObjects( [collisionResults[0].object] );

          // take appropriate action to avoid collision
          if(newCollisionResults.length>0){
            diff.subVectors( newCollisionResults[0].point, collisionResults[0].object.position );
            diff.multiplyScalar( 1 + Math.pow(10,-3));
            newPosition.copy(collisionResults[0].object.position).add( diff ).multiplyScalar(1-friction);
            if(whereWasI.distanceTo(newPosition) > -1){
              oldPosition.copy(whereWasI).multiplyScalar(friction);
              whereAmI.addVectors(newPosition,oldPosition);
            }
            else{
              whereAmI.copy(newPosition);
            }
          }


          // if the ray being cast intersects objects an odd numner of times
          // it means we're already inside an object
          // i.e. we've already collided in the past. So take appropriate action

          else if(collisionResults.length % 2 == 1){
             //console.log("particle "+i+ " is struck inside an object at time " + time);
            // may want to add some correcting behavior here
          }


        }

      }

  }
  */

  // Floor Constains
  for ( particles = cloth.particles, i = 0, il = particles.length
      ; i < il; i ++ ) {

    particle = particles[ i ];
    pos = particle.position;
    if ( pos.y < - 249 ) {

      pos.y = - 249;

    }

  }

  // Pin Constrains

  if(pinned){
    particles[cloth.index(0,0)].lockToOriginal();
    particles[cloth.index(xSegs,0)].lockToOriginal();
    particles[cloth.index(0,ySegs)].lockToOriginal();
    particles[cloth.index(xSegs,ySegs)].lockToOriginal();

    //particles[cloth.index(xSegs/2,0)].lockToOriginal();
    //particles[cloth.index(0,ySegs/2)].lockToOriginal();
    //particles[cloth.index(xSegs/2,ySegs)].lockToOriginal();
    //particles[cloth.index(xSegs,ySegs/2)].lockToOriginal();

  }

/*
  for ( i = 0, il = pins.length; i < il; i ++ ) {

    var xy = pins[ i ];
    var p = particles[ xy ];
    p.lock();

  }
*/

}