# SunBurst FOAM Class Viewer
-- a nice way to visualize howmany classes there are, their inheritance, etc. 

## Introduction: 

This is only possible by the virtues of foam. 
foam.debug.showCreates() (OR: foam.used) shows a list of classes that has being generated so far. 
(object of interest).model_.extends (and other attributes) shows inheritance and other important information. 

![original](https://github.com/uwyang/SunburstFOAMClassViewer/blob/master/examples/burst1.png "original")

The data is gotten from the FOAM sweeper demo, understandably, most of the elements (visual elements) are sweeper cells. 
![zoomin](https://github.com/uwyang/SunburstFOAMClassViewer/blob/master/examples/burst2.png "zoomin")
![sweeper](https://github.com/uwyang/SunburstFOAMClassViewer/blob/master/examples/sweeper.png "sweeper")

## UI (TODO)

0) in radial view, allow the option of ignoring count. 
(same size slices regardless of class object count)
1) switch between partition view and radial tidy tree
2) in radio tidy tree, use color to indicate usage. 
3) let user decide color -> class number. 
4) mouseover shows class number

## Technologies used: 

FOAM and d3.js. 
examples: 
http://bl.ocks.org/metmajer/5480307
https://bl.ocks.org/mbostock/4063550

- [FOAM2 Javascript Framework](https://github.com/foam-framework/foam2 "FOAM2 Github page")
- [npm package image-outline](https://www.npmjs.com/package/image-outline "npm image-outline page")
- JavaScript ES6
- HTML5 Canvas Element


