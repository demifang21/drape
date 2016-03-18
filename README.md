# Drape
A fabric design and simulation tool, built in [three.js](http://threejs.org/) starting from the [cloth simulation](http://threejs.org/examples/webgl_animation_cloth) example.

## To run online:

[Default branch](https://cdn.rawgit.com/aatishb/drape/master/index.html) (Latest stable version)

[collisiondetection branch](https://cdn.rawgit.com/aatishb/drape/collisiondetection/index.html) (A branch to implement collision detection. Currently unstable, work in progress.)

## To run on your own computer:

1. Download code and unzip
2. Opening index.html runs code without textures. For textures to work, run with a local server (instructions [here](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally) or [here](https://github.com/processing/p5.js/wiki/Local-server)). Alternatively, use the [p5 editor](http://p5js.org/download/) to run.

## TODO

1. Collision detection ([Ref 1](https://scholar.google.com/scholar?cites=1975214025279575923&as_sdt=5,31&sciodt=0,31&hl=en), [Ref 2](https://graphics.stanford.edu/~mdfisher/cloth.html))
2. Bending stiffness, shear ([Ref](http://www.uni-weimar.de/~caw/papers/p28-bridson.pdf))
3. Prevent cloth self-intersections
4. GUI
5. Export to STL
6. Explore different methods of interaction
