 
//var getImageOutline = require('image-outline');
//var Image = require('htmlimage');

foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'Bubbles',
  extends: 'foam.graphics.Box',

  requires: [
    'foam.physics.PhysicalCircle',
    'foam.physics.PhysicsEngine',
    'com.uwyang.demos.BubblesCollider',
    'foam.util.Timer',
    'foam.foam.graphics.Polygon',
  ],

  properties: [
    {
      name: 'timer',
      factory: function() {
        var timer = this.Timer.create();
        timer.start();
        return timer;
      }
    },
    [ 'n',          7 ],
    [ 'width',      1100 ],
    [ 'height',     1100 ],
    [ 'background', '#ccf' ],
    { name: 'engine',   factory: function() {
      var e = this.BubblesCollider.create({gravity: true});
      e.start();
      return this.onDetach(e);
    }},

    {
      name: 'points',
      factory: function(){return []; },
      postSet: function(old, nu){
        this.reStart();
      }
    }

  ],



    methods: [

      function init(){

      },

      function erase(){
        console.log('earase');
      },


      function initCView() {
        this.SUPER();
        this.canvas.erase= (()=>{});
        var image = new Image();
        image.onload = () =>  {
          
        }
        image.src = '/src/main/images/butterfly.png';

        /*
        var N = this.n;
        var arr = this.getGridPoints(N, N);
        arr.forEach((c)=> {
          this.addPoint(c); });

        this.timer.i$.sub(this.invalidated.pub);
        console.log("initCViewDone. ");
        */

      },


      function getPhysicalPoint(p, g=0.001){
          return this.PhysicalCircle.create({
            radius: 3,
            x: p.x,
            y: p.y,
            //arcWidth: 6,
            friction: 0.96,
            gravity: g,
            alpha: 0.1,
            //border: this.hsl(x/xN*100, (70+y/yN*30), 60)
          });
      },

      function getGridPoints(xN, yN, g=0.001){
        var arr = [];
        for ( var x = 0 ; x < xN ; x++ ) {
          for ( var y = 0 ; y < yN ; y++ ) {
            var c = this.PhysicalCircle.create({
              radius: 15,
              x: 400+(x-(xN-1)/2)*70,
              y: 200+(y-(yN-1)/2)*70,
              arcWidth: 6,
              friction: 0.96,
              gravity: g,
              border: this.hsl(x/xN*100, (70+y/yN*30), 60)
            });
            arr.push(c);
          }
        }
        return arr;
      },

      function addPoint(c){
        this.engine.add(c);
        this.add(c);

        this.timer.i$.sub(foam.Function.bind(function circleBoundOnWalls(c) {
          if ( c.y > 1/this.scaleY*this.height+50 ) {
            c.y = -50;
          }
          if ( c.x < 0          ) c.vx =  Math.abs(c.vx)+0.1;
          if ( c.x > this.width ) c.vx = -Math.abs(c.vx)-0.1;
        }, this, c));
      }
    ],

    actions: [
      {
        name: 'stop',
        code: function(){
          debugger;
        }
      }
    ]

});
foam.CLASS({
    package: 'com.uwyang.demos',
    name: 'BubblesMain',
    extends: 'foam.u2.Element',

    requires: [

      'foam.u2.Element',
      'com.uwyang.demos.BubblesController',
      'foam.u2.DetailView',
    ],

    properties: [
      {
        name: 'controllerDetailView',
      },
      {
        name: 'controller',
        factory: function(){
          return this.BubblesController.create({imagePath: '/src/main/images/butterfly2.png'});
        }
      },

      {
        name: 'imagePaths',
        factory: function(){
          return [
            '/src/main/images/moth.png',
            '/src/main/images/butterfly2.png',

            //'/src/main/images/cherry1.png',
            '/src/main/images/cherry2.png',
            '/src/main/images/feather1.png',
            '/src/main/images/feather2.png',
            '/src/main/images/stag.png',
            //'/src/main/images/batwings.png',
            '/src/main/images/cat.png',
            '/src/main/images/hummingbird.png',

            '/src/main/images/girl1.png',
          ];
        }
      },

    ],

    methods: [
      function initE(){
        //add title etc here.
      this.start(this.STOP, {data: this}).end();
        this.start('div').cssClass(this.myClass('left')).
          add(this.makeButtonsDiv()).add(this.controller).cssClass(this.myClass('controller')).end();

        this.controllerDetailView = this.DetailView.create({
          data$: this.controller$,
          showActions: true,

          properties: [
            this.controller.LINE_ALPHA,
            this.controller.LINE_COLOR,
            this.controller.STEP_SIZE,
          ]


        });
        /*
        this.controllerDetailView.properties =
        [
          com.uwyang.demos.BubblesController.STEP_SIZE,
          //this.controller.LINE_ALPHA,
        ];*/
        this.start('div').
          cssClass(this.myClass('right')).
          start(this.SAVE, {data: this}).end().
          add(this.controllerDetailView).
          end();


      },

      function makeButtonsDiv(){
        /*
        <img src="https://www.google.co.uk/images/srpr/logo3w.png" alt="beer" />
        <input type="image" src="https://www.google.co.uk/images/srpr/logo3w.png" />*/
        //var buttonsArr = [];
        var d = this.Element.create('div');
        this.imagePaths.forEach((path) =>{
          var e = this.Element.create().setNodeName('input');
          e.cssClass(this.myClass('img-button'));
          e.setAttribute('type', 'image');
          e.setAttribute('src', path);
          e.on('click', () => {
            console.log('input img clicked. ', path);
            this.controller.imagePath = path;
          }
          );
          d.add(e);
          //buttonsArr.push(e);
        });
        return d;
        //return buttonsArr;
      }
    ],

    axioms: [
        foam.u2.CSS.create({
            code: function() {/*
              ^left{
                float:left;
                display: in-line;
              }
              ^controller{
                  overflow: scroll;
                  max-width: 1000px;
              }
                ^right{
                  height:100%;
                  background:blue;
                  float:right;
                }
                ^img-button{
                width: 100px;
              }
              ^buttons{
              display: in-line;

            }
                             */}
        })
    ],

    actions: [
      {
        name: 'debug',
        code: function(){
          debugger;
        }
      },
      {
        name: 'save',
        label: 'Save Image', 
        code: function(){
          if (!this.controller || !this.controller.canvas) return;
          var imageDownloadLink = this.controller.canvas.el().toDataURL("image/png").replace("image/png", "image/octet-stream");
          // here is the most important part because if you dont replace you will get a DOM 18 exception.
          window.location.href=imageDownloadLink; // it will save locally
        }
      }
    ],
});
foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'BubblesController',
  extends: 'foam.graphics.Box',

  requires: [
    //'foam.physics.PhysicalCircle',
    'com.uwyang.demos.Bubble',
    //'foam.physics.PhysicsEngine',
    'com.uwyang.demos.BubblesCollider',
    'com.uwyang.demos.PolygonPropagator',
    'foam.graphics.Polygon',
    'foam.util.Timer'
  ],

  properties: [
    {
      name: 'timer',
      factory: function() {
        var timer = this.Timer.create();
        timer.start();
        return timer;
      }
    },
    {
      name: 'imagePath',
      value:'/src/main/images/moth.png',
      postSet: function(old, nu){
        if (!this.canvas) return;
        if (old.toLowerCase() !== nu.toLowerCase() ){
          this.resetCanvas();
        }
      }

    },
    [ 'width',      1000 ],
    [ 'height',     1000 ],
    [ 'background', '#ccf' ],
    { name: 'engine',   factory: function() {
      //var e = this.BubblesCollider.create({gravity: true});
      var e = this.PolygonPropagator.create({
        gravity: true,
        polygon: this.polygon,
        canvas: this.canvas,
        stepSize: this.stepSize,
        lineRGBA: this.lineRGBA,
      });

      e.start();
      return this.onDetach(e);
    }},

    {
      name: 'points',
      factory: function(){return []; },
      postSet: function(old, nu){
        //this.reStart();
      }
    },

    {
      name: 'bounceOnFloorOnly',
      value: false,
    },
    {
      name: 'polygon',
    },
    {
      name: 'stepSize',
      value: 5,
        viewa: { class: 'foam.u2.FloatView', precision: 1, onKey: true },
        viewb: { class: 'foam.u2.RangeView', step: 1, maxValue: 100, onKey: true }
      },
    {
      name: 'lineAlpha',
      class: 'Float',
      view: {
        class: 'foam.u2.view.DualView',
        viewa: { class: 'foam.u2.FloatView', precision: 3, onKey: true },
        viewb: { class: 'foam.u2.RangeView', step: 0.005, maxValue: 1,minValue: 0,  onKey: true }
      },
      value: 0.01,
      postSet: function(){
        this.updateLineRGBA();
      }
    },
    {
      name: 'lineColor',
      class: 'Color',
      postSet: function(old, nu){
        if (!nu) return;
        this.updateLineRGBA();
      }
    },
    {
      name: 'lineRGBA',

    },
    {
      name: 'stopped',
    },
    {
      name: 'image',
    },
    {
      name: 'xPadding',
      value: 50,
    },
    {
      name: 'yPadding',
      value: 50,
    }


  ],



    methods: [

      function erase(){
        console.log('earase');
      },

      function updateLineRGBA(){
        var c = this.hexToRgb(this.lineColor);
        //want: color: 'rgba(0,0,0,0.02)',
        var str = "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + this.lineAlpha + ")";
        console.log("new color", str);
        this.lineRGBA = str;
      },



      function initCView() {
        this.SUPER();
        //this.stopped$ = this.engine.stopped_$;
        this.canvas.style.position = "absolute";
        this.canvas.erase= (()=>{});
        this.loadImage();

      },

      function loadImage(image){
        var image = new Image();
        image.src = this.imagePath;
        image.onload = () =>  {
          //this.createBubbleCollider(image);
          this.width = image.width + (2*this.xPadding);
          this.height = image.height + (2*this.yPadding);
          this.image = image;
          this.initializeEngine(image);
        }
      },

      function resetCanvas(){
          this.canvas.el().width = this.canvas.el().width;
          this.loadImage();
          this.engine.tick();
          this.engine.stopped_ = true;


      },

      function createBubbleCollider(image){
        var polygon = getImageOutline(image);
        // polygon is now an array of {x,y} objects. Have fun!
        var c = 0;
        polygon.forEach((p)=> {
          //if (c<=100)
           this.addPoint(this.getPhysicalPoint(p, 0.1));
           this.addPoint(this.getPhysicalPoint(p, -0.1));
         //c++;
        });

        this.timer.i$.sub(this.invalidated.pub);

        console.log("points: ", polygon.length, " added. ");
      },

      function initializeEngine(image){
        this.clearProperty('polygon');
        this.clearProperty('engine');

        var polygon = getImageOutline(image);
        // polygon is now an array of {x,y} objects. Have fun!
        var c = 0;
        var xArr =[];
        var yArr = [];

        polygon.push({x: polygon[0].x, y: polygon[0].y});
        var xoffset = this.xPadding;
        var yoffset = this.yPadding;

        polygon.forEach((p)=> {
          var bubblePoint = this.Bubble.create({
            radius: 1,
            x: p.x + xoffset,
            y: p.y + yoffset,
            //arcWidth: 6,
            //friction: 0.96,
            //gravity: 0,
            alpha: 0.1,
            vx: 0,
            vy: 0,
            invisible: true,
            //border: this.hsl(x/xN*100, (70+y/yN*30), 60)
          }
        );
          this.addPoint(bubblePoint);
          xArr.push(p.x);
          yArr.push(p.y);
           //this.addPoint(this.getPhysicalPoint(p, 0.1));
           //this.addPoint(this.getPhysicalPoint(p, -0.1));
         //c++;
        });
        this.polygon = this.Polygon.create({
          xCoordinates: xArr,
          yCoordinates: yArr,
          stepSize: this.stepSize,
        });
        this.engine.add(this.polygon);
        //this.timer.i$.sub(this.invalidated.pub);

        console.log("points: ", polygon.length, " added. ");
      },


      function getPhysicalPoint(p, g=0.001){
          return this.Bubble.create({
            radius: 3,
            x: p.x,
            y: p.y,
            //arcWidth: 6,
            friction: 0.96,
            gravity: g,
            alpha: 0.1,
            vx: 0,
            vy: 0,
            //border: this.hsl(x/xN*100, (70+y/yN*30), 60)
          });
      },

      function getGridPoints(xN, yN, g=0.001){
        var arr = [];
        for ( var x = 0 ; x < xN ; x++ ) {
          for ( var y = 0 ; y < yN ; y++ ) {
            var c = this.Bubble.create({
              radius: 15,
              x: 400+(x-(xN-1)/2)*70,
              y: 200+(y-(yN-1)/2)*70,
              arcWidth: 6,
              friction: 0.96,
              gravity: g,
              border: this.hsl(x/xN*100, (70+y/yN*30), 60)
            });
            arr.push(c);
          }
        }
        return arr;
      },

      function addPoint(c){
        this.engine.add(c);
        this.add(c);
        /*
        this.timer.i$.sub(foam.Function.bind(function circleBoundOnWalls(c) {
          if ( c.y > 1/this.scaleY*this.height+50 ) {
            c.y = -50;
          }
          if ( c.x < 0          ) c.vx =  Math.abs(c.vx)+0.1;
          if ( c.x > this.width ) c.vx = -Math.abs(c.vx)-0.1;
        }, this, c));
        */
      },

      function setSettings(){
        this.engine.stepSize = this.stepSize;
        this.engine.lineRGBA = this.lineRGBA;
      },



      function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    ],

    actions: [
      {
        name: 'debug',
        code: function(){
          debugger;
        }
      },

      {
        name: 'start',
        code: function() {
          this.engine.stopped_ = false;
          this.engine.tick();
        }
      },
      {
        name: 'stop',
        code: function() {
          this.engine.stopped_ = true;
        }
      },
      {
        name: 'reset',
        code: function() {
          this.resetCanvas();
        }
      },
      {
        name: 'set',
        /*
        isEnabled: function(stopped){
          return stopped;
        },*/
        label: 'SET',
        code: function(){
          this.setSettings();
        }
      },
      /*
      {
        name: 'save',
        code: function(){
          if (!this.controller || !this.controller.canvas) return;
          var image = this.controller.canvas.el().toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
          window.location.href=image; // it will save locally
        }
      }
      */

    ]

});
foam.CLASS({
    package: 'com.uwyang.demos',
    name: 'BubblesSettingsController',
    extends: 'foam.u2.Element',

    requires: [

      'foam.u2.Element',
      'com.uwyang.demos.BubblesController',
      'foam.u2.DetailView',
    ],

    properties: [
      {
        name: 'controllerDetailView',
      },

    ],

    methods: [
      function initE(){
        //add title etc here.
      this.start(this.STOP, {data: this}).end();

        this.controllerDetailView = this.DetailView.create({
          data$: this.controller$,
          showActions: true,

          properties: [
            this.controller.LINE_ALPHA,
            this.controller.LINE_COLOR,
            this.controller.STEP_SIZE,
          ]

        });
        this.start('div').
          cssClass(this.myClass('')).
          add(this.controllerDetailView).
          end();


      },

    ],

    axioms: [
        foam.u2.CSS.create({
            code: function() {/*
              ^left{
                float:left;
                display: in-line;
              }
                ^right{
                  height:100%;
                  background:blue;
                  float:right;
                }
                ^img-button{
                width: 100px;
              }
              ^buttons{
              display: in-line;

            }
                             */}
        })
    ],

    actions: [
      {
        name: 'debug',
        code: function(){
          debugger;
        }
      },
    ],
});
foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'BubblesCollider',
  extends: 'foam.physics.PhysicsEngine',

  documentation: 'extension of PhysicsEngine, ',

  properties: [
    {
      class: 'Boolean',
      name: 'gravity',
      value: false
    },
    {
      class: 'Float',
      name: 'gravityStrength',
      value: 1
    },
    {
      name: 'hasInteraction',
      value: false,
    }
  ],

  methods: [
    
    function updateChild(c) {
      this.SUPER(c);

      var gravity  = c.gravity;
      var friction = c.friction;

      if ( gravity && this.gravity ) {
        c.vy += gravity * this.gravityStrength;
      }

      if ( friction ) {
        c.vx = Math.abs(c.vx) < 0.001 ? 0 : c.vx * friction;
        c.vy = Math.abs(c.vy) < 0.001 ? 0 : c.vy * friction;
      }

      // Inertia
      if ( Math.abs(c.vx) > 0.001 ) c.x += c.vx;
      if ( Math.abs(c.vy) > 0.001 ) c.y += c.vy;
    }
  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function tick() {
        if ( this.stopped_ ) return;
        this.onTick.pub();
        if (this.hasInteraction) this.detectCollisions();
        this.updateChildren();

        this.tick();
      }
    }
  ]


});
//extends from foam.physics.PhysicalCircle,
//extends from foam.graphics.Circle,
//extends from foam.graphics.Arc.

