 /**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

foam.CLASS({
  package: 'com.google.foam.demos.sevenguis',
  name: 'FlightBooker',
  extends: 'foam.u2.Element',

  requires: [
    'foam.u2.DateView',
    'foam.u2.tag.Select'
  ],

  exports: [ 'as data' ],

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
      ^ { padding: 10px; }
      ^ .error { border: 2px solid red; }
      ^title { font-size: 18px; }
      ^title, ^ button, ^ input, ^ select {
        width: 160px; height: 24px; margin: 5px;
      */}
    })
  ],

  properties: [
    {
      class: 'Boolean',
      name: 'oneWay',
      value: true,
      view: {
        class: 'foam.u2.view.ChoiceView',
        choices: [
          [ true,  'one-way flight' ],
          [ false, 'return flight'  ]
        ]
      }
    },
    {
      class: 'Date',
      name: 'departDate',
      factory: function() { return new Date(Date.now()+3600000*24); },
      validateObj: function(departDate) {
        var today = new Date();
        today.setHours(0,0,0,0);
        if ( foam.Date.compare(departDate, today) < 0 ) return 'Must not be in the past.';
      }
    },
    {
      class: 'Date',
      name: 'returnDate',
      factory: function() { return new Date(Date.now()+2*3600000*24); },
      validateObj: function(oneWay, returnDate, departDate) {
        if ( ! oneWay && foam.Date.compare(returnDate, departDate) < 0 ) return 'Must not be before depart date.';
      }
    },
    {
      name: 'returnDateMode',
      expression: function(oneWay) { return oneWay ? 'disabled' : 'rw'; }
    }
  ],

  methods: [
    function initE() {
      this.SUPER();
      this.nodeName = 'div';
      this.
          start('div').cssClass('^title').add('Book Flight').end().
          add(this.ONE_WAY).tag('br').
          add(this.DEPART_DATE).tag('br').
          start(this.RETURN_DATE).attrs({mode: this.returnDateMode$}).end().tag('br').
          add(this.BOOK).
          start(this.STOP, {data: this}).end();
    }
  ],

  actions: [
    {
      name: 'book',
      isEnabled: function(errors_) { return ! errors_; },
      code: function() {
        var depart = this.departDate.toLocaleDateString();

        window.alert('You have booked a ' + (this.oneWay ?
          'one-way flight on ' + depart :
          'flight departing on ' + depart + ' and returning ' + this.returnDate.toLocaleDateString() ) + '.');
      }
    },
    {
        name: 'stop',
        code: function(){
            var d = 0; 
            this.departDate.setDate((new Date()).getDate() - 10);
            console.log(this.departDate);
            console.log(this.errors_);
            debugger; 
        }
    }
  ]
});
foam.CLASS({
    name: 'DCWorldMain',
    extends: 'foam.u2.Element',

    implements: [ 'LoadDCWorld' ],

    requires: [ 'DCWorldController' ],

    properties: [
        {
            name: 'controller',
            factory: function(){
                return this.DCWorldController.create();
            }
        }
    ],

    methods: [

        function initE(){
            this.add(this.controller);
        },

        function init() {
            this.controller.write();
        }
    ]
});


