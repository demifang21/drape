# Drape
A fabric design and simulation tool, built in [three.js](http://threejs.org/) starting from the [cloth simulation](http://threejs.org/examples/webgl_animation_cloth) example.

## To run online:

[Test it out.](https://cdn.rawgit.com/aatishb/drape/master/index.html)

## To run on your own computer:

1. Download code and unzip
2. Opening index.html runs *Drape* without textures. For textures to work, run with a local server (instructions [here](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally) or [here](https://github.com/processing/p5.js/wiki/Local-server)). Alternatively, use the [p5 editor](http://p5js.org/download/) to run `drape.js`.

## TODO

1. Modify cloth shape and behavior
2. Add table (for cloth to fall on)
3. Add additional forces to edges (to test folding/wrinkling)
4. Add shear & bending stiffness (try different models for bending stiffness)
5. Test wrinkling and folding abilities
6. Improve collision detection & avoiding self intersections of cloth
7. Develop a minimal, easy-to-use GUI
8. Add export to STL
9. Future directions: consider different possibilities for human computer interaction
