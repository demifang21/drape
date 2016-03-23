# Drape
A fabric design and simulation tool, built in [three.js](http://threejs.org/) starting from the [cloth simulation](http://threejs.org/examples/webgl_animation_cloth) example.

## To run online:
You can test the code at the following links:

[Latest version](https://gitcdn.xyz/repo/aatishb/drape/master/index.html) (added shear & bending springs, detects collisions with arbitrary objects + friction)

[Earlier version](https://gitcdn.xyz/repo/aatishb/drape/initial/index.html) (no shear or bending springs, only detects collisions with sphere)

## To run on your own computer:

1. Download code and unzip (or, `git clone https://github.com/aatishb/drape.git`)
2. Easiest way to run: Open one of the .js files with the [p5 editor](http://p5js.org/download/) and press play
3. Alternatively, run the code with a local server (instructions [here](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally) or [here](https://github.com/processing/p5.js/wiki/Local-server)).

## TODO

[Code overview] (https://goo.gl/5M8SwK) – overview of code organization

Stuff to implement:

1. ~~Collision detection~~ (implemented point-face collision. also add edge-edge collision?)
2. ~~Bending & shear springs~~
3. Prevent cloth self-intersections
4. GUI
5. Export to STL
6. Explore different methods of interaction

## References

1. [GPU Ray-Traced Collision Detection for Cloth Simulation](https://hal.inria.fr/hal-01218186/document) (2015)
2. [Ray-traced collision detection for deformable bodies](https://hal.inria.fr/file/index/docid/319404/filename/grapp08.pdf) (2008)
3. [Untangling Cloth](http://graphics.pixar.com/library/UntanglingCloth/paper.pdf) (2003)
4. [Simulation of Clothing with Folds and Wrinkles] (https://graphics.stanford.edu/papers/cloth2003/cloth.pdf) (2003)
5. [Robust Treatment of Collisions, Contact and Friction for Cloth Animation](http://accad.osu.edu/~elaine/intrACCAD/cara/cloth/papers/2002-Bridson.pdf) (2002)