foam.CLASS({
  name: 'DCWorldController',
  extends: 'foam.u2.Element',

  
  requires:
  [
    'Team',
    'Hero', 
    'foam.u2.TableView',
    'foam.u2.grid.GridView',
    'foam.dao.ReferenceDAO'
    ],
  
  imports: [
    'TeamDAO',
    'HeroDAO'
  ], 

  properties: [
    'gridView'
  ],

  methods: [
    
    function initE(){
       this.
       start(this.STOP, {data: this}).end();
       this.start(this.TOGGLE_ROWS, {data:this}).end(); 
       this.start('h3').add('Using PropertiesDAO: ').end('h3');
       this.add(this.gridView);
       //this.start('h3').add('Using PropertiesArray: ').end('h3');
       //this.add(this.arrGridView$);
       }, 
    
    function init() {
        this.gridView = this.GridView.create({
                        of: this.Hero,
                        data$: this.HeroDAO$, 
                        rowProperty: this.Hero.ORGANIZATION_ID, //eq(rowProperty, rowProperties[i])
                        cellView: 'HeroCellView',
                        cellWrapperClass: 'NewHeroWrapperView',  
                        colProperty: this.Hero.STATUS, 
                        rowPropertiesDAO: this.TeamDAO, // or pass in rowDAO //make it dao based.
                        colPropertiesArray: ['alive', 'dead', 'MIA', undefined], //or pass in colDAO
                        rowDAOMatchUndefined: true,
                        wrapperDAOClass: 'foam.dao.ReferenceDAO', 
                });
        }
    ],
      
      actions:
    [

        {
            name: 'stop',
            code: function(){
                debugger;
                
                /*
                this.TeamDAO.select().then(function(c){
                    console.log('--------------- Team List --------');
                    for (var i=0; i<c.a.length; i++){
                        var d = c.a[i];
                        console.log(d.id + ', ' + d.name);
                    } });
                

                this.daoGridView.data.select().then(function(c){
                    console.log('--------------- Hero List --------');
                    for (var i=0; i<c.a.length; i++){
                        var d = c.a[i];
                        var orgStr = d.organizationId ;
                        if (d.organization && d.organization.name) orgStr = d.organization.name; 
                        console.log(d.name + ', ' + orgStr);
                    } });
                    */
            }
        },
        
          {
            name: 'toggleRows',
            code: function(){
                if (! this.gridView.visibleRowIds || this.gridView.visibleRowIds.length <=0 ){
                    this.gridView.visibleRowIds = ['B', 'EI', '']; 
                }else {
                    this.gridView.visibleRowIds = []; 
                }
            }
        }
        
    ], 
  
  
});


function loadfct (){
    var c = DCWorldMain.create(); 
    //document.getElementById('FOAMContainer').innerHTML = c.controller.outerHTML;
}; foam.CLASS({
    refines: 'foam.core.Property',
    properties: [
        {
            class: 'String', 
            name: 'referenceDAOKey',
            documentation: 'get the property object from property Id through DAO' 
        },
        {
            class: 'String', 
            name: 'referenceProperty',
            documentation: 'the property object gotten from DAO specifed by referenceDAOKey'
        }, 
        {
            class: 'Function',
            name: 'tableFormatter',
            factory: function() { return function(value, obj, t){return value; }; }
        },
        {
            class: 'Function',
            name: 'gridHeaderView',
            factory: function() { return function(value, obj, t){return value; }; }
        },
        {
            name: 'sortable',
            class: 'Boolean',
            value: true
        },
        {
            name: 'groupByProperty',
            class: 'String',
            value: 'id'
        },
        {
            name: 'groupByLabel',
            class: 'String',
            value: 'label'
        },
        /*{
            name: 'salesforceType',
            class: 'String'
        },*/
    ],

});



// Relationship Test
foam.CLASS({
  name: 'Team',
  requires: ['Hero'], 
  properties: [ 'name', 'id' ]
});

