/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf



var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;
var restDistance = 30; // sets the size of the cloth
var springStiffness = 0.5; // number between 0 and 1. smaller = springier, bigger = stiffer


var xSegs = 20; // how many particles wide is the cloth
var ySegs = 20; // how many particles tall is the cloth

var clothInitialPosition = plane( 500, 500 );

var cloth = new Cloth( xSegs, ySegs );

var GRAVITY = 9.81 * 140; //
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

//var pins = [];
var pinned = false;

var wind = true;
var windStrength = 2;
var windForce = new THREE.Vector3( 0, 0, 0 );

var ballSize = 500/4; //40
var ballPosition = new THREE.Vector3( 0, -250+ballSize, 0 );
var ballPositionOffset;

var tmpForce = new THREE.Vector3();

var lastTime;

var pos;


function createBall(){
  sphere.visible = !sphere.visible;
  ballPositionOffset = Date.now();
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


  // While many system uses shear and bend springs,
  // the relax constrains model seem to be just fine
  // using structural springs.
  // Shear
  /*
   var diagonalDist = Math.sqrt(restDistance * restDistance * 2);


   for (v=0;v<h;v++) {
    for (u=0;u<w;u++) {

      constrains.push([
        particles[index(u, v)],
        particles[index(u+1, v+1)],
        diagonalDist
      ]);

      constrains.push([
        particles[index(u+1, v)],
        particles[index(u, v+1)],
        diagonalDist
      ]);

    }
   }
  */

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

    ballPosition.y = map(Math.sin( ((Date.now()-ballPositionOffset) / 600) - Math.PI/2 ),-1,1,-250+ballSize,250); //+ 40;

    for ( particles = cloth.particles, i = 0, il = particles.length
        ; i < il; i ++ ) {

      particle = particles[ i ];
      var whereAmI = particle.position;
      var whereWasI = particle.previous;

      diff.subVectors(whereAmI,whereWasI);
      var directionOfMotion = diff.clone().normalize();
      var ray = new THREE.Raycaster( whereWasI, directionOfMotion );
      var collisionResults = ray.intersectObjects( collidableMeshList );

      for ( j = 0, jl = collisionResults.length
          ; j < jl; j ++ ) {

        if(collisionResults[j].distance < diff.length()){
          //console.log("collision");
          whereAmI.copy(whereWasI);
          //diff.subVectors(whereWasI,collisionResults[j].point).multiplyScalar(0.99);
          //whereAmI.addVectors(whereWasI,diff);
        }
      }

  }

  // Ball Constrains


/*
  if ( sphere.visible ){
    ballPosition.y = map(Math.sin( ((Date.now()-ballPositionOffset) / 600) - Math.PI/2 ),-1,1,-250+ballSize,250); //+ 40;


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


 if ( table.visible ){

    for ( particles = cloth.particles, i = 0, il = particles.length
        ; i < il; i ++ ) {

      particle = particles[ i ];

      pos = particle.position;


      if ( table0.containsPoint(pos) ) {

      // collided
      //console.log("collision " + time);
      diff.subVectors( pos, table.position ).normalize();
      var ray = new THREE.Raycaster(table.position, diff);
      var rectDist = ray.intersectObject(table).distance;
      pos.copy( particle.tmp );
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