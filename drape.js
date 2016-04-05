if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var stats;
var controls;
var camera, scene, renderer;

var clothGeometry;
var groundMaterial;

var sphere;
var table;
var object;
var ballPositionOffset;
var collidableMeshList = [];

var rotate = true;

var gui;
var guiControls;

var poleMat, clothMaterial,ballMaterial;
init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// scene

	// First thing you need to do is set up a scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

	// camera

	// Second thing you need to do is set up the camera
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.y = 450;
	camera.position.z = 1500;
	scene.add( camera );

	// Third thing you need is a renderer

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( scene.fog.color );
	//renderer.setClearColor(0xffffff);

	container.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMap.enabled = true;

	//STATS
	stats = new Stats();
	container.appendChild( stats.domElement );

	// mouse control
	// CONTROLS
	controls = new THREE.TrackballControls( camera, renderer.domElement );


	// lights

	var light, materials;

	scene.add( new THREE.AmbientLight( 0x666666 ) );

	light = new THREE.DirectionalLight( 0xdfebff, 1.75 );
	light.position.set( 50, 200, 100 );
	light.position.multiplyScalar( 1.3 );

	light.castShadow = true;
	// light.shadowCameraVisible = true;

	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;

	var d = 300;

	light.shadow.camera.left = -d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = -d;

	light.shadow.camera.far = 1000;

	scene.add( light );


	// cloth material

	var loader = new THREE.TextureLoader();
	/*
	var clothTexture = loader.load( "textures/patterns/circuit_pattern.png" );
	clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
	clothTexture.anisotropy = 16;
	*/

	clothMaterial = new THREE.MeshPhongMaterial( {
		color: 0x030303,
		specular: 0x030303,
		wireframeLinewidth: 2,
		//map: clothTexture,
		side: THREE.DoubleSide,
		alphaTest: 0.5
	} );

	// cloth geometry

	// clothGeometry is an object that contains all the points and faces of the cloth
	clothGeometry = new THREE.ParametricGeometry( clothInitialPosition, cloth.w, cloth.h );
	clothGeometry.dynamic = true;

	/*
	var uniforms = { texture:  { type: "t", value: clothTexture } };
	var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
	var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;
	*/

	// cloth mesh

	// a mesh takes the geometry and applies a material to it
	object = new THREE.Mesh( clothGeometry, clothMaterial );
	object.position.set( 0, 0, 0 );
	object.castShadow = true;
	scene.add( object ); // adds the cloth to the scene

	/*
	object.customDepthMaterial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide
	} );
	*/

	// sphere

	var ballGeo = new THREE.SphereGeometry( ballSize, 20, 20 );
	ballMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, side: THREE.DoubleSide} );

	sphere = new THREE.Mesh( ballGeo, ballMaterial );
	sphere.castShadow = true;
	sphere.receiveShadow = true;
	scene.add( sphere );

	// ground

	/*
	var groundTexture = loader.load( "textures/terrain/grasslight-big.jpg" );
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.repeat.set( 25, 25 );
	groundTexture.anisotropy = 16;
	*/

	groundMaterial = new THREE.MeshPhongMaterial(
		{
			color: 0x030303,
			specular: 0x111111//,
			//map: groundTexture
		} );

	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
	mesh.position.y = -250;
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add( mesh );

	// poles

	var poleGeo = new THREE.BoxGeometry( 5, 250+125, 5 );
	poleMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 100, side: THREE.DoubleSide} );

	var mesh = new THREE.Mesh( poleGeo, poleMat );
	mesh.position.x = -250;
	mesh.position.z = 250;
	mesh.position.y = -(125-125/2);
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

	var mesh = new THREE.Mesh( poleGeo, poleMat );
	mesh.position.x = 250;
	mesh.position.z = 250;
	mesh.position.y = -(125-125/2);
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

	var mesh = new THREE.Mesh( poleGeo, poleMat );
	mesh.position.x = 250;
	mesh.position.z = -250;
	mesh.position.y = -(125-125/2);
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

	var mesh = new THREE.Mesh( poleGeo, poleMat );
	mesh.position.x = -250;
	mesh.position.z = -250;
	mesh.position.y = -62;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

