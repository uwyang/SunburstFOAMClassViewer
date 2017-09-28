foam.CLASS({
  package: 'com.uwyang.demos',
  name: 'GetClassInfo',
  extends: 'foam.u2.Element',

  requires: [
    'foam.u2.Element',
  ],

  properties: [
    {
      name: 'data',
    },
    {
      name: 'inheritanceView',
    },
    {
      name: 'classUsageView',
      factory: function(){
        return this.Element.create();
      }
    },
    {
      name: 'classCountArr',
      factory: function(){
        return [];
      }
    },
    {
      name: 'classInfoArray',
      factory: function(){
        return [];
      }
    },
    {
      name: 'classInfoTree',
      factory: function(){
        return [];
      }
    }
  ],

  methods: [
    function initE(){

      this.start(this.DEBUG, {data: this}).end().tag('br');

      this.start(this.GET_INFO_TREE, {data: this}).end();
      this.start(this.SHOW_COUNT, {data: this}).end();
      this.add(this.classUsageView$);
    },

    function getClassCount(){
      var objArr = [];

      var e = this.Element.create();
      for ( var key in foam.USED ) {
        var c = foam.USED[key];
        if ( c.count_ ) {
          var obj = {};
          obj[c.id] = c.count_;
          e.start('div').add(c.id + "  " + c.count_).end();
          objArr.push(obj);
        }
      }
      this.classUsageView = e;
      this.countObjArr = objArr;
      //return objArr.filter((obj)=> {return (Object.keys(obj)[0] === "foam.u2.ActionView" || Object.keys(obj)[0] === "foam.u2.Element" );})
      return objArr;
    },

    //do this recursively.
    function constructTree(){
      this.classInfoArray = [
        {id: 'FObject', name:'FObject', package: '', parent:'FOAM'},
        {id: 'Property', name:'Property', package: '', parent: 'FOAM'},
        {id: 'Model', name:'Property', package: '', parent: 'FOAM'},
        {id: 'Method', name:'Method', package: '', parent: 'FOAM'},
        //{id: 'String', name:'String', package: ''},
      ];
      var countObjArr = this.getClassCount();
      var listObjArr = [];
      countObjArr.forEach((obj) => {
        this.getAllInfo(eval(Object.keys(obj)[0]), obj[Object.keys(obj)[0]]);
      });
      this.classInfoTree = listToTree(this.classInfoArray, {parentKey: 'parentId', idKey: 'id'});
      console.log(JSON.stringify(this.classInfoTree));
    },

    function getAllInfo(obj, count){
      var infoObj = {};
      infoObj.id = obj.id;
      infoObj.name = obj.model_.name;
      infoObj.package = obj.model_.package;
      infoObj.count = count?count:0;


      var extendedClassName = obj.model_.extends;
      inClassInfoArray = inClassList = (modelId)=> {
        return this.classInfoArray.filter((obj)=>{
          return obj.id == modelId;
        }).length;
      };
      infoObj.parentId = extendedClassName;
      this.classInfoArray.push(infoObj);

      if (extendedClassName && !(inClassInfoArray(extendedClassName))){
        if (typeof eval(extendedClassName) === 'object') this.getAllInfo(eval(extendedClassName));
      };

      /*
      inClassList = (modelId)=> {

        return this.countObjArr.filter((obj)=>{
          return Object.keys(obj)[0] == modelId;
        }).length;
      }

      if (extendedClassName && !(inClassList(extendedClassName))){
      //if (extendedClassName){
        if (extendedClassName !== 'FObject'){
            infoObj.parent = this.getAllInfo(eval(extendedClassName+".create()"));
        } else {
          infoObj.parent = {id: 'FObject', name:'FObject', package: ''};

        }
      }else {
        infoObj.parentId = extendedClassName;
      }
      return infoObj;
      */
    },


    function getExtendName(data){
      if (typeof data === "string"){
        try {
          return eval(data+ ".model_.extends");
        }catch(err) {
          console.log("error getting parent class of ", data, ":");
          console.log(err);
        }
      }
    },
  ],

  actions: [
    {
      name: 'debug',
      label: 'STOP',
      code: function(){
        debugger;
      },
    },
    {
      name: 'getInfoTree',
      code: function(){
        this.constructTree();
      }
    },
    {
      name: 'showCount',
      code: function(){
        this.getClassCount();
      }
    },
    {
      name: 'saveToFile',
      code: function(){

      }
    }
  ]


});