foam.CLASS({
  name: 'Hero',
  
  requires: [
    'Team',
    'foam.u2.Element'
    ],
  
  imports: [
    'TeamDAO', 
  ], 
  
  properties: [
    'id',
    {
        name: 'errorMessage', 
        transient: true, 
        expression: function(errors_, name, id){
            if (! errors_ || !errors_.length ) return ""; 
            var m = this.Element.create();
            m.start("h3").add("Hero #" + (name || id)).end("h3");
            for (var i=0; i<errors_.length; i++){
                var e = errors_[i]; 
                m.start("p").add((e[0].label || e[0].name) + " : " + e[1]).end();
            }
            return m; 
        }
    }, 
    
    {
        name: 'name',
        gridHeaderView: function(value, obj, t){
            return value; 
        },
    },
    {
        class: 'Date', 
        name: 'birthDate'
    },
    {
        class: 'Date', 
        name: 'lastSeenAlive',
        searchView: 'foam.u2.search.WeekSearchView',
        //searchView: 'foam.u2.DateView',  
        factory: function(){
            return foam.DateTime.startOfToday();
        },
        validateObj: function(lastSeenAlive, birthDate){
                if (  lastSeenAlive && birthDate && (lastSeenAlive < birthDate) )
                return 'lastSeenAlive' + lastSeenAlive + ' Must be after birth date ' + birthDate + ', unless you are a time traveller';
        }, 
        gridHeaderView: function(value, obj, t){
            var d = new Date(value);
            var p1 = foam.u2.Element.create('p');
            p1.add(foam.DateTime.getDayName(d));
            var p2 = foam.u2.Element.create('p');
            p2.add(d.getDate() + "" + foam.DateTime.getDayCardinal(d) + " " + foam.DateTime.getShortMonthName(d));
            return foam.u2.Element.create('div').add(p1).add(p2); 
        }
    },
    
    {
        name: 'status',
        searchView: 'foam.u2.search.GroupBySearchView',
        gridHeaderView: function(value, obj, t){
            return value; 
        }
    },
    {
        class: 'String', 
        name: 'organizationId',
        documentation: 'organizationId should always be the one set, instead of organization object.',
        transient: true, 
        referenceDAOKey: 'TeamDAO',
        referenceProperty: 'organization',
        searchView: {
            class: 'com.serviceecho.ui.search.GroupByReferenceSearchView',
            of: 'Team', 
            showAllChoices: true,
        },
        gridHeaderView: function(value, obj, t){
            if (! value) return '--'; 
            return value.name || value.id || value; 
        },
        compare: function(o1, o2){
            var id1, id2; 
            if (typeof(o1) === "string" )id1 = o1;
            else if (o1.id) id1 = o1.id;
            else id1 = o1; 
            if (typeof(o2) === "string" )id2 = o2;
            else if (o2.id) id1 = o2.id;
            else id2 = o2;
            
            return foam.util.compare(id1, id2); 
        },
    },
    
    {
        name: 'organization',
        //class: 'Team', 
        groupById: "id", 
        groupByLabel: "name",
        transient: true,
        searchView: {
            class: 'com.serviceecho.ui.search.GroupByIdSearchView',
            of: 'Team', 
            showAllChoices: true,
        },
        tableCellView: function(obj, e) {
          return obj && obj.organization && obj.organization.name; 
        },
        tableFormatter: function(value, data, t){
          return value; 
        },
        gridHeaderView: function(value, obj, t){
            return value?value.name:"N/A"; 
        }
    }
    ],
  
  methods: [
  ],
  
  listeners: [
    {
        name: "orgUpdate",
        code: function(){
            console.log("organiztion Updated. ");
        }
    },
    
    {
        name: "nameUpdate",
        code: function(){
            console.log("name Updated. ");
        }
    }

  ]
  
});




foam.RELATIONSHIP({
  sourceModel: 'Team',
  targetModel: 'Hero',
  forwardName: 'members',
  inverseName: 'organizationId'
});