//arcWidth: borderWidth,
//color: string of '#00000',
//border

//there's also polygon.
/*
foam.CLASS({
  package: 'foam.graphics',
  name: 'Polygon',
  extends: 'foam.graphics.CView',

  documentation: 'A CView for drawing a polygon.',

  properties: [
    { class: 'Array', of: 'Float', name: 'xCoordinates' },
    { class: 'Array', of: 'Float', name: 'yCoordinates' },
    { class: 'String', name: 'color', value: '#000' },
    { class: 'Float', name: 'lineWidth', value: 1 }
  ],
*/

//from CView: removeAllChildren

// you can use remove in PhysicsEngine to remove the chilren, without removing from CView.
//you can also set bounceOnWalls of the engine to true.


foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'Bubble',
  extends: 'foam.physics.PhysicalCircle',

  documentation: 'CView for a physical circle.',

  properties: [
    {
      name:'invisible',
      value: false,
    }

  ],

  methods: [

    function paintSelf(x) {
      if (this.invisible){
        return;
      }else {
        this.SUPER(x);
      }
    },



  ]
});
foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'PolygonPropagator',
  extends: 'foam.physics.PhysicsEngine',

  documentation: 'Apply when shapes are shifting',

  topics: [ 'onTick' ],

  requires: [

    'foam.graphics.Polygon',
  ],

  properties: [
    {
      class: 'Boolean',
      name: 'stopped_',
      value: true,
      hidden: true
    },
    {
      name: 'polygon',
    },
    {
      name: 'canvas',
    },
    {
      name: 'stepSize',
      value: 5,
    },
    {
      name: 'lineRGBA',
      value: 'rgba(0,0,0,0.01)',
      postSet: function(old, nu){
        if (!nu || !this.polygon ) return;
        this.polygon.color = nu;
      }
    }

  ],

  methods: [

    function updateChildren() {
      var cs = this.children;
      if (!cs || !cs.length) return;

      var xArr =[], yArr =[];
      cs.forEach((c) => {
        if (!c || !(c.cls_.name == "Bubble")) return;
        this.updateChild(c);
          xArr.push(c.x);
          yArr.push(c.y);

      });
      //this.remove(this.polygon);
      this.polygon = this.Polygon.create({
        xCoordinates: xArr,
        yCoordinates: yArr,
        color: this.lineRGBA,
      });
      this.polygon.paintSelf(this.canvas.context);
      //this.add(this.polygon);
    },

    function updateChild(c) {
        c.x += Math.random()*this.stepSize - this.stepSize/2;
        c.x = Math.min(Math.max(0, c.x), this.canvas.el().width);
        c.y += Math.random()*this.stepSize - this.stepSize/2;
        c.y = Math.min(Math.max(0, c.y), this.canvas.el().height)
    },

  ],

  actions: [

  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function tick() {
        if ( this.stopped_ ) return;
        this.onTick.pub();
        //this.detectCollisions();
        this.updateChildren();
        this.tick();
      }
    }
  ]
});
