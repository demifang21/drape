# Drape
A fabric design and simulation tool, built in [three.js](http://threejs.org/) starting from the [cloth simulation](http://threejs.org/examples/webgl_animation_cloth) example.

## To run online:
You can test the code at the following links:

[Latest stable version](https://gitcdn.xyz/repo/aatishb/drape/master/index.html)

[collisiondetection branch](https://cdn.gitcdn.link/cdn/aatishb/drape/052afa78504072d830987127d1953beb31c46ed3/index.html): A branch implementing collision detection. In progress.

## To run on your own computer:

1. Download code and unzip (or, if you're familiar with git, `git clone https://github.com/aatishb/drape.git`) 
2. You need to run the code on a local server (Refs: [1](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally), [2](https://github.com/processing/p5.js/wiki/Local-server)). The easiest way to do this is open one of the .js files with the [p5 editor](http://p5js.org/download/) and press play.

## TODO

[Code overview] (https://goo.gl/5M8SwK) – overview of code organization

Stuff to implement:

1. Collision detection ([Ref 1](https://scholar.google.com/scholar?cites=1975214025279575923&as_sdt=5,31&sciodt=0,31&hl=en), [Ref 2](https://graphics.stanford.edu/~mdfisher/cloth.html))
2. Bending stiffness, shear ([Ref](http://www.uni-weimar.de/~caw/papers/p28-bridson.pdf))
3. Prevent cloth self-intersections
4. GUI
5. Export to STL
6. Explore different methods of interaction