foam.CLASS({
  name: 'HeroCellView',
  extends: 'foam.u2.Element', 
  
  requires: [
        'Team',
        'Hero',
        'foam.u2.Element'
        ],
  
  imports: [
  ], 
  
  properties: [
    "of",
    {
        name: 'data',
        postSet: function(old ,nu){
            nu && nu.sub && nu.sub(this.onDataUpdate);
        }
    },
    {
        name: 'cellView',
        factory: function(){
            return this.Element.create(null, this);
        }
    }
    
    ],
  
  methods: [
    function initE(){
        this.add(this.cellView$);
        this.attrs({ draggable: 'true' });
        this.on('dragstart', this.onDragStart); 
    },
    
    function init(){
        this.onDataUpdate();
    },
    
    function makeCellView(){
        var div = foam.u2.Element.create("div");
        if (this.data){
            div.add(foam.u2.Element.create("p").add(this.data.name));
            div.start("small").add(this.data.lastSeenAlive && this.data.lastSeenAlive.toLocaleDateString()).end("small"); 
        }
        //return div;
        this.cellView = div; 
    }
  ],
  
    
    listeners: [
        {
            name: "onDataUpdate",
            code: function(){
              this.makeCellView();
            }
        },
        {
          name: 'onDragStart',
          code: function(e) {
          e.dataTransfer.setData('application/x-foam-obj-id', this.data.id);
          e.stopPropagation();
          }
        }
      ]
  
});
  
  
foam.CLASS({
  name: 'NewHeroWrapperView',
  extends: 'foam.u2.Element', 
  
  requires: [
    'Team',
    'Hero'
    ],
  
  imports: [
    'HeroDAO',
    'TeamDAO'
  ], 
  
  properties: [
    "of",
    {
        name: 'wrapperView',
        factory: function(){
            return foam.u2.Element.create();
        }
    },
    "status",
    "organization",
    "cell"
  ],
  
  methods: [
    function initE(){
        //this.cssClass(this.myCls()).
        this.
          style({
            'border': '2px solid red', 
            'height':'100%',
            'width':'100%',
            'display':'inline-block',
            }).
          start('div', null, this.content$).
            cssClass(this.myCls('content')).
          end().
          add(this.wrapperView$);
          
        this.on('dragenter', this.onDragOver).
          on('dragover', this.onDragOver).
          on('drop', this.onDrop); 
    },
    
    function makeWrapper(){
        var div = foam.u2.Element.create("div");
        
        div.start(this.NEW, {data: this}).end() ;
          
        this.wrapperView = div; 
    }, 
    
    function init(){
      //this.organizationId$ = this.cell.rowMatchId$;
      this.organization$ = this.cell.rowMatch$;
      this.status$ = this.cell.colMatch$; 
        this.onDAOUpdate();
    }
  ],
  
    listeners: [
        {
            name: "onDAOUpdate",
            code: function(){
              this.makeWrapper();
            }
        },
         {
            name: 'onDragOver',
            code: function(e){
                console.log("something is dragged over the cell. ");
                  e.preventDefault();
                  e.stopPropagation();
                
            }
        },
        
        {
            name: 'onDrop',
            code: function(e){
                console.log('something is dumped here. ');
                
                      if ( ! e.dataTransfer.types.some(function(m) { return m === 'application/x-foam-obj-id'; }) )
                    return;
            
                  var id = e.dataTransfer.getData('application/x-foam-obj-id');
                  if (!id ) return;
                  //if ( foam.util.equals(id, this.id) ) return;
            
                  e.preventDefault();
                  e.stopPropagation();
            
                  var self = this;
                  this.HeroDAO.find(id).then(function(hero){
                      if (! hero){
                        console.log("no valid hero found");
                        return; 
                      }
                      
                      
                      hero.status = self.status;
                      
                      hero.organizationId = self.organization?self.organization.id:null; 
                      
                        self.HeroDAO.put(hero); 
                      }).then(function(){
                        self.HeroDAO.find(id).then(function(h){
                           console.log(h.name + ", " + h.organizationId);  
                        });
                  }); 
            }
        }
    ],
    
    actions: [
      {
        name: 'new',
        label: '+',
        code: function(){
          this.HeroDAO.select().then(function(result){
            if (result && result.a ) {
              console.log("HeroDAO present.");
              console.log(result.a.length + " Hero found.");
              console.log("Code here to add Hero of  " + this.team.name + ", " + this.status); 
            }else {
              console.log("Error while getting HeroDAO"); 
            }
          }.bind(this)); 
        }
      }  
    ]
});
/**
   NOTE: this file must be loaded after the config
 */
