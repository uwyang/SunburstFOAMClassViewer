var getImageOutline = require('image-outline');
var Image = require('htmlimage');

// Get your hands on a loaded HTMLImageElement, preferably one showing a PNG,
// with a transparent background, maybe of a cow.


/*
getImageOutline('./BirdTree.png', function(err, polygon) {
   if (err) {
      // err is an Error; handle it
      console.log(err);
      return;
   }
   console.log("size: ", polygon.length);
   // polygon is now an array of {x,y} objects. Have fun!
});
*/


var image = new Image();
console.log("hi, guys");
//image.href = 'http://www.cow.pics/cow.png';
//image.href='./src/main/images/BirdTree.png';
getImageOutline('./src/main/images/BirdTree.png', function(err, polygon) {
   if (err) {
      // err is an Error; handle it
      console.log(err);
      return;
   }
   console.log("size: ", polygon.length);
   // polygon is now an array of {x,y} objects. Have fun!
});
