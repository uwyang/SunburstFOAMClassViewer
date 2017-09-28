 foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'Address',

  documentation: 'Postal address.',

  properties: [
    {
      class: 'String',
      name: 'type'
    },
    {
      class: 'Boolean',
      name: 'verified'
    },
    {
      class: 'Boolean',
      name: 'deleted'
    },
    {
      class: 'Int',
      name: 'buildingNumber',
      documentation: 'Building number'
    },
    {
      class: 'String',
      name: 'address',
      required: true
    },
    {
      class: 'String',
      name: 'suite'
    },
    {
      class: 'String',
      name: 'city',
      required: true
    },
    {
      class: 'String',
      name: 'postalCode',
      required: true
    },
    {
      class: 'Reference',
      targetDAOKey: 'countryDAO',
      name: 'countryId',
      of: 'foam.nanos.auth.Country'
    },
    {
      class: 'Reference',
      targetDAOKey: 'regionDAO',
      name: 'regionId',
      of: 'foam.nanos.auth.Region'
    },
    {
      class: 'Boolean',
      name: 'encrypted'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'ChangePassword',

  documentation: 'Login information.',

  properties: [
    {
      class: 'Password',
      name: 'oldPassword',
      displayWidth: 30,
      width: 100
    },
    {
      class: 'Password',
      name: 'newPassword',
      displayWidth: 30,
      width: 100
      // TODO: custom view
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'EnabledAware',

  properties: [
    {
      class: 'Boolean',
      name: 'enabled',
      value: true
    }
  ]
});

// TODO: create an EnabledAwareDAO
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'Group',

  implements: [
    'foam.nanos.auth.EnabledAware'
  ],

  documentation: 'A Group of Users.',

  properties: [
    {
      class: 'String',
      name: 'id',
      documentation: 'Unique name of the Group.'
    },
    {
      class: 'String',
      name: 'description',
      documentation: 'Description of the Group.'
    },
    {
      class: 'String',
      name: 'parent',
      documentation: 'Parent group to inherit permissions from.'
    },
    {
      class: 'FObjectArray',
      of: 'foam.nanos.auth.Permission',
      name: 'permissions'
    }

    /*
      FUTURE
    {
      class: 'FObjectProperty',
      of: 'AuthConfig',
      documentation: 'Custom authentication settings for this group.'
    }
    */
  ],
  
  methods: [
    {
      name: 'implies',
      javaReturns: 'Boolean',
      args: [
        {
          name: 'permission',
          javaType: 'java.security.Permission'
        }
      ],
      javaCode:
        `if ( getPermissions() == null ) return false;
        for ( int i = 0 ; i < permissions_.length ; i++ ) {
          if ( new javax.security.auth.AuthPermission(permissions_[i].getId()).implies(permission) ) {
            return true;
          }
        }
        return false;`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.auth',
   name: 'Language',

   documentation: 'Language codes.',

   ids: [ 'code' ],

   properties: [
     'code',
     'name'
   ]
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.auth',
   name: 'LastModifiedAware',

   properties: [
     {
       class: 'DateTime',
       name: 'lastModified',
       factory: function() { new Date(); }
     }
   ]
 });

 // TODO: create a LastModifiedAwareDAO
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'LastModifiedByAware',

  properties: [
    {
      class: 'DateTime',
      name: 'lastModifiedBy'
    }
  ]
});

// TODO: create a LastModifiedByAwareDAO
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
 
foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'Login',

  documentation: 'Login information.',

  properties: [
    {
      class: 'String',
      name: 'id',
      displayWidth: 30,
      width: 100
    },
    {
      class: 'Password',
      name: 'password',
      displayWidth: 30,
      width: 100
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.auth',
   name: 'Permission',

   documentation: 'A permission represent access to system resources.',

   properties: [
     {
       class: 'String',
       name: 'id'
     },
     {
       class: 'String',
       name: 'description',
       documentation: 'Description of the Group.'
     }
   ]
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'Country',

  documentation: 'Country information.',

  ids: [ 'code' ],

  properties: [
    {
      class: 'String',
      name: 'code'
    },
    {
      class: 'String',
      name: 'name'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.auth',
   name: 'Region',

   documentation: 'Region (province/state) information.',

   ids: [ 'countryId', 'code' ],

   properties: [
     {
       class: 'String',
       name: 'countryId'
     },
     {
       class: 'String',
       name: 'code'
     },
     {
       class: 'String',
       name: 'name'
     }
   ]
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'User',

  implements: [
    'foam.nanos.auth.EnabledAware',
    'foam.nanos.auth.LastModifiedAware',
    'foam.nanos.auth.LastModifiedByAware'
  ],

  documentation: '',

  tableColumns: [
    'id', 'enabled', 'firstName', 'lastName', 'organization', 'lastModified'
  ],

  properties: [
    {
      class: 'Long',
      name: 'id',
      displayWidth: 30,
      width: 100
    },
    {
      class: 'String',
      // class: 'SPID',
      label: 'Service Provider',
      name: 'spid',
      documentation: "User's service provider."
    },
    {
      class: 'DateTime',
      name: 'lastLogin'
    },
    {
      class: 'String',
      name: 'firstName'
    },
    {
      class: 'String',
      name: 'middleName'
    },
    {
      class: 'String',
      name: 'lastName'
    },
    {
      class: 'String',
      name: 'organization'
    },
    {
      class: 'String',
      name: 'department'
    },
    {
      class: 'String',
      // class: 'Email',
      name: 'email'
    },
    {
      class: 'String',
      // class: 'Phone',
      name: 'phone'
    },
    {
      class: 'String',
      // class: 'Phone',
      name: 'mobile'
    },
    {
      class: 'String',
      name: 'type'
    },
    {
      class: 'DateTime',
      name: 'birthday'
    },
    {
      class: 'String',
      name: 'profilePicture'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.nanos.auth.Address',
      name: 'address'
    },
    {
      class: 'FObjectArray',
      of: 'foam.core.FObject',
      name: 'accounts'
    },
    {
      class: 'Reference',
      name: 'language',
      of: 'foam.nanos.auth.Language',
      value: 'en'
    },
    {
      class: 'String',
      name: 'timeZone'
      // TODO: create custom view or DAO
    },
    {
      class: 'Password',
      name: 'password',
      displayWidth: 30,
      width: 100
    },
    {
      class: 'Password',
      name: 'previousPassword',
      displayWidth: 30,
      width: 100
    },
    {
      class: 'DateTime',
      name: 'passwordLastModified'
    },
    // TODO: startDate, endDate,
    // TODO: do we want to replace 'note' with a simple ticket system?
    {
      class: 'String',
      name: 'note',
      displayWidth: 70,
      displayHeight: 10
    },
    // TODO: remove after demo
    {
      class: 'String',
      name: 'businessName',
      documentation: 'Name of the business'
    },
    {
      class: 'String',
      name: 'businessIdentificationNumber',
      documentation: 'Business Identification Number (BIN)'
    },
    {
      class: 'String',
      name: 'bankIdentificationCode',
      documentation: 'Bank Identification Code (BIC)'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.boot',
  name: 'NSpec',

  javaImports: [
    'bsh.EvalError',
    'bsh.Interpreter',
    'foam.dao.DAO',
    'foam.core.FObject'
  ],

  ids: [ 'name' ],

  tableColumns: [ 'name', 'lazy', 'serve', 'serviceClass' ],

  searchColumns: [ ],

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'Boolean',
      name: 'lazy',
      value: true
    },
    {
      class: 'Boolean',
      name: 'serve',
      // Used by u2.view.TableView
      tableCellFormatter: function(value, obj, property) {
        this
          .start()
            .call(function() {
              if ( value ) { this.style({color: 'green'}); } else { this.entity('nbsp'); }
            })
            .add(obj.serve ? ' Y' : '-')
          .end();
      },
      // Used by u2.TableView
      tableCellView: function(obj, e) {
        var e = e.E();
        if ( obj.serve ) { e.style({color: 'green'}); } else { e.entity('nbsp'); }
        e.add(obj.serve ? ' Y' : '-');
        return e;
      },
      documentation: 'If true, this service is served over the network.'
    },
    {
      class: 'String',
      name: 'serviceClass'
    },
    {
      class: 'String',
      name: 'boxClass'
    },
    {
      class: 'String',
      name: 'serviceScript',
      view: { class: 'foam.u2.tag.TextArea', rows: 12, cols: 80 }
    },
    {
      class: 'String',
      name: 'client',
      value: '{}',
      view: { class: 'foam.u2.tag.TextArea', rows: 12, cols: 80 }
    },
    {
      class: 'FObjectProperty',
      name: 'service',
      view: 'foam.u2.DetailView'
    }
    // TODO: permissions, keywords, lazy, parent
  ],

  methods: [
    {
      name: 'saveService',
      args: [ { name: 'service', javaType: 'Object' } ],
      javaCode: `
      System.err.println("***** saveService: " + service.getClass() + " " + (service instanceof FObject));
        if ( service instanceof FObject ) {
          setService((FObject) service);
          DAO dao = (DAO) getX().get("nSpecDAO");
          dao.put(this);
        }
      `
    },
    {
      name: 'createService',
      args: [
        {
          name: 'x', javaType: 'foam.core.X'
        }
      ],
      javaReturns: 'java.lang.Object',
      javaCode: `
        // if ( getService() != null ) return getService();

        if ( getServiceClass().length() > 0 ) {
          Object service = Class.forName(getServiceClass()).newInstance();
          // TODO: doesn't work with DAO's, fix
          // saveService(service);
          return service;
        }

        Interpreter shell = new Interpreter();
        try {
          shell.set("x", x);
          Object service = shell.eval(getServiceScript());
          saveService(service);
          return service;
        } catch (EvalError e) {
          System.err.println("NSpec serviceScript error: " + getServiceScript());
          e.printStackTrace();
        }

        return null;
      `,
      javaThrows: [
        'java.lang.ClassNotFoundException',
        'java.lang.InstantiationException',
        'java.lang.IllegalAccessException'
      ],
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.client',
  name: 'ClientBuilder',

  implements: [
    'foam.box.Context',
    'foam.mlang.Expressions'
  ],

  requires: [
    'foam.box.HTTPBox',
    'foam.dao.RequestResponseClientDAO',
    'foam.dao.ClientDAO',
    'foam.nanos.boot.NSpec'
  ],

  properties: [
    {
      name: 'nSpecDAO',
      factory: function() {
        return this.RequestResponseClientDAO.create({
          of: this.NSpec,
          delegate: this.HTTPBox.create({
            method: 'POST',
            url: 'http://localhost:8080/nSpecDAO'
          })});
        }
    }
  ],

  methods: [
    function then(resolve) {
      var self = this;

      var client = {
        package: 'foam.nanos.client',
        name: 'Client2',

        implements: [ 'foam.box.Context' ],

        requires: [
          'foam.box.HTTPBox',
          'foam.dao.RequestResponseClientDAO',
          'foam.dao.ClientDAO',
          'foam.dao.EasyDAO'
        ],

        exports: [
        ],

        properties: [
        ],

        methods: [
          function createDAO(config) {
            config.daoType = 'MDAO'; // 'IDB';
            config.cache   = true;

            return this.EasyDAO.create(config);
          }
        ]
      };

      self.nSpecDAO.where(self.EQ(self.NSpec.SERVE, true)).select({
        put: function(spec) {
          if ( spec.client ) {
            var stub =
            console.log('*************', spec.stringify());

            client.exports.push(spec.name);

            client.properties.push({
              name: spec.name,
              factory: function() {
                console.log('********************* creating stub', spec.client);
                var json = JSON.parse(spec.client);
                if ( ! json.serviceName ) json.serviceName = spec.name;
                if ( ! json.class       ) json.class       = 'foam.dao.EasyDAO'
                if ( ! json.daoType     ) json.daoType     = 'CLIENT';
                return foam.json.parse(json, null, this);
                //return foam.json.parseString(spec.client, this.__context__);
              }
            });
          }
        },
        eof: function() {
          foam.CLASS(client);
          resolve(foam.nanos.client.Client2);
        }
      });
    }
  ]
});

/*
{
  class: 'foam.dao.EasyDAO',
  of: 'foam.nanos.pm.PMInfo',
  type: 'CLIENT'
}
*/
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.client',
  name: 'Client',

  implements: [ 'foam.box.Context' ],

  documentation: 'Client for connecting to NANOS server.',

  requires: [
    'foam.box.HTTPBox',
    'foam.box.WebSocketBox',
    'foam.dao.RequestResponseClientDAO',
    'foam.dao.ClientDAO',
    'foam.dao.EasyDAO',
    'foam.nanos.auth.Country',
    'foam.nanos.auth.Group',
    'foam.nanos.auth.Language',
    'foam.nanos.auth.Permission',
    'foam.nanos.auth.Region',
    'foam.nanos.auth.User',
    'foam.nanos.boot.NSpec',
    'foam.nanos.cron.Cron',
    'foam.nanos.export.ExportDriverRegistry',
    'foam.nanos.menu.Menu',
    'foam.nanos.pm.PMInfo',
    'foam.nanos.script.Script',
    'foam.nanos.test.Test',
    'foam.nanos.auth.WebAuthService',
    'foam.nanos.auth.ClientAuthService'
  ],

  exports: [
    'countryDAO',
    'cronDAO',
    'exportDriverRegistryDAO',
    'groupDAO',
    'languageDAO',
    'menuDAO',
    'nSpecDAO',
    'permissionDAO',
    'pmInfoDAO',
    'regionDAO',
    'scriptDAO',
    'testDAO',
    'userDAO',
    'webAuth'
  ],

  properties: [
    {
      name: 'webAuth',
      factory: function() {
        return this.ClientAuthService.create({
          delegate: this.HTTPBox.create({
            method: 'POST',
            url: 'http://localhost:8080/webAuth'
          })
        });
      }
    },

    {
      name: 'userDAO',
      factory: function() {
        return this.RequestResponseClientDAO.create({
          of: this.User,
          delegate: this.HTTPBox.create({
            method: 'POST',
            url: 'http://localhost:8080/userDAO'
          })});
      }
    },

    {
      name: 'nSpecDAO',
      factory: function() {
        return this.RequestResponseClientDAO.create({
          of: this.NSpec,
          delegate: this.HTTPBox.create({
            method: 'POST',
            url: 'http://localhost:8080/nSpecDAO'
          })});
        /*
        return this.createDAO({
          of: this.NSpec,
          seqNo: true,
          testData: [
            { name: 'http',   serve: false, serviceClass: 'foam.nanos.http.NanoHttpServer' },
            { name: 'pmlog',  serve: false, serviceClass: 'foam.nanos.pm.DAOPMLogger' },
            { name: 'auth',   serve: true,  serviceClass: 'foam.nanos.auth.UserAndGroupAuthService' },
            { name: 'test',   serve: true,  serviceClass: 'foam.nanos.test.TestRunner' },
            { name: 'script', serve: true,  serviceClass: 'foam.nanos.script.ScriptRunner' },
            { name: 'cron',   serve: true,  serviceClass: 'foam.nanos.cron.CronRunner' }
          ]
        });
        */
      }
    },

    {
      name: 'countryDAO',
      factory: function() {
        return this.createDAO({
          of: this.Country,
          testData: [
            { code: 'BR', name: 'Brazil' },
            { code: 'CA', name: 'Canada' },
            { code: 'CN', name: 'China' },
            { code: 'IN', name: 'India' },
            { code: 'JM', name: 'Jamaica' },
            { code: 'LB', name: 'Lebanon' },
            { code: 'MX', name: 'Mexico' },
            { code: 'MY', name: 'Malaysia' },
            { code: 'RS', name: 'Serbia' },
            { code: 'TT', name: 'Trinidad and Tobago' },
            { code: 'UK', name: 'United Kingdom' },
            { code: 'US', name: 'USA' },
            { code: 'ZA', name: 'South Africa' }
          ]
        });
      }
    },

    // TODO: change to client DAO
    {
      name: 'exportDriverRegistryDAO',
      factory: function() {
        return this.createDAO({
          of: this.ExportDriverRegistry,
          testData: [
            { id: 'CSV',  driverName: 'net.nanopay.export.CSVDriver' },
            { id: 'JSON', driverName: 'net.nanopay.export.JSONDriver' },
            { id: 'XML',  driverName: 'net.nanopay.export.XMLDriver' }
          ]
        });
      }
    },

    {
      name: 'regionDAO',
      factory: function() {
        return this.createDAO({
          of: this.Region,
          testData: [
            { countryId: 'CA', code: 'AB', name: 'Alberta' },
            { countryId: 'CA', code: 'BC', name: 'British Columbia' },
            { countryId: 'CA', code: 'MB', name: 'Manitoba' },
            { countryId: 'CA', code: 'NB', name: 'New Brunswick' },
            { countryId: 'CA', code: 'NL', name: 'Newfoundland' },
            { countryId: 'CA', code: 'NS', name: 'Nova Scotia' },
            { countryId: 'CA', code: 'NT', name: 'Northwest Territories' },
            { countryId: 'CA', code: 'NU', name: 'Nunavut' },
            { countryId: 'CA', code: 'ON', name: 'Ontario' },
            { countryId: 'CA', code: 'PE', name: 'Prince Edward Island' },
            { countryId: 'CA', code: 'QC', name: 'Quebec' },
            { countryId: 'CA', code: 'SK', name: 'Saskatchewan' },
            { countryId: 'CA', code: 'YT', name: 'Yukon' },
            { countryId: 'IN', code: 'MH', name: 'Maharashtra'}
          ]
        });
      }
    },

    {
      name: 'menuDAO',
      factory: function() {
        return this.createDAO({

          of: this.Menu,
          testData: [
            { id: 'admin',                           label: 'Admin',          handler: { class: 'foam.nanos.menu.SubMenu' /*SubMenu*/ } },
              // { parent: 'admin', id: 'auth',         label: 'Authentication', handler: { class: 'foam.nanos.menu.TabsMenu' } },
              { parent: /*'auth'*/'admin', id: 'users',       label: 'Users',          handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'userDAO' } },
              { parent: /*'auth'*/'admin', id: 'groups',      label: 'Groups',         handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'groupDAO' } },
              { parent: /*'auth'*/'admin', id: 'permissions', label: 'Permissions',    handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'permissionDAO' }  },
              { parent: /*'auth'*/'admin', id: 'countries',   label: 'Countries',      handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'countryDAO' } },
              { parent: /*'auth'*/'admin', id: 'regions',     label: 'Regions',        handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'regionDAO' } },
              { parent: /*'auth'*/'admin', id: 'lang',        label: 'Languages',      handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'languageDAO' } },
              { parent: 'admin', id: 'nspec',        label: 'Nano Services',  handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'nSpecDAO' }  },
              { parent: 'admin', id: 'export',       label: 'Export Drivers', handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'exportDriverRegistryDAO' }  },
              { parent: 'admin', id: 'menus',        label: 'Menus',          handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'menuDAO', XXXsummaryView: { class: 'foam.u2.view.TreeView', relationship: MenuRelationship, formatter: function() { this.add(this.data.label); } }  } },
              { parent: 'admin', id: 'scripts',      label: 'Scripts',        handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'scriptDAO' } },
              { parent: 'admin', id: 'tests',        label: 'Tests',          handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'testDAO', summaryView: { class: 'foam.nanos.test.TestBorder' } } },
              { parent: 'admin', id: 'cron',         label: 'Cron Jobs',      handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'cronDAO' } },
              { parent: 'admin', id: 'pm',           label: 'Performance',    handler: { class: 'foam.nanos.menu.DAOMenu', daoKey: 'pmInfoDAO', summaryView: { class: 'foam.nanos.pm.PMTableView' } } },
              { parent: 'admin', id: 'log',          label: 'View Logs' },
              /*
            { id: 'support',                         label: 'Support',         handler: { class: 'foam.nanos.menu.TabsMenu' } },
              { parent: 'support', id: 'api',        label: 'API Reference' },
              { parent: 'support', id: 'context',    label: 'Context Walker' }
              */
          ]
        }).orderBy(this.Menu.ORDER, this.Menu.ID);
      }
    },

    {
      name: 'languageDAO',
      factory: function() {
        return this.createDAO({
          of: this.Language,
          testData: [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'French' }
          ]
        });
      }
    },

    {
      name: 'groupDAO',
      factory: function() {
        return this.createDAO({
          of: this.Group,
          seqNo: true,
          testData: [
            { id: 1, firstName: 'nanoPay Admin', lastName: 'nanoPay administration users' },
            { id: 2, firstName: 'Admin',         lastName: 'Administration users' },
            { id: 3, firstName: 'Tester',        lastName: 'Testers' },
            { id: 3, firstName: 'End User',      lastName: 'End users' }
          ]
        });
      }
    },

      {
        name: 'permissionDAO',
        factory: function() {
          return this.createDAO({
            of: this.Permission,
            testData: [
              { id: '*',         description: 'Do anything global permission.' },
              { id: 'menu.auth', description: 'Perform authentication related configuration.' }
            ]
          });
        }
      },

        {
          name: 'scriptDAO',
          factory: function() {
            return this.RequestResponseClientDAO.create({
              of: this.Script,
              delegate: this.HTTPBox.create({
                method: 'POST',
                url: 'http://localhost:8080/scriptDAO'
              })});
              /*

            return this.createDAO({
              of: this.Script,
              seqNo: true,
              testData: [
              ]
            });*/
          }
        },

        {
          name: 'pmInfoDAO',
          factory: function() {
            return this.EasyDAO.create({
              daoType: 'CLIENT',
              remoteListenerSupport: true,
              of: this.PMInfo,
              serviceName: 'pmInfoDAO'});
          }
        },

        {
          name: 'cronDAO',
          factory: function() {
            return this.createDAO({
              of: this.Cron,
              seqNo: true,
              testData: [
              ]
            });
          }
        },

        {
          name: 'testDAO',
          factory: function() {
            return this.RequestResponseClientDAO.create({
              of: this.Test,
              delegate: this.HTTPBox.create({
              method: 'POST',
              url: 'http://localhost:8080/testDAO'
            })});

            /*
            return this.createDAO({
              of: this.Test,
              seqNo: true,
              testData: [
              ]
            });
            */
          }
        }

  ],

  methods: [
    function createDAO(config) {
      config.daoType = 'MDAO'; // 'IDB';
      config.cache   = true;

      return this.EasyDAO.create(config);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.menu',
   name: 'AbstractMenu',

   methods: [
     function launch(X, menu) { X.stack.push(this.createView(X, menu)); }
   ]
 });


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'ViewMenu',
  extends: 'foam.nanos.menu.AbstractMenu',

  properties: [
    {
      class: 'foam.u2.ViewSpec',
      name: 'view'
    }
  ],

  methods: [
    function createView(X) { return this.view.clone ? this.view.clone() : this.view; }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'DAOMenu',
  extends: 'foam.nanos.menu.AbstractMenu',

  properties: [
    {
      class: 'String',
      name: 'daoKey'
    },
    { class: 'foam.u2.ViewSpec', name: 'summaryView',
    // TODO: remove next line when permanently fixed in ViewSpec
    fromJSON: function fromJSON(value, ctx, prop, json) { return value; }
    }
  ],

  methods: [
    function createView(X) {
      var view = { class: 'foam.comics.BrowserView', data: X[this.daoKey] };

      if ( this.summaryView ) view.summaryView = this.summaryView;
      return view;
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'ListMenu',
  extends: 'foam.nanos.menu.AbstractMenu',

  requires: [ 'foam.u2.Element' ],

  methods: [
    function createView(X, menu) {
      var e = this.Element.create(undefined, X);

      X.stack.push(e);

      menu.children.select({
        put: function(menu) {
          if ( menu.handler ) {
            e.tag(menu.handler.createView(X, menu));
          } else {
            e.add('Coming Soon!');
          }
        },
        eof: function() {}
      });

      return e;
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'TabsMenu',
  extends: 'foam.nanos.menu.AbstractMenu',

  requires: [ 'foam.u2.Tabs' ],

  methods: [
    function createView(X, menu) {
      var tabs = this.Tabs.create(undefined, X);

      X.stack.push(tabs);

      menu.children.select({
        put: function(menu) {
          tabs.start({class: 'foam.u2.Tab', label: menu.label}).call(function() {
            if ( menu.handler ) {
              this.tag((menu.handler && menu.handler.createView(X, menu)));
            } else {
              this.add('Coming Soon!');
            }
          }).end();
        },
        eof: function() {}
      });

      return tabs;
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'SubMenuView',
  extends: 'foam.nanos.menu.PopupMenu',

  properties: [ 'X', 'menu' ],

  axioms: [
    foam.u2.CSS.create({
      code: function CSS() {/*
        ^inner {
          -webkit-box-shadow: 0px 0px 67px -15px rgba(0,0,0,0.75);
          -moz-box-shadow: 0px 0px 67px -15px rgba(0,0,0,0.75);
          box-shadow: 0px 0px 67px -15px rgba(0,0,0,0.75);
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;

          position: absolute;
          top: 65px;
          font-weight: 300;
        }
        ^inner div {
          box-sizing: border-box;
          padding: 8px 24px;
          padding-right: 48px;
          cursor: pointer;
          background: white;
          color: black;
          border-left: solid 1px #edf0f5;
          border-right: solid 1px #edf0f5;
        }
        ^inner div:last-child {
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;
        }
        ^inner div:hover {
          color: white;
          background: #1cc2b7;
          border-left: solid 1px #1cc2b7;
          border-right: solid 1px #1cc2b7;
        }
      */}
    })
  ],

  methods: [
    function initE() {
      this.addClass(this.myClass());
      var self = this;
      var menu = this.menu;
      var X = this.X;

      menu.children.select({
        put: function(menu) {
          if ( ! menu.handler ) return;
          self.start('div')
            .on('click', function() { self.close(); menu.launch(X); })
            .add(menu.label)
          .end();
        },
        eof: function() {}
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'SubMenu',
  extends: 'foam.nanos.menu.AbstractMenu',

  requires: [ 'foam.nanos.menu.SubMenuView' ],

  methods: [
    function createView(X, menu, parent) {
      return this.SubMenuView.create({menu: menu, parent: parent}, X);
    },

    function launch(X, menu, parent) {
      var view = this.createView(X, menu, parent);
      view.open();
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'Menu',

  tableColumns: [ 'id', 'parent', 'label', 'order' ],

  properties: [
    {
      class: 'String',
      name: 'id'
    },
    {
      class: 'String',
      name: 'label'
    },
    {
      class: 'FObjectProperty',
      name: 'handler',
      view: 'foam.u2.view.FObjectView'
    },
    {
      class: 'Int',
      name: 'order',
      value: 1000
    }
  ],

  actions: [
    {
      name: 'launch',
      code: function(X) {
        console.log('MENU: ', this.id, this.label);
        this.handler && this.handler.launch(X, this);
      }
    }
  ]
});


var MenuRelationship = foam.RELATIONSHIP({
  sourceModel: 'foam.nanos.menu.Menu',
  targetModel: 'foam.nanos.menu.Menu',
  forwardName: 'children',
  inverseName: 'parent',
  sourceProperty: {
    hidden: true
  },
  targetProperty: {
    class: 'String',
    value: ''
  }
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'MenuBar',
  extends: 'foam.u2.Element',

  implements: [ 'foam.mlang.Expressions' ],

  requires: [ 'foam.nanos.menu.Menu' ],

  imports: [ 'menuDAO' ],

  documentation: 'Navigational menu bar',

  axioms: [
    foam.u2.CSS.create({
      code: function CSS() {/*
        ^ {
          display: inline-block;
          vertical-align: top;
        }
        ^ ul{
          margin-top: 20px;
          font-size: 13px;
          list-style-type: none;
        }
        ^ li{
          margin-left: 25px;
          display: inline-block;
          cursor: pointer;
        }
      */}
    })
  ],

  properties: [
    {
      name: 'menuName',
      value: '' // The root menu
    }
  ],

  methods: [
    function initE() {
      var self = this;
      this
          .addClass(this.myClass())
          .start()
            .start('ul')
              .select(this.menuDAO.where(this.EQ(this.Menu.PARENT, this.menuName)), function(menu) {
                this.start('li')
                  .call(function() {
                    var e = this;
                    this.start()
                      .add(menu.label)
                      .on('click', function() { menu.handler && menu.handler.launch(self.__context__, menu, e) })
                    .end();
                  })
                .end()
              })
            .end()
          .end()
        .end();
    }
  ]
});


foam.CLASS({
  package: 'foam.nanos.menu',
  name: 'PopupMenu',
  extends: 'foam.u2.Element',

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        ^container {
          align-items: center;
          display: flex;
          height: 100%;
          justify-content: space-around;
          position: relative;
          width: 100%;
        }
        ^background {
          bottom: 0;
          left: 0;
          opacity: 0.4;
          position: absolute;
          right: 0;
          top: 0;
        }
        ^inner {
          z-index: 3;
        }
      */}
    })
  ],

  properties: [
    'parent'
  ],

  methods: [
    function init() {
      this.SUPER();
      var content;

      this.addClass(this.myClass())
        .start()
          .addClass(this.myClass('background'))
          .on('click', this.close)
        .end()
        .start()
          .call(function() { content = this; })
          .addClass(this.myClass('inner'))
        .end();

      this.content = content;
    },

    function open() {
      if ( this.parent ) {
        this.parent.add(this);
      } else {
        this.document.body.insertAdjacentHTML('beforeend', this.outerHTML);
        this.load();
      }
    }
  ],

  listeners: [
    function close() {
      this.remove();
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.ENUM({
  package: 'foam.nanos.script',
  name: 'Language',

  documentation: 'Scripting language',

  values: [
    { name: 'JS',        label: 'Javascript (Client)' },
    { name: 'BEANSHELL', label: 'BeanShell (Server)'  }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.script',
  name: 'Script',

  implements: [ 'foam.nanos.auth.EnabledAware' ],

  imports: [ 'scriptDAO' ],

  javaImports: [
    'bsh.EvalError',
    'bsh.Interpreter',
    'foam.nanos.pm.PM',
    'java.io.ByteArrayOutputStream',
    'java.io.PrintStream',
    'java.util.Date'
  ],

  tableColumns: [
    'id', 'enabled', 'server', /*'language',*/ 'description', 'run'
  ],

  searchColumns: [ ],

  properties: [
    {
      class: 'String',
      name: 'id'
    },
    {
      class: 'String',
      name: 'description'
    },
    {
      class: 'DateTime',
      name: 'lastRun',
      visibility: foam.u2.Visibility.RO
    },
    /*
    {
      class: 'Enum',
      of: 'foam.nanos.script.Language',
      name: 'language',
      value: foam.nanos.script.Language.BEANSHELL,
      transient: true
      // TODO: fix JS support
    },
    */
    {
      class: 'Boolean',
      name: 'server',
      value: true
    },
    {
      class: 'Boolean',
      name: 'scheduled',
      hidden: true
    },
    {
      class: 'String',
      name: 'code',
      view: { class: 'foam.u2.tag.TextArea', rows: 20, cols: 80 }
    },
    {
      class: 'String',
      name: 'output',
      visibility: foam.u2.Visibility.RO,
      view: { class: 'foam.u2.tag.TextArea', rows: 20, cols: 80 }
    },
    {
      class: 'String',
      name: 'notes',
      view: { class: 'foam.u2.tag.TextArea', rows: 10, cols: 80 }
    }
  ],

  methods: [
    {
      name: 'runScript',
      args: [
        {
          name: 'x', javaType: 'foam.core.X'
        }
      ],
      javaReturns: 'void',
      javaCode: `
        ByteArrayOutputStream baos  = new ByteArrayOutputStream();
        PrintStream           ps    = new PrintStream(baos);
        Interpreter           shell = new Interpreter();
        PM                    pm    = new PM(this.getClass(), getId());

        // TODO: import common packages like foam.core.*, foam.dao.*, etc.
        try {
          shell.set("currentScript", this);
          setOutput("");
          shell.set("x", getX());
          shell.setOut(ps);
          shell.eval(getCode());
        } catch (EvalError e) {
          e.printStackTrace();
        } finally {
          pm.log(x);
        }

        setLastRun(new Date());
        ps.flush();
      System.err.println("******************** Output: " + baos.toString());
        setOutput(baos.toString());
    `
    }
  ],

  actions: [
    {
      name: 'run',
      code: function() {
        var self = this;
        this.output = '';

//        if ( this.language === foam.nanos.script.Language.BEANSHELL ) {
        if ( this.server ) {
          this.scheduled = true;
          this.scriptDAO.put(this).then(function(script) {
            self.copyFrom(script);
          });
        } else {
          var log = function() { this.output = this.output + Array.prototype.join.call(arguments, ''); }.bind(this);

          with ( { log: log, print: log } ) {
            var ret = eval(this.code);
            console.log('ret: ', ret);
            // TODO: if Promise returned, then wait
          }

          this.scriptDAO.put(this);
        }
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.test',
  name: 'Test',
  extends: 'foam.nanos.script.Script',

  imports: [ 'testDAO as scriptDAO' ],

  javaImports: [
    'bsh.EvalError',
    'bsh.Interpreter',
    'foam.nanos.pm.PM',
    'java.io.ByteArrayOutputStream',
    'java.io.PrintStream',
    'java.util.Date'
  ],

  tableColumns: [
    'id', 'enabled', 'description', 'passed', 'failed', 'lastRun', 'run'
  ],

  searchColumns: [ ],

  properties: [
    'id',
    {
      class: 'Long',
      name: 'passed',
      visibility: foam.u2.Visibility.RO,
      tableCellFormatter: function(value) {
        if ( value ) this.start().style({color: '#0f0'}).add(value).end();
      }
    },
    {
      class: 'Long',
      name: 'failed',
      visibility: foam.u2.Visibility.RO,
      tableCellFormatter: function(value) {
        if ( value ) this.start().style({color: '#f00'}).add(value).end();
      }
    }
  ],

  methods: [
    {
      /** Template method used to add additional code in subclasses. */
      name: 'runTest',
      javaReturns: 'void',
      javaCode: '/* NOOP */'
    },
    {
      name: 'test',
      args: [
        {
          name: 'exp', javaType: 'boolean'
        },
        {
          name: 'message', javaType: 'String'
        }
      ],
      javaReturns: 'void',
      javaCode: `
        if ( exp ) {
          setPassed(getPassed()+1);
        } else {
          setFailed(getFailed()+1);
        }
        print((exp ? "SUCCESS: " : "FAILURE: ") + message);
      `
    },
    {
      name: 'print',
      args: [
        {
          name: 'message', javaType: 'String'
        }
      ],
      javaReturns: 'void',
      javaCode: `
        setOutput(getOutput() + "\\n" + message);
      `
    },
    {
      name: 'runScript',
      args: [
        {
          name: 'x', javaType: 'foam.core.X'
        }
      ],
      javaReturns: 'void',
      javaCode: `
        ByteArrayOutputStream baos  = new ByteArrayOutputStream();
        PrintStream           ps    = new PrintStream(baos);
        Interpreter           shell = new Interpreter();
        PM                    pm    = new PM(this.getClass(), getId());

        try {
          shell.set("currentTest", this);
          setPassed(0);
          setFailed(0);
          setOutput("");
          shell.set("x", getX());
          shell.setOut(ps);

          // creates the testing method
          shell.eval("test(boolean exp, String message) { if ( exp ) { currentTest.setPassed(currentTest.getPassed()+1); } else { currentTest.setFailed(currentTest.getFailed()+1); } print((exp ? \\"SUCCESS: \\" : \\"FAILURE: \\")+message);}");
          shell.eval(getCode());
          runTest();
        } catch (EvalError e) {
          e.printStackTrace();
        } finally {
          pm.log(x);
        }

        setLastRun(new Date());
        ps.flush();
        System.err.println("******************** Output: " + this.getPassed() + " " + this.getFailed() + " " + baos.toString());
        setOutput(baos.toString() + getOutput());
    `
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.test',
   name: 'TestBorder',
   extends: 'foam.u2.view.ScrollTableView',

   implements: [ 'foam.mlang.Expressions' ],

   requires: [ 'foam.nanos.test.Test' ],

   properties: [
     'status',
     { class: 'Int', name: 'passed' },
     { class: 'Int', name: 'failed' }
   ],

   methods: [
     function initE() {
       this.
         startContext({data: this}).add(this.RUN_ALL, this.RUN_FAILED_TESTS).endContext().
         start('span').style({'padding-left': '12px'}).add('Passed: ', this.passed$).end().
         start('span').style({'padding-left': '12px'}).add('Failed: ', this.failed$).end().
         start('span').style({'padding-left': '12px'}).add('Status: ', this.status$).end();

      this.SUPER();
    },

    function runTests(dao) {
      var self  = this;
      var count = 0;
      var startTime = Date.now();

      this.status = 'Testing...';
      this.passed = this.failed = 0;

      dao.select({
        put: function(t) {
          count++;
          self.status = 'Testing: ' + t.id;
          t.run();
          self.passed += t.passed;
          self.failed += t.failed;
          console.log(t.stringify());
        },
        eof: function() {
          var duration = (Date.now() - startTime) / 1000;
          self.status = count + ' tests run in ' + duration.toFixed(2) + ' seconds';
        }
      });
    }
   ],



   actions: [
     function runAll() {
       this.runTests(this.data);
     },
     function runFailedTests() {
       this.runTests(this.data.where(this.GT(this.Test.FAILED, 0)));
     },
   ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.cron',
  name: 'Cron',
  extends: 'foam.nanos.script.Script',

  javaImports: [
    'java.util.Date',
    'java.util.Calendar'
  ],

  documentation: 'FOAM class that models a Cron script',

  properties: [
    {
      class: 'Int',
      name: 'minute',
      value: -1,
      documentation: `Minute to execute script.
          Ranges from 0 - 59. -1 for wildcard`
    },
    {
      class: 'Int',
      name: 'hour',
      value: -1,
      documentation: `Hour to execute script.
          Ranges from 0 - 23. -1 for wildcard`
    },
    {
      class: 'Int',
      name: 'dayOfMonth',
      value: -1,
      documentation: `Day of Month to execute script.
          Ranges from 1 - 31. -1 for wildcard`
    },
    {
      class: 'Int',
      name: 'month',
      value: -1,
      documentation: `Month to execute script.
          Ranges from 1 - 12. -1 for wildcard`
    },
    {
      class: 'Int',
      name: 'dayOfWeek',
      value: -1,
      documentation: `Day of week to execute script.
          Ranges from 0 - 6, where 0 is Sunday. -1 for wildcard`
    },
    {
      class: 'DateTime',
      name: 'scheduledTime',
      documentation: `Scheduled time to run Cron script.`,
      javaFactory: 'return getNextScheduledTime();'
    }
  ],

  methods: [
    {
      name: 'runScript',
      args: [
        {
          name: 'x', javaType: 'foam.core.X'
        }
      ],
      javaReturns: 'void',
      javaCode:
`super.runScript(x);
setScheduledTime(getNextScheduledTime());`
    },
    {
      name: 'getNextScheduledTime',
      javaReturns: 'Date',
      javaCode:
`Calendar next = Calendar.getInstance();
next.add(Calendar.MINUTE, 1);
next.set(Calendar.MILLISECOND, 0);
next.set(Calendar.SECOND, 0);

boolean dateFound = false;
while ( next.get(Calendar.YEAR) < 3000 ) {
  if ( getMonth() >= 0 && next.get(Calendar.MONTH) != getMonth() - 1 ) {
    next.add(Calendar.MONTH, 1);
    next.set(Calendar.DAY_OF_MONTH, 1);
    next.set(Calendar.HOUR_OF_DAY, 0);
    next.set(Calendar.MINUTE, 0);
    continue;
  }
  if ( ( getDayOfMonth() >= 0 && next.get(Calendar.DAY_OF_MONTH) != getDayOfMonth() ) ||
      ( getDayOfWeek() >= 0 && next.get(Calendar.DAY_OF_WEEK) != getDayOfWeek() + 1) ) {
    next.add(Calendar.DAY_OF_MONTH, 1);
    next.set(Calendar.HOUR_OF_DAY, 0);
    next.set(Calendar.MINUTE, 0);
    continue;
  }
  if ( getHour() >= 0 && next.get(Calendar.HOUR_OF_DAY) != getHour() ) {
    next.add(Calendar.HOUR_OF_DAY, 1);
    next.set(Calendar.MINUTE, 0);
    continue;
  }
  if ( getMinute() >= 0 && next.get(Calendar.MINUTE) != getMinute() ) {
    next.add(Calendar.MINUTE, 1);
    continue;
  }
  dateFound = true;
  break;
}
if ( !dateFound ) {
  throw new IllegalArgumentException("Unable to get next scheduled time");
}
return next.getTime();`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.export',
  name: 'ExportDriverRegistry',

  documentation: 'Export driver registry model',

  properties: [
    { class: 'String', name: 'id' },
    { class: 'String', name: 'driverName' },
    { class: 'String', name: 'targetModel' }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.INTERFACE({
  package: 'foam.nanos.export',
  name: 'ExportDriver',

  documentation: 'Interface for exporting data from a DAO',

  methods: [
    {
      name: 'exportFObject',
      returns: 'String',
      args: ['X', 'obj'],
      documentation: 'Exports an FObject'
    },
    {
      name: 'exportDAO',
      returns: 'Promise',
      args: ['X', 'dao'],
      documentation: 'Exports data in a DAO'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.export',
  name: 'JSONDriver',
  implements: [ 'foam.nanos.export.ExportDriver' ],

  documentation: 'Class for exporting data from a DAO to JSON',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() { return foam.json.PrettyStrict; }
    }
  ],

  methods: [
    function exportFObject(X, obj) {
      return this.outputter.stringify(obj);
    },
    function exportDAO(X, dao) {
      var self = this;
      return dao.select().then(function (sink) {
        return self.outputter.stringify(sink.array);
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.export',
  name: 'XMLDriver',
  implements: [ 'foam.nanos.export.ExportDriver' ],

  documentation: 'Class for exporting data from a DAO to XML',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.xml.Outputter',
      name: 'outputter',
      factory: function() { return foam.xml.Compact; }
    }
  ],

  methods: [
    function exportFObject(X, obj) {
      return this.outputter.stringify(obj);
    },
    function exportDAO(X, dao) {
      var self = this;
      return dao.select().then(function (sink) {
        return self.outputter.stringify(sink.array);
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.export',
  name: 'CSVDriver',
  implements: [ 'foam.nanos.export.ExportDriver' ],

  documentation: 'Class for exporting data from a DAO to CSV',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.lib.csv.Outputter',
      name: 'outputter',
      factory: function() { return foam.lib.csv.Standard; }
    }
  ],

  methods: [
    function exportFObject(X, obj) {
      return this.outputter.stringify(obj);
    },
    function exportDAO(X, dao) {
      var self = this;
      return dao.select().then(function (sink) {
        return self.outputter.stringify(sink.array);
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
/*
 foam.RELATIONSHIP({
   cardinality: '*:*',
   sourceModel: 'foam.nanos.auth.Group',
   targetModel: 'foam.nanos.auth.Permission',
   forwardName: 'permissions',
   inverseName: 'groups',
   sourceProperty: {
     hidden: true
   },
   targetProperty: {
     hidden: true
   }
 });
*/


/*
 foam.RELATIONSHIP({
   cardinality: '*:*',
   sourceModel: 'foam.nanos.auth.User',
   targetModel: 'foam.nanos.auth.Group',
   forwardName: 'groups',
   inverseName: 'users',
   sourceProperty: {
     hidden: true
   },
   targetProperty: {
     hidden: true
   }
 });
*/

 foam.RELATIONSHIP({
   cardinality: '1:*',
   sourceModel: 'foam.nanos.auth.Group',
   targetModel: 'foam.nanos.auth.User',
   forwardName: 'users',
   inverseName: 'group',
   sourceProperty: {
     hidden: true
   },
   targetProperty: {
     hidden: true
   }
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.INTERFACE({
  package: 'foam.nanos',
  name: 'NanoService',
  methods: [
    {
      name: 'start',
      javaReturns: 'void'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.INTERFACE({
  package: 'foam.nanos.auth',
  name: 'WebAuthService',
  extends: 'foam.nanos.NanoService',
  methods: [
    {
      name: 'generateChallenge',
      returns: 'Promise',
      javaReturns: 'String',
      javaThrows: [ 'javax.naming.AuthenticationException' ],
      args: [
        {
          name: 'userId',
          javaType: 'long'
        }
      ]
    },
    {
      name: 'challengedLogin',
      returns: 'Promise',
      javaReturns: 'foam.nanos.auth.User',
      javaThrows: [ 'javax.naming.AuthenticationException' ],
      args: [
        {
          name: 'userId',
          javaType: 'long'
        },
        {
          name: 'challenge',
          javaType: 'String'
        }
      ]
    },
    {
      name: 'login',
      returns: 'Promise',
      javaReturns: 'foam.nanos.auth.User',
      javaThrows: [ 'javax.naming.AuthenticationException' ],
      args: [
        {
          name: 'email',
          javaType: 'String'
        },
        {
          name: 'password',
          javaType: 'String'
        }
      ]
    },
    {
      name: 'check',
      javaReturns: 'Boolean',
      returns: 'Promise',
      args: [
        {
          name: 'userId',
          javaType: 'long'
        },
        {
          name: 'permission',
          javaType: 'foam.nanos.auth.Permission'
        }
      ]
    },
    {
      name: 'updatePassword',
      returns: 'Promise',
      javaReturns: 'void',
      javaThrows: [ 'javax.naming.AuthenticationException' ],
      args: [
        {
          name: 'userId',
          javaType: 'long'
        },
        {
          name: 'oldPassword',
          javaType: 'String'
        },
        {
          name: 'newPassword',
          javaType: 'String'
        }
      ]
    },
    {
      name: 'logout',
      javaReturns: 'void',
      returns: 'Promise',
      args: [
        {
          name: 'userId',
          javaType: 'long'
        }
      ]
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.auth',
  name: 'ClientAuthService',

  properties: [
    {
      class: 'Stub',
      of: 'foam.nanos.auth.WebAuthService',
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// TODO: rename properties to use camelCase
foam.CLASS({
  package: 'foam.nanos.pm',
  name: 'PMInfo',

  documentation: 'Performance Measurement database entry.',

  ids: [ 'clsname', 'pmname' ],

  searchColumns: [ ],

  properties: [
    {
      class: 'String',
      name: 'clsname',
      label: 'Class'
    },
    {
      class: 'String',
      name: 'pmname',
      label: 'Name'
    },
    {
      class: 'Int',
      name: 'numoccurrences',
      label: 'Count'
    },
    {
      class: 'Long',
      name: 'mintime',
      label: 'Min'
    },
    {
      class: 'Long',
      name: 'average',
      label: 'Avg',
      getter: function() { return (this.totaltime / this.numoccurrences).toFixed(2); },
      javaGetter: `return (long) Math.round( ( getTotaltime() / getNumoccurrences() ) * 100 ) / 100;`,
      transient: true
    },
    {
      class: 'Long',
      name: 'maxtime',
      label: 'Max'
    },
    {
      class: 'Long',
      name: 'totaltime',
      label: 'Total',
      tableCellFormatter: function(value) {
        this.tag({class: 'foam.nanos.pm.TemperatureCView', totalTime: value}).add(' ', value);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.pm',
  name: 'PMTableView',
  extends: 'foam.u2.view.TableView',

  documentation: 'TableView for displaying PMInfos.',

  implements: [ 'foam.mlang.Expressions' ],

  requires: [ 'foam.nanos.pm.PMInfo' ],

  exports: [ 'maxTotalTime' ],

  axioms: [
    foam.u2.CSS.create({code: foam.u2.view.TableView.getAxiomsByClass(foam.u2.CSS)[0].code}),
    foam.u2.CSS.create({code: `
      .foam-comics-BrowserView-foam-nanos-pm-PMInfo .foam-u2-ActionView-create { display: none; }
      .foam-comics-BrowserView-foam-nanos-pm-PMInfo .foam-u2-ActionView-edit   { display: none; }
    `})
  ],

  properties: [
    {
      class: 'Long',
      name: 'maxTotalTime'
    }
  ],

  methods: [
    function initE() {
      this.add(this.CLEAR_ALL);
      this.columns_.push(this.CLEAR);

      this.SUPER();

      this.updateMax();
      this.data.listen({reset: this.updateMax, put: this.updateMax});
    }
  ],

  actions: [
    {
      name: 'clear',
      code: function(X) {
        X.pmInfoDAO.remove(this);
      }
    },
    {
      name: 'clearAll',
      code: function() {
        this.data.removeAll();
      }
    }
  ],

  listeners: [
    {
      name: 'updateMax',
      isFramed: true,
      code: function() {
        var self = this;
        this.data.select(this.MAX(this.PMInfo.TOTALTIME)).then(function(max) {
          self.maxTotalTime = max.value;
        });
      }
    }
  ]
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.CLASS({
   package: 'foam.nanos.pm',
   name: 'TemperatureCView',
   extends: 'foam.graphics.CView',

   documentation: 'Display PM totalTime as a simple colour bar.',

   imports: [ 'maxTotalTime' ],

   properties: [
     [ 'totalTime', 100 ],
     [ 'width', 120 ],
     [ 'height', 18 ],
     [ 'autoRepaint', true ],
     {
       name: 'temperature',
       expression: function(totalTime, maxTotalTime) {
         return totalTime >= maxTotalTime ? 1 : totalTime/maxTotalTime;
       }
     }
   ],

   methods: [
     function paintSelf(x) {
       var g = x.fillStyle = x.createLinearGradient(0, 0, this.width, this.height);
       g.addColorStop(0, 'hsl(64, 100%, 50%)');
       g.addColorStop(1, 'hsl(0, 100%, 50%)');
       x.fillRect(0, 0, this.width*this.temperature, this.height);
     }
   ]
 });