foam.CLASS ((function() {
    var c = {
  name: 'LoadDCWorld',
  exports: [],
  
    requires: [
      "foam.dao.EasyDAO",
      "foam.dao.PromisedDAO"
      ],
    
  implements: [
            'foam.box.Context'
    ],
  
  properties: [
    ],
  
  }; 
    var teams, heroes;
    
     var teamTestData = [
          {name: 'Team Spider', id: 'TS'},
          {name: 'Bats', id:'B'},
          {name: 'Minutemen', id: 'MM'},
          {name: 'Echo Island', id: 'EI'}
        ]; 

    var d = new Date();
    var heroTestData = [
            {
                name: 'May Jane Watson',
                id:'MJW',  organizationId: 'TS', status: 'alive',
                birthDate: new Date(1990, 10, 02),
                lastSeenAlive: (new Date()).setDate( d.getDate() + 6), },
            {name: 'Gwen Stacy', id:'GS',  organizationId: 'TS', status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 10)},
            {name: 'Peter Parker', id: 'PP', organizationId: 'TS', status: 'alive'},
            {name: 'Venom', id: 'V', organizationId: 'TS', status: 'alive'},
            {name: 'Bat Man',  id:'BM',  organizationId: 'B', status: 'alive'},
            {name: 'Alfred', id:'A', organizationId: 'B', status: 'alive'},
            {name: 'Red Hood', id:'RH', organizationId: 'B', status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 5)},
            //currently, undefined can not be matched.
            {name: 'Joker', id:'JK', organizationId: 'B', lastSeenAlive: undefined},
            {name: "Dr. Thomas Wayne", id: "DrWayne", status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 7)},
            {name: "Martha Wayne", id: "MamaWayne", status: 'dead',
            lastSeenAlive: (new Date()).setDate( d.getDate() - 7)},
            {name: "Dr. Manhattan", id: "DrM", organizationId: "MM", status: "MIA",
            lastSeenAlive: (new Date()).setDate( d.getDate() +2)},
            {name: "Roshak", id: "R", organizationId: "MM", status: "dead",
            lastSeenAlive: (new Date()).setDate( d.getDate() - 1)},
            {name: "The Comedian", id: "TC", organizationId: "MM", status: "dead"},
            {name: "Elvis Parsley", id: "EP",
            lastSeenAlive: (new Date()).setDate( d.getDate() + 3)}, 
            {name: "Harry Potter", id:"HP", status: "alive", lastSeenAlive: null},
            {name: "Snape", id: "S", status: "dead", lastSeenAlive: null}
            
        ];
    
    var daos = {};
    
    var factoryFct = function(of, daoName, dao, testData){
        return function(){
            dao =  foam.dao.EasyDAO.create({
                of: of,
                daoType: 'MDAO',
                cache: true,
                dedup: true,
                logging: true,
                contextualize: true,
                //testData: testData, 
                }, this);
            
            var promise = dao.removeAll().then( function(){
                return Promise.all( testData.map(function(entry) {
                            var d = of.create(entry, this); 
                            return dao.put(d);
                        }.bind(this)));

                }.bind(this));
            

            console.log("PromisedDAO.create promise PENDING on info: ", of.name);
            var promisedDAO = this.PromisedDAO.create({
                of: of,
                promise: promise.then(
                    function() {
                        console.log("PromisedDAO.create promise RESOLVED on info: ", of.name);
                        return dao;
                    }.bind(this),
                    function(errorEvt) {
                        console.error("PromisedDAO.create promise REJECT on info: ", of.name, 'error:', errorEvt);
                    }.bind(this))
            });
            
            daos[daoName] = promisedDAO;
            return promisedDAO;
        }; 
    };
    
     //teamFactory = factoryFct(Team, "TeamDAO", teams, teamTestData);
    var teamFactory = factoryFct.apply(this, [Team, "TeamDAO", teams, teamTestData]);
    c.exports.push('TeamDAO');
    c.properties.push({name: 'TeamDAO', factory: teamFactory});
    
    var heroFactory = factoryFct.apply(this, [Hero, "HeroDAO", heroes, heroTestData]);
    c.exports.push('HeroDAO');
    c.properties.push({name: 'HeroDAO', factory: heroFactory});

    return c;
})());