/*
  var mesh = new THREE.Mesh( new THREE.BoxGeometry( 500, 5, 5 ), poleMat );
	mesh.position.x = 0;
	mesh.position.z = 250;
	mesh.position.y = 125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

  var mesh = new THREE.Mesh( new THREE.BoxGeometry( 500, 5, 5 ), poleMat );
	mesh.position.x = 0;
	mesh.position.z = -250;
	mesh.position.y = 125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

  var mesh = new THREE.Mesh( new THREE.BoxGeometry( 5, 5, 500 ), poleMat );
	mesh.position.x = 250;
	mesh.position.z = 0;
	mesh.position.y = 125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

  var mesh = new THREE.Mesh( new THREE.BoxGeometry( 5, 5, 500 ), poleMat );
	mesh.position.x = -250;
	mesh.position.z = 0;
	mesh.position.y = 125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );
*/

  	table = new THREE.Mesh( new THREE.BoxGeometry( 250, 20, 250 ), poleMat );
	table.position.x = 0;
	table.position.y = 0;
	table.position.z = 0;
	table.receiveShadow = true;
	table.castShadow = true;
	scene.add( table );

/*
	var gg = new THREE.BoxGeometry( 10, 10, 10 );
	var mesh = new THREE.Mesh( gg, poleMat );
	mesh.position.y = -250;
	mesh.position.x = 125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );

	var mesh = new THREE.Mesh( gg, poleMat );
	mesh.position.y = -250;
	mesh.position.x = -125;
	mesh.receiveShadow = true;
	mesh.castShadow = true;
	scene.add( mesh );
*/


	window.addEventListener( 'resize', onWindowResize, false );

	sphere.visible = false;
	table.visible = false;

	if(sphere.visible){
		ballPositionOffset = Date.now();
		collidableMeshList.push(sphere);
	}

	if(table.visible){
		collidableMeshList.push(table);
	}


}

//

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

	requestAnimationFrame( animate );

	var time = Date.now();

	simulate(time); // run physics simulation to create new positions of cloth
	render(); 		// update position of cloth, compute normals, rotate camera, render the scene
	stats.update();
	controls.update();

}

// restartCloth() is used when we change a fundamental cloth property with a slider
// and therefore need to recreate the cloth object from scratch
function restartCloth()
{


		scene.remove(object);
		//clothInitialPosition = plane( 500, 500 );
		cloth = new Cloth( xSegs, ySegs );
		gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );

		clothGeometry = new THREE.ParametricGeometry( clothInitialPosition, xSegs, ySegs );
		clothGeometry.dynamic = true;

		// cloth mesh

		// a mesh takes the geometry and applies a material to it
		object = new THREE.Mesh( clothGeometry, clothMaterial );
		object.position.set( 0, 0, 0 );
		object.castShadow = true;

		scene.add( object ); // adds the cloth to the scene


}

// the rendering happens here
// creates a loop that causes the rendere to draw the scene 60 times a second
function render() {

	var timer = Date.now() * 0.0002;

	var p = cloth.particles;

	// update position of the cloth
	// from the cloth particles to the cloth geometry
	for ( var i = 0, il = p.length; i < il; i ++ ) {

		clothGeometry.vertices[ i ].copy( p[ i ].position );

	}

	clothGeometry.computeFaceNormals();
	clothGeometry.computeVertexNormals();

	clothGeometry.normalsNeedUpdate = true;
	clothGeometry.verticesNeedUpdate = true;

	sphere.position.copy( ballPosition );

	if ( rotate ) {

		var cameraRadius = Math.sqrt(camera.position.x*camera.position.x + camera.position.z*camera.position.z);
		camera.position.x = Math.cos( timer ) * cameraRadius;
		camera.position.z = Math.sin( timer ) * cameraRadius;

	}

	camera.lookAt( scene.position );

	renderer.render( scene, camera );

}

/*
function map(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
}
*/