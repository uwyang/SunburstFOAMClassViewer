/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

// Polyfill

// Required on IE 11, Android Browser before 5.1.
if ( ! Math.trunc ) {
  Math.trunc = function trunc(v) {
    return v > 0 ? Math.floor(v) : Math.ceil(v);
  };
}

// Required on IE 11, Android Browser (at least to 5.1).
if ( ! Array.from ) {
  /** Turn array-like objects into real arrays. **/
  Array.from = function(a) {
    var b = new Array(a.length);
    for ( var i = 0 ; i < a.length ; i++ ) b[i] = a[i];
    return b;
  }
}

// Required on IE 11, Android Browser (at least to 5.1).
if ( ! Array.prototype.find ) {
  Array.prototype.find = function(predicate) {
    if ( this === null ) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if ( typeof predicate !== 'function' ) {
      throw new TypeError('predicate must be a function');
    }
    var list    = Object(this);
    var length  = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for ( var i = 0 ; i < length ; i++ ) {
      value = list[i];
      if ( predicate.call(thisArg, value, i, list) ) return value;
    }
    return undefined;
  };
}

// Required on IE 11, Android Browser (at least to 5.1).
if ( ! String.prototype.endsWith ) {
  // Official polyfill
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if ( typeof position !== 'number' ||
          ! isFinite(position) ||
          Math.floor(position) !== position ||
          position > subjectString.length ) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

// Required on IE 11, Android Browser (at least to 5.1).
if ( ! String.prototype.startsWith ) {
  String.prototype.startsWith = function(str, pos) {
    return this.indexOf(str) === 0;
  };
}

// Required for IE 11.
if ( ! Number.isInteger ) {
  Number.isInteger = function(value) {
    return typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value;
  }
}

if ( ! Object.values ) {
  Object.values = function(obj) {
    return Object.keys(obj).map(function(k) { return obj[k]; });
  };
}

// Required for IE 11.
if( ! Object.is ) {
  // From ES6 specs, and also:
  // https://gist.github.com/matthewp/2036428
  Object.is = function(x, y) {
    if (x === y) {
      // 0 === -0, but they are not identical
      return x !== 0 || 1 / x === 1 / y;
    }

    // NaN !== NaN, but they are identical.
    // NaNs are the only non-reflexive value, i.e., if x !== x,
    // then x is a NaN.
    // isNaN is broken: it converts its argument to number, so
    // isNaN("foo") => true
    return x !== x && y !== y;
  };
}
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * Top-Level of foam package
 */
foam = {
  isServer: typeof window === 'undefined',
  core:     {},
  next$UID: (function() {
    /* Return a unique id. */
    var id = 1;
    return function next$UID() { return id++; };
  })()
};


/** Setup nodejs-like 'global' on web */
if ( ! foam.isServer ) global = window;


Object.defineProperty(
  Object.prototype,
  '$UID',
  {
    get: function() {
      if ( ! Object.hasOwnProperty.call(this, '$UID__') &&
           ! Object.isFrozen(this) ) {
        Object.defineProperty(
            this,
            '$UID__',
            {value: foam.next$UID(), enumerable: false});
      }
      return this.$UID__;
    },
    enumerable: false
  }
);


/**
 * Define an assertion function that is significantly faster and more
 * compatible than console.assert.  Also allows us to turn off assertions
 * in a production scenario.
 *
 * Usage of console.assert directly is slow, and not all platforms agree
 * on what to do with extra arguments, some ignore them, some join them
 * to the message.
 */
foam.assert = function assert(cond) {
  if ( ! cond ) {
    console.assert(false, Array.from(arguments).slice(1).join(' '));
  }

  return cond;
};


/**
 * Creates a small library in the foam package. A LIB is a collection of
 * constants and static methods.
 * <pre>
foam.LIB({
  name: 'network',
  constants: {
    PORT: 4000
  },
  methods: [ function sendPacket() { ... }  ]
});
</pre>
Produces <code>foam.network</code>:
<pre>
console.log(foam.network.PORT); // outputs 4000
foam.network.sendPacket();
</pre>
 * @method LIB
 * @memberof module:foam
 */
foam.LIB = function LIB(model) {
  var root = global;
  var path = model.name.split('.');
  var i;

  for ( i = 0 ; i < path.length ; i++ ) {
    root = root[path[i]] || ( root[path[i]] = {} );
  }

  // During boot, keep a list of created LIBs
  if ( global.foam.__LIBS__ ) global.foam.__LIBS__[model.name] = root;

  if ( model.constants ) {
    foam.assert(
      typeof model.constants === 'object',
      'Constants must be a map.');

    for ( var key in model.constants ) root[key] = model.constants[key];
  }

  if ( model.methods ) {
    foam.assert(Array.isArray(model.methods), 'Methods must be an array.');

    for ( i = 0 ; i < model.methods.length ; i++ ) {
      var m = model.methods[i];

      foam.assert(
        typeof m === 'object' || typeof m === 'function',
        'Methods must be a map of a function');

      foam.assert(
         typeof m !== 'object' || typeof m.code === 'function',
        'Methods must have a code key which is a function');

      var name = m.name || foam.Function.getName(m);
      foam.assert(name, 'Methods must be named with a non-empty string');

      root[name] = m.code || m;
    }
  }
};
global.foam.__LIBS__ = Object.create(null);
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This must be declared as the first foam.LIB() using { name: ..., code: ... }
// method syntax because foam.LIB() may invoke foam.Function.getName() on
// methods declared using function methodName(...) { ... }.
foam.LIB({
  name: 'foam.Function',

  methods: [
    {
      name: 'getName',
      code: (function named() {}).name === 'named' ?
          function(method) { return method.name; } :
          function(method) {
            if (typeof method !== 'function') return method.name;

            // IE11 does not support named functions. Extract name with
            // f.toString().
            var match = method.toString().
                match(/^function\s+([A-Za-z_$][0-9A-Za-z_$]*)\s*\(/);
            foam.assert(match, 'Unable to deduce method name from function');
            return match[1];
          }
    }
  ]
});

/**
  Rather than extending built-in prototypes, we create flyweight versions.

  This has a number of advantages:
  1. It avoids conflicts with other libraries which might also extend built-in
     types with methods with the same names but different semantics.
  2. It is >10X faster (in V8) to call a flyweight method than a Method added
     to the prototypes of String or Number. This is because calling an added
     method on those types promotes the object from a primitive string or number
     to a String or Number object.  Creating the object takes time and creates a
     new object that will need to be GC'ed.
  3. It lets us effectively add methods to built-in special values like
     true, false, null, and undefined. This avoids the need for null-pointer
     checks.
  4. It avoids the proliferation of large ===/typeof/isInstance/instanceof blocks
     throughout the rest of the code.
  5. It provides a consistent method for checking an object's type, since each
     type flyweight has an .isInstance() method which abstracts the underlying detection
     mechanism.
  6. It makes the future implementation of multi-methods much easier.
*/

/**
 * Each of these flyweight types follows a standard interface.
 *
 * <pre>
 * interface Type {
 *   // Returns true if the given object is of this type.
 *   // example: foam.String.isInstance('hello') -> true
 *   isInstance(o) -> Boolean
 *
 *   // Returns a deep clone of o, if the type supports it.
 *   clone(o);
 *
 *   // Returns true if a and b are equivalent.
 *   equals(a, b) -> Boolean
 *
 *   // Returns -1, 0 or 1 as a comparsion of the two types.
 *   // -1 means that 'a' is considered smaller that 'b'
 *   // 0 means that and 'a' and 'b' are considered equivalent
 *   // 1 means that 'a' is considered larger than 'b'
 *   compare(a, b) -> Int
 *
 *   // Returns a hash of 'a' useful for hash tables
 *   hashCode(a) -> Int
 *
 *   // Returns true if the two values are the same instance
 *   // or the same value for primitive types.
 *   is(a, b) -> Boolean
 * }
 */

foam.LIB({
  name: 'foam.Undefined',
  methods: [
    function isInstance(o) { return o === undefined; },
    function is(a, b) { return b === undefined; },
    function clone(o) { return o; },
    function equals(_, b) { return b === undefined; },
    function compare(_, b) { return b === undefined ? 0 : 1; },
    function hashCode() { return -2; }
  ]
});


foam.LIB({
  name: 'foam.Null',
  methods: [
    function isInstance(o) { return o === null; },
    function is(a, b) { return b === null; },
    function clone(o) { return o; },
    function equals(_, b) { return b === null; },
    function compare(_, b) { return b === null ? 0 : 1; },
    function hashCode() { return -3; }
  ]
});


foam.LIB({
  name: 'foam.Boolean',
  methods: [
    function isInstance(o) { return typeof o === 'boolean'; },
    function is(a, b) { return a === b; },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      if ( ! foam.Boolean.isInstance(b) ) return 1;
      return a ? (b ? 0 : 1) : (b ? -1 : 0);
    },
    function hashCode(o) { return o ? 1 : -1; }
  ]
});


foam.LIB({
  name: 'foam.Function',
  methods: [
    function isInstance(o) { return typeof o === 'function'; },
    function is(a, b) { return a === b },
    function clone(o) { return o; },
    function equals(a, b) { return b ? a.toString() === b.toString() : false; },
    function compare(a, b) {
      if ( ! foam.Function.isInstance(b) ) return 1;
      return b ? foam.String.compare(a.toString(), b.toString()) :  1;
    },
    function hashCode(o) { return foam.String.hashCode(o.toString()); },

    /* istanbul ignore next */
    function bind(f, that, a1, a2, a3, a4) {
      /**
       * Faster than Function.prototype.bind
       */
      switch ( arguments.length ) {
        case 1:
          console.error('No arguments given to bind to.');
          break;
        case 2: return function() { return f.apply(that, arguments); };
        case 3: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1);
            case 1: return f.call(that, a1, b1);
            case 2: return f.call(that, a1, b1, b2);
            case 3: return f.call(that, a1, b1, b2, b3);
            case 4: return f.call(that, a1, b1, b2, b3, b4);
          }
        };
        case 4: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2);
            case 1: return f.call(that, a1, a2, b1);
            case 2: return f.call(that, a1, a2, b1, b2);
            case 3: return f.call(that, a1, a2, b1, b2, b3);
            case 4: return f.call(that, a1, a2, b1, b2, b3, b4);
          }
        };
        case 5: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2, a3);
            case 1: return f.call(that, a1, a2, a3, b1);
            case 2: return f.call(that, a1, a2, a3, b1, b2);
            case 3: return f.call(that, a1, a2, a3, b1, b2, b3);
            case 4: return f.call(that, a1, a2, a3, b1, b2, b3, b4);
          }
        };
        case 6: return function(b1, b2, b3, b4) {
          switch ( arguments.length ) {
            case 0: return f.call(that, a1, a2, a3, a4);
            case 1: return f.call(that, a1, a2, a3, a4, b1);
            case 2: return f.call(that, a1, a2, a3, a4, b1, b2);
            case 3: return f.call(that, a1, a2, a3, a4, b1, b2, b3);
            case 4: return f.call(that, a1, a2, a3, a4, b1, b2, b3, b4);
          }
        };
      }

      console.error('Attempt to foam.Function.bind more than 4 arguments.');
    },

    /**
     * Decorates the function 'f' to cache the return value of 'f' when
     * called in the future. Also known as a 'thunk'.
     */
    function memoize0(/* Function */ f) {
      var set = false, cache;
      var ret = foam.Function.setName(
          function() {
            if ( ! set ) {
              set = true;
              cache = f();
            }
            return cache;
          },
          'memoize0(' + f.name + ')');
      ret.toString = function() { return f.toString(); };
      return ret;
    },

    /**
     * Decorates the function 'f' to cache the return value of 'f' when called
     * with a particular value for its first argument.
     */
    function memoize1(/* Function */ f) {
      var cache = {}, nullCache, undefinedCache;
      var ret = foam.Function.setName(
          function(key) {
            foam.assert(
                arguments.length === 1,
                'Memoize1\'ed functions must take exactly one argument.');

            var mKey =
                key === null      ? '___null___'      :
                key === undefined ? '___undefined___' :
                key ;

            if ( ! cache.hasOwnProperty(mKey) ) cache[mKey] = f.call(this, key);

            return cache[mKey];
          },
          'memoize1(' + f.name + ')');
        ret.toString = function() { return f.toString(); };
        return ret;
    },

    /**
     * Set a function's name for improved debugging and profiling
     *
     * Returns the given function.
     */
    function setName(f, name) {
      Object.defineProperty(f, 'name', { value: name, configurable: true });
      return f;
    },

    /** Convenience method to append 'arguments' onto a real array **/
    function appendArguments(a, args, start) {
      start = start || 0;
      for ( var i = start ; i < args.length ; i++ ) a.push(args[i]);
      return a;
    },

    /** Finds the function(...) declaration arguments part. Strips newlines. */
    function argsStr(f) {
      var str = f.
          toString().
          replace(/(\r\n|\n|\r)/gm,'');
      var isArrowFunction = str.indexOf('function') !== 0;

      var match = isArrowFunction ?
          // (...args...) => ...
          // or
          // arg => ...
          match = str.match(/^(\(([^)]*)\)[^=]*|([^=]+))=>/) :
          // function (...args...) { ...body... }
          match = str.match(/^function(\s+[_$\w]+|\s*)\((.*?)\)/);

      if ( ! match ) {
        /* istanbul ignore next */
        throw new TypeError("foam.Function.argsStr could not parse input function:\n" + ( f ? f.toString() : 'undefined' ) );
      }

      return isArrowFunction ? (match[2] || match[1] || '') : (match[2] || '');
    },

    function argNames(f) {
      /**
       * Return a function's arguments as an array.
       * Ex. argNames(function(a,b) {...}) === ['a', 'b']
       **/
      var args = foam.Function.argsStr(f);
      args += ',';

      var ret = [];
      // [ ws /* anything */ ] ws [...]arg_name ws [ /* anything */ ],
      var argMatcher = /(\s*\/\*.*?\*\/)?\s*((?:\.\.\.)?[\w_$]+)\s*(\/\*.*?\*\/)?\s*\,+/g;
      var typeMatch;
      while ( ( typeMatch = argMatcher.exec(args) ) !== null ) {
        ret.push(typeMatch[2]);
      }
      return ret;
    },

    /** Finds the function(...) declaration and finds the first block comment
      in the function body. */
    function functionComment(f) {
      var match = f.
          toString().
          replace(/\n/g, '_#_%_%_'). // fake newlines
          match(/^function(\s+[_$\w]+|\s*)\(.*?\)(?:\_\#\_\%\_\%\_|\s)*\{(?:\_\#\_\%\_\%\_|\s)*\/\*\*?\s*(.*?)\*?\*\/.*\}/);
      if ( ! match ) {
        return '';
      } else {
        return match[2] && match[2].replace(/_#_%_%_/g, '\n') || '';
      }
    },

    /**
     * Calls fn, and provides the arguments to fn by looking
     * up their names on source. The 'this' context is either
     * source, or opt_self if provided.
     *
     * If the argument maps to a function on source, it is bound to source.
     *
     * Ex.
     * var a = {
     *   name: 'adam',
     *   hello: function() {
     *     console.blog('Hello ' + this.name);
     *   }
     * };
     * function foo(name, hello) {
     *   console.log('Name is ' + name);
     *   hello();
     * }
     * foam.Function.withArgs(foo, a);
     *
     * Outputs:
     * Name is adam
     * Hello adam
     *
     **/
    function withArgs(fn, source, opt_self) {
      var argNames = foam.Function.argNames(fn);
      var args = [];
      for ( var i = 0 ; i < argNames.length ; i++ ) {
        var a = source[argNames[i]];
        if ( typeof a === 'function' ) a = a.bind(source);
        args.push(a);
      }
      return fn.apply(opt_self || source, args);
    },

    function closure(fn) {
      /**
         Create a closure which still serializes to its definition.

         var f = foam.Function.closure(function() { var i = 0; return function() { return i++; } });
         f(); -> 0
         f(); -> 1
         f.toString(); -> "foam.Function.closure(function () { var i = 0; return function() { return i++; } })"
      */
      var ret = fn();

      ret.toString = function() { return 'foam.Function.closure(' + fn.toString() + ')'; };

      return ret;
    }
  ]
});


/* istanbul ignore next */
(function() {
  // Disable setName if not supported on this platform.
  try {
    foam.Function.setName(function() {}, '');
  } catch (x) {
    console.warn('foam.Function.setName is not supported on your platform. ' +
                 'Stack traces will be harder to decipher, but no ' +
                 'functionality will be lost');
    foam.LIB({
      name: 'foam.Function',
      methods: [
        function setName(f) { return f; }
      ]
    });
  }
})();


foam.LIB({
  name: 'foam.Number',
  methods: [
    function isInstance(o) { return typeof o === 'number'; },
    function is(a, b) { return foam.Number.compare(a, b) == 0; },
    function clone(o) { return o; },
    function equals(a, b) { return foam.Number.compare(a, b) == 0; },
    function compare(a, b) {
      if ( ! foam.Number.isInstance(b) || ( isNaN(a) && ! isNaN(b)) ) return 1;
      if ( ! isNaN(a) && isNaN(b) ) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    },
    (function() {
      var bufForHash = new ArrayBuffer(8);
      var floatArrayForHash = new Float64Array(bufForHash);
      var intArrayForHash = new Int32Array(bufForHash);

      return function hashCode(n) {
        if (Number.isInteger(n)) return n & n; // Truncate to 32 bits.

        floatArrayForHash[0] = n;
        var hash = ((intArrayForHash[0] << 5) - intArrayForHash[0]) +
            intArrayForHash[1];
        return hash & hash; // Truncate to 32 bits.
      };
    })()
  ]
});


foam.LIB({
  name: 'foam.String',
  methods: [
    function isInstance(o) { return typeof o === 'string'; },
    function is(a, b) { return a === b; },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      if ( ! foam.String.isInstance(b) ) return 1;
      return b != null ? a.localeCompare(b) : 1 ;
    },
    function hashCode(s) {
      var hash = -4;

      for ( var i = 0 ; i < s.length ; i++ ) {
        var code = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash &= hash; // Truncate to 32 bits.
      }

      return hash;
    },
    {
      name: 'constantize',
      code: foam.Function.memoize1(function(/* String */ str) {
        // switches from from camelCase to CAMEL_CASE
        return str.replace(/([a-z])([^0-9a-z_])/g, '$1_$2').toUpperCase();
      })
    },
    {
      name: 'labelize',
      code: foam.Function.memoize1(function(/* String= */ str) {
        if ( str === '' || str === null || foam.Undefined.isInstance(str) ) return '';

        return this.capitalize(str.replace(/[a-z][A-Z]/g, function(a) {
          return a.charAt(0) + ' ' + a.charAt(1);
        }));
      })
    },
    {
      name: 'capitalize',
      code: foam.Function.memoize1(function(str) {
        foam.assert(typeof str === 'string',
            'Cannot capitalize non-string values.');
        // switchFromProperyName to //SwitchFromPropertyName
        return str[0].toUpperCase() + str.substring(1);
      })
    },
    {
      /**
       * Takes a key and creates a slot name for it.  Generally key -> key + '$'.
       *
       * For example, if an object has a property called myProperty, the slot
       * name for that will be myProperty$.
       */
      name: 'toSlotName',
      code: foam.Function.memoize1(function toSlotName(key) {
        foam.assert(
            typeof key === 'string',
            'Cannot toSlotName non-string values.  Attempted: ', key);

        return key + '$';
      })
    },
    {
      name: 'toUpperCase',
      code: foam.Function.memoize1(function(str) {
        foam.assert(
            typeof str === 'string',
            'Cannot toUpperCase non-string values.');

        return str.toUpperCase();
      })
    },
    {
      name: 'cssClassize',
      code: foam.Function.memoize1(function(str) {
        foam.assert(typeof str === 'string',
            'Cannot cssClassize non-string values.');
        // Turns foam.u2.Foo into foam-u2-Foo
        return str.replace(/\./g, '-');
      })
    },
    function pad(obj, size) {
      // Right pads to size if size > 0, Left pads to -size if size < 0
      return size < 0 ?
        (new Array(-size).join(' ') + obj).slice(size)       :
        (obj + new Array(size).join(' ')).substring(0, size) ;
    },
    function multiline(f) {
      // Function for returning multi-line strings from commented functions.
      // Ex. var str = multiline(function() { /* multi-line string here */ });
      if ( typeof f === 'string' ) return f;
      var s     = f.toString();
      var start = s.indexOf('/*');
      var end   = s.lastIndexOf('*/');
      return ( start >= 0 && end >= 0 ) ? s.substring(start + 2, end) : '';
    },
    function startsWithIC(a, b) {
      foam.assert(typeof a === 'string' && typeof b === 'string',
          'Cannot startsWithIC non-string values.');

      return a.toUpperCase().startsWith(b.toUpperCase());
    },
    (function() {
      var map = {};

      return function intern(val) {
        /** Convert a string to an internal canonical copy. **/
        return map[val] || (map[val] = val.toString());
      };
    })(),
  ]
});


foam.LIB({
  name: 'foam.Array',
  methods: [
    function isInstance(o) { return Array.isArray(o); },
    function is(a, b) { return a === b; },
    function clone(o) {
      /** Returns a deep copy of this array and its contents. */
      var ret = new Array(o.length);
      for ( var i = 0 ; i < o.length ; i++ ) {
        ret[i] = foam.util.clone(o[i]);
      }
      return ret;
    },
    function diff(a, b) {
      /** Finds elements added (found in other, not in this) and removed
          (found in this, not in other). Repeated values are treated
          as separate elements, but ordering changes are ignored. */
      var added = b.slice(0);
      var removed = [];
      for ( var i = 0 ; i < a.length ; i++ ) {
        for ( var j = 0 ; j < added.length ; j++ ) {
          if ( foam.util.equals(a[i], added[j]) ) {
            added.splice(j, 1);
            j--;
            break;
          }
        }
        if ( j === added.length ) removed.push(a[i]);
      }
      return { added: added, removed: removed };
    },
    function equals(a, b) {
      if ( ! b || ! Array.isArray(b) || a.length !== b.length ) return false;
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( ! foam.util.equals(a[i], b[i]) ) return false;
      }
      return true;
    },
    function compare(a, b) {
      if ( ! b || ! Array.isArray(b) ) return 1;
      var l = Math.min(a.length, b.length);
      for ( var i = 0 ; i < l ; i++ ) {
        var c = foam.util.compare(a[i], b[i]);
        if ( c ) return c;
      }
      return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
    },
    function hashCode(a) {
      var hash = -5;

      for ( var i = 0 ; i < a.length ; i++ ) {
        hash = ((hash << 5) - hash) + foam.util.hashCode(a[i]);
      }

      return hash;
    },
    function remove(a, o) {
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( o === a[i] ) {
          a.splice(i, 1);
        }
      }
    }
  ]
});


foam.LIB({
  name: 'foam.Date',
  methods: [
    function isInstance(o) { return o instanceof Date; },
    function is(a, b) { return a === b; },
    function clone(o) { return new Date(o); },
    function getTime(d) { return ! d ? 0 : d.getTime ? d.getTime() : d ; },
    function equals(a, b) { return this.getTime(a) === this.getTime(b); },
    function compare(a, b) {
      if ( ! foam.Date.isInstance(b) ) return 1;
      return foam.Number.compare(this.getTime(a), this.getTime(b));
    },
    // Hash n & n: Truncate to 32 bits.
    function hashCode(d) { var n = d.getTime(); return n & n; },
    function relativeDateString(date) {
      // FUTURE: make this translatable for i18n, including plurals
      //   "hours" vs. "hour"
      var seconds = Math.trunc( ( Date.now() - date.getTime() ) / 1000 );

      if ( seconds >= 0 && seconds < 60 ) return 'moments ago';
      if ( seconds < 0  && seconds > -60 ) return 'in moments';

      var minutes = Math.trunc((seconds) / 60);

      if ( minutes === 1 ) return '1 minute ago';
      if ( minutes === -1 ) return 'in 1 minute';

      if ( minutes >= 0 && minutes < 60 ) return minutes + ' minutes ago';
      if ( minutes < 0  && minutes > -60 ) return 'in ' + -minutes + ' minutes';

      var hours = Math.trunc(minutes / 60);
      if ( hours === 1 ) return '1 hour ago';
      if ( hours === -1 ) return 'in 1 hour';

      if ( hours >= 0 && hours < 24 ) return hours + ' hours ago';
      if ( hours <  0 && hours > -24 ) return 'in ' + -hours + ' hours';

      var days = Math.trunc(hours / 24);
      if ( days === 1 ) return '1 day ago';
      if ( days === -1 ) return 'in 1 day';

      if ( days >= 0 && days < 7 ) return days + ' days ago';
      if ( days <  0 && days > -7 ) return 'in ' + -days + ' days';

      if ( days >= 0 && days < 365 || days < 0 && days > -365 ) {
        var year = 1900 + date.getYear();
        var noyear = date.toDateString().replace(' ' + year, '');
        return noyear.substring(4);
      }

      return date.toDateString().substring(4);
    }
  ]
});


// An FObject is a FOAM-Object, the root class for all modeled classes.
foam.LIB({
  name: 'foam.core.FObject',
  methods: [
    // Can't be an FObject yet because we haven't built the class system yet
    /* istanbul ignore next */
    function isInstance(o) { return false; },
    function clone(o)      { return o ? o.clone() : this; },
    function is(a, b)      { return a === b; },
    function diff(a, b)    { return a.diff(b); },
    function equals(a, b)  { return a.equals(b); },
    function compare(a, b) {
      if ( ! foam.core.FObject.isInstance(b) ) return 1;
      return a.compareTo(b);
    },
    function hashCode(o)   { return o.hashCode(); }
  ]
});


// AN Object is a Javascript Object which is neither an FObject nor an Array.
foam.LIB({
  name: 'foam.Object',
  methods: [
    function forEach(obj, f) {
      for ( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) f(obj[key], key);
      }
    },
    function is(a, b) { return a === b; },
    function isInstance(o) {
      return typeof o === 'object' && ! Array.isArray(o) &&
          ! foam.core.FObject.isInstance(o);
    },
    function clone(o) { return o; },
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      if ( ! foam.Object.isInstance(b) ) return 1;
      return foam.Number.compare(a.$UID, b ? b.$UID : -1);
    },
    function hashCode(o) {
      var hash = 19;
      for ( var key in o ) {
        if ( ! o.hasOwnProperty(key) ) continue;
        hash = ((hash << 5) - hash) + foam.util.hashCode(o[key]);
      }
      return hash;
    },
    function freeze(o) {
      // Force $UID creation before freezing because it can't
      // be added to the object after it's frozen.
      o.$UID__ = foam.next$UID();
      Object.freeze(o);
    }
  ]
});


/**
  Return the flyweight 'type object' for the provided object.
  Any value is a valid argument, including null and undefined.
*/
foam.typeOf = (function() {
  var tNumber    = foam.Number;
  var tString    = foam.String;
  var tUndefined = foam.Undefined;
  var tNull      = foam.Null;
  var tBoolean   = foam.Boolean;
  var tArray     = foam.Array;
  var tDate      = foam.Date;
  var tFObject   = foam.core.FObject;
  var tFunction  = foam.Function;
  var tObject    = foam.Object;

  return function typeOf(o) {
    if ( tNumber.isInstance(o) )    return tNumber;
    if ( tString.isInstance(o) )    return tString;
    if ( tUndefined.isInstance(o) ) return tUndefined;
    if ( tNull.isInstance(o) )      return tNull;
    if ( tBoolean.isInstance(o) )   return tBoolean;
    if ( tArray.isInstance(o) )     return tArray;
    if ( tDate.isInstance(o) )      return tDate;
    if ( tFunction.isInstance(o) )  return tFunction;
    if ( tFObject.isInstance(o) )   return tFObject;
    return tObject;
  };
})();

/**
  Defining an ordinal property to establish a precedence
  in which items should be compared in. Items are arranged
  by complexity of the type.
*/

foam.core.FObject.ordinal = 0;
foam.Date.ordinal = 1;
foam.Object.ordinal = 2;
foam.Function.ordinal = 3;
foam.Array.ordinal = 4;
foam.String.ordinal = 5;
foam.Number.ordinal = 6;
foam.Boolean.ordinal = 7;
foam.Null.ordinal = 8;
foam.Undefined.ordinal = 9;

foam.LIB({
  name: 'foam',

  methods: [
    function mmethod(map, opt_defaultMethod) {
      var uid = '__mmethod__' + foam.next$UID() + '__';

      var first = true;
      return function(arg1) {
        if ( first ) {
          for ( var key in map ) {
            var type = key === 'FObject' ?
                foam.core.FObject :
                foam[key] || foam.lookup(key);

            type[uid] = map[key];
          }
          first = false;
        }

        var type = arg1 && arg1.cls_ && arg1.cls_[uid] ?
            arg1.cls_ :
            foam.typeOf(arg1) ;

        if ( ! opt_defaultMethod ) {
          foam.assert(type, 'Unknown type: ', arg1,
              'and no default method provided');
          foam.assert(
              type[uid],
              'Missing multi-method for type ', arg1, ' map: ', map,
              'and no deafult method provided');
        }
        return ( type[uid] || opt_defaultMethod ).apply(this, arguments);
      };
    }
  ]
});


(function() {
  var typeOf = foam.typeOf;

  foam.LIB({
    name: 'foam.util',

    methods: [
      function clone(o)      { return typeOf(o).clone(o); },
      function equals(a, b)  { return typeOf(a).equals(a, b); },
      function is(a, b) {
        var aType = typeOf(a);
        var bType = typeOf(b);
        return aType === bType && aType.is(a, b);
      },
      function compare(a, b) {
        // To ensure that symmetry is present when comparing,
        // we will always use the comparator of higher precedence.
        var aType = typeOf(a);
        var bType = typeOf(b);
        return aType.ordinal > bType.ordinal ? 1 :
            aType.ordinal < bType.ordinal ? -1 : aType.compare(a, b);
      },
      function hashCode(o)   { return typeOf(o).hashCode(o); },
      function diff(a, b)    {
        var t = typeOf(a);
        return t.diff ? t.diff(a, b) : undefined;
      }
    ]
  });
})();


foam.LIB({
  name: 'foam.package',
  methods: [
    /**
     * Registers the given class in the global namespace.
     * If the given class has an id of 'some.package.MyClass'
     * then the class object will be made available globally at
     * global.some.package.MyClass.
     */
    function registerClass(cls) {
      foam.assert(typeof cls === 'object',
          'cls must be an object');
      foam.assert(typeof cls.name === 'string' && cls.name !== '',
          'cls must have a non-empty string name');

      var pkg = foam.package.ensurePackage(global, cls.package);
      pkg[cls.name] = cls;
    },

    /**
     * Register a class lazily in the global namespace.
     * The class is not created until accessed the first time.
     * The provided factory function creates the class.
     */
    function registerClassFactory(m, thunk) {
      var pkg = foam.package.ensurePackage(global, m.package);
      Object.defineProperty(pkg, m.name, {get: thunk, configurable: true});
    },

    /**
     * Walk a dot separated path starting at root, creating empty
     * objects if necessary.
     *
     * ensurePackage(global, 'some.dot.separated.path');
     * will ensure that global.some.dot.separated.path exists with
     * each part being a JS object.
     *
     * Returns root if path is null or undefined.
     */
    function ensurePackage(root, path) {
      if ( path === null ||
           path === undefined ||
           path === '' ) {
        return root;
      }

      foam.assert(typeof path === 'string',
          'Cannot make a package path of a non-string');

      path = path.split('.');
      var node = root;

      for ( var i = 0 ; i < path.length ; i++ ) {
        node = node[path[i]] || ( node[path[i]] = {} );
      }

      return node;
    }
  ]
});


foam.LIB({
  name: 'foam.uuid',
  methods: [
    function randomGUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString(16);
      });
    }
  ]
});


foam.LIB({
  name: 'foam.compare',
  methods: [
    function toCompare(c) {
      return foam.Array.isInstance(c)    ? foam.compare.compound(c) :
             foam.Function.isInstance(c) ? { compare: c} :
             c ;
    },

    function compound(args) {
      /* Create a compound comparator from an array of comparators. */
      var cs = args.map(foam.compare.toCompare);
      if ( cs.lengh === 1 ) return cs[0];

      var f = {
        compare: function(o1, o2) {
          for ( var i = 0 ; i < cs.length ; i++ ) {
            var r = cs[i].compare(o1, o2);
            if ( r != 0 ) return r;
          }
          return 0;
        }
      };

      return f;
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * Event listener utilities.
 */
foam.LIB({
  name: 'foam.events',

  methods: [
    function oneTime(listener) {
      /** Create a "one-time" listener which unsubscribes itself when called. **/
      return function(subscription) {
        subscription.detach();
        listener.apply(this, Array.from(arguments));
      };
    },

    function consoleLog(listener) {
      /** Log all listener invocations to console. **/
      return function() {
        var args = Array.from(arguments);
        console.log(args);
        listener && listener.apply(this, args);
      };
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * Context Support
 *
 * Contexts, also known as frames, scopes or environments, are used to store
 * named resources. They provide an object-oriented replacement for global
 * variables. Contexts are immutable. New bindings are added by creating
 * "sub-contexts" with new bindings, from an existing parent context.
 * Sub-contexts inherit bindings from their parent.
 *
 * Contexts provide a form of inversion-of-control or dependendency-injection.
 * Normally, contexts are not explicitly used because FOAM's imports/exports
 * mechanism provides a high-level declarative method of dependency management
 * which hides their use.
 *
 * foam.__context__ references the root context, which is the ancestor of all other
 * contexts.
 */

(function() {
  var __context__ = {
    /**
     * Lookup a class in the context.  Throws an exception if the value
     * couldn't be found, unless opt_suppress is true.
     *
     * @param id The id of the class to lookup.
     * @param opt_suppress Suppress throwing an error.
     **/
    lookup: function(id, opt_suppress) {
      var ret = typeof id === 'string' && this.__cache__[id];

      if ( ! opt_suppress ) {
        foam.assert(
            ret,
            'Could not find any registered class for ' + id);
      }

      return foam.Function.isInstance(ret) ? ret() : ret;
    },

    /**
     * Register a class into the given context.  After registration
     * the class can be found again by calling foam.lookup('com.foo.SomeClass');
     *
     * @param cls    The class to register.
     * @param opt_id Optional id under which to register class.
     */
    register: function(cls, opt_id) {
      foam.assert(
        typeof cls === 'object',
        'Cannot register non-objects into a context.');

      if ( opt_id ) {
        this.registerInCache_(cls, this.__cache__, opt_id);
      } else {
        foam.assert(
            typeof cls.id === 'string',
            'Must have an .id property to be registered in a context.');

        this.registerInCache_(cls, this.__cache__, cls.id);

        if ( cls.package === 'foam.core' ) {
          this.registerInCache_(cls, this.__cache__, cls.name);
        }
      }
    },

    /**
     * Register a class factory into the given context.
     * When the class is first accessed the factory is used
     * to create the value which is used.
     */
    registerFactory: function(m, factory) {
      foam.assert(
        typeof m.id === 'string',
        'Must have an .id property to be registered in a context.');

      this.registerInCache_(factory, this.__cache__, m.id);

      if ( m.package === 'foam.core' ) {
        this.registerInCache_(factory, this.__cache__, m.name);
      }
    },

    /**
     * Returns true if the model ID has been registered. False otherwise.
     */
    isRegistered: function(modelId) {
      return !! this.__cache__[modelId];
    },

    /** Internal method to register a context binding in an internal cache */
    registerInCache_: function registerInCache_(cls, cache, name) {
      var hasOld = Object.prototype.hasOwnProperty.call(cache, name);
      var old = cache[name];

      // Okay to replace a function with an actual class.
      // This happens after a lazy class is initialized.
      foam.assert(
          ! hasOld ||
              (foam.Function.isInstance(old) && ! foam.Function.isInstance(cls)),
          name + ' is already registered in this context.');

      cache[name] = cls;
    },

    /** Internal method to create a slot name for a specified key. */
    toSlotName_: foam.Function.memoize1(function toSlotName_(key) {
      return key + '$';
    }),

    /**
     * Creates a sub context of the context that this is called upon.
     * @param opt_args A map of bindings to set up in the sub context.
     *     Currently unused.
     */
    createSubContext: function createSubContext(opt_args, opt_name) {
      if ( ! opt_args ) return this;

      foam.assert(
          opt_name === undefined || typeof opt_name === 'string',
          'opt_name must be left undefined or be a string.');

      var sub = Object.create(this);

      if ( opt_name ) {
        Object.defineProperty(sub, 'NAME', {
          value: opt_name,
          enumerable: false
        });
      }

      for ( var key in opt_args ) {
        if ( opt_args.hasOwnProperty(key) ) {
          var v = opt_args[key];

          if ( ! foam.core.Slot.isInstance(v) ) {
            Object.defineProperty(sub, this.toSlotName_(key), {
              value: foam.core.ConstantSlot.create({ value: v })
            });

            Object.defineProperty(sub, key, {
              value: v
            });
          } else {
            Object.defineProperty(sub, this.toSlotName_(key), {
              value: v
            });

            (function(v) {
              Object.defineProperty(sub, key, {
                get: function() { return v.get(); },
                enumerable: false
              });
            })(v);
          }
        }
      }

      Object.defineProperty(sub, '__cache__', {
        value: Object.create(this.__cache__),
        enumerable: false
      });

      foam.Object.freeze(sub);

      return sub;
    }
  };

  Object.defineProperty(__context__, '__cache__', {
    value: {},
    enumerable: false
  });

  // Create short-cuts for foam.__context__.[createSubContext, register, lookup]
  // in foam.
  foam.lookup = function(id, opt_suppress) {
    return foam.__context__.lookup(id, opt_suppress);
  };
  foam.register = function(cls, opt_id) {
    foam.__context__.register(cls, opt_id);
  };
  foam.createSubContext = function(opt_args, opt_name) {
    return foam.__context__.createSubContext(opt_args, opt_name);
  };

  foam.__context__ = __context__;
})();
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 FOAM Bootstrap
<p>
 FOAM uses Models to specify class definitions.
 The FOAM Model class is itself specified with a FOAM model, meaning
 that Model is defined in the same language which it defines.
 This self-modeling system requires some care to bootstrap, but results
 in a very compact, uniform, and powerful system.
<pre>

 FObject -> FObject Class                     Prototype
    ^                        +-.prototype---------^
    |                        |                    |
  Model  -> buildClass()  -> Class -> create() -> instance
</pre>
  FObject is the root model/class of all other classes, including Model.
  Abstract Class is the prototype of FObject's Class, which makes it the root of all Classes.
  From a Model we call buildClass() to create a Class (or the previously created Class) object.
  From the Class we call create() to create new instances of that class.
  New instances extend the classes prototype object, which is stored on the class as .prototype.
<pre>
  instance ---> .cls_   -> Object's Class
       |
       +------> .model_ -> Object's Model
</pre>
  All descendents of FObject have references to both their Model and Class.
    - obj.cls_ refers to an Object's Class
    - obj.model_ refers to an Object's Model

<p>  Classes also refer to their Model with .model_.

<p>  Model is its own definition:
<pre>
    Model.buildClass().create(Model) == Model
    Model.model_ === Model
</pre>
  Models are defined as a collection of Axioms.
  It is the responsibility of Axioms to install itself onto a Model's Class and/or Prototype.

<p>
  Axioms are defined with the following psedo-interface:
<pre>
    public interface Axiom {
      optional installInClass(cls)
      optional installInProto(proto)
    }
</pre>
  Ex. of a Model with one Axiom:
<pre>
  foam.CLASS({
    name: 'Sample',

    axioms: [
      {
        name: 'axiom1',
        installInClass: function(cls) { ... },
        installInProto: function(proto) { ... }
      }
    ]
  });
</pre>
  Axioms can be added either during the initial creation of a class and prototype,
  or anytime after.  This allows classes to be extended with new functionality,
  and this is very important to the bootstrap process because it allows us to
  start out with very simple definitions of Model and FObject, and then build
  them up until they're fully bootstrapped.
<p>
  However, raw axioms are rarely used directly. Instead we model higher-level
  axiom types, including:
<ul>
  <li>Requires   - Require other classes
  <li>Imports    - Context imports
  <li>Exports    - Context exports
  <li>Implements - Declare interfaces implemented / mix-ins mixed-in
  <li>Constants  - Add constants to the prototype and class
  <li>Properties - High-level instance variable definitions
  <li>Methods    - Prototype methods
  <li>Topics     - Publish/sub topics
  <li>Listeners  - Like methods, but with extra features for use as callbacks
</ul>

*/


/**
 Bootstrap support.

 Is discarded after use.
*/
foam.LIB({
  name: 'foam.boot',

  constants: {
    startTime: Date.now(),
  },

  methods: [
    /**
      Create or Update a Prototype from a Model definition.

      This will be added as a method on the Model class
      when it is eventually built.

      (Model is 'this').
    */
    function buildClass() {
      var context = this.__context__ || foam.__context__;
      var cls;

      if ( this.refines ) {
        cls = context.lookup(this.refines);
        foam.assert(cls, 'Unknown refinement class: ' + this.refines);
      } else {
        foam.assert(this.id, 'Missing id name.', this.name);
        foam.assert(this.name, 'Missing class name.');

        var parent = this.extends      ?
          context.lookup(this.extends) :
          foam.core.FObject            ;

        cls                  = parent.createSubClass_();
        cls.prototype.cls_   = cls;
        cls.prototype.model_ = this;
        cls.count_           = 0;            // Number of instances created
        cls.id               = this.id;
        cls.package          = this.package;
        cls.name             = this.name;
        cls.model_           = this;

        // Install an FObject on the class that we can use as a pub/sub hub.
        // We have to do this because classes aren't FObjects.
        // This is used to publish 'installAxiom' events to, so that descendents
        // properties know when they need to be re-installed.
        if ( cls !== foam.core.FObject ) {
          cls.pubsub_ = foam.core.FObject.create();

          // Relay 'installAxiom' events from parent class.
          parent.pubsub_ && parent.pubsub_.sub(
            'installAxiom',
            function(_, a1, a2, a3) { cls.pubsub_.pub(a1, a2, a3); });
        }
      }

      cls.installModel(this);

      return cls;
    },

    function start() {
      /* Start the bootstrap process. */

      var buildClass = this.buildClass;

      // Will be replaced in phase2.
      foam.CLASS = function(m) {
        m.id = m.package + '.' + m.name;
        var cls = buildClass.call(m);

        foam.assert(
          ! m.refines,
          'Refines is not supported in early bootstrap');

        foam.register(cls);

        // Register the class in the global package path.
        foam.package.registerClass(cls);

        return cls;
      };
    },

    /** Start second phase of bootstrap process. */
    function phase2() {
      // Upgrade to final CLASS() definition.
      /* Creates a Foam class from a plain-old-object definition:
          (1) Determine the class of model for the new class's model;
          (2) Construct and validate the new class's model;
          (3) Construct and validate the new class.
          @method CLASS
          @memberof module:foam */
      foam.CLASS = function(m, skipRegistration) {
        var cls   = m.class ? foam.lookup(m.class) : foam.core.Model;
        var model = cls.create(m);
        model.validate();
        // cls was: class-for-model-construction;
        // cls is: class-constructed-from-model.
        cls = model.buildClass();
        cls.validate();

        if ( skipRegistration ) return cls;

        if ( ! m.refines ) {
          // Register class in global context.
          foam.register(cls);

          // Register the class in the global package path.
          foam.package.registerClass(cls);
        } else if ( m.name ) {
          // Register refinement id in global context.
          foam.register(cls, ( m.package || 'foam.core' ) + '.' + m.name);
        }
        // TODO(markdittmer): Identify and name anonymous refinements with:
        // else {
        //   console.warn('Refinement without unique id', cls);
        //   debugger;
        // }

        return cls;
      };

      // Upgrade existing classes to real classes.
      for ( var key in foam.core ) {
        var m = foam.lookup(key).model_;

        // classModel.buildClass() expects 'refines' if we are upgrading an
        // existing class.
        m.refines = m.id;

        foam.CLASS(m, true);
      }
    },

    function phase3() {
      // Substitute foam.core.installModel() with simpler axiom-only version.
      foam.core.FObject.installModel = function installModel(m) {
        this.installAxioms(m.axioms_);
      };
    },

    /** Finish the bootstrap process, deleting foam.boot when done. */
    function end() {
      var Model = foam.core.Model;

      // Update psedo-Models to real Models
      for ( var key in foam.core ) {
        var c = foam.core[key];
        c.prototype.model_ = c.model_ = Model.create(c.model_);
      }

      delete foam.boot;

      console.log('core boot time: ', Date.now() - this.startTime);
    }
  ]
});


foam.boot.start();
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/*
  FObject is the root of FOAM's class hierarchy.

  We define FObject twice, first as a LIB to install all of
  the static/class methods in the top-level FObject class,
  then with a CLASS below to define methods on the FObject
  prototype.

  For details on how FObject fits in to the FOAM class system,
  see the documentation in the top of Boot.js
 */
foam.LIB({
  name: 'foam.core.FObject',

  constants: {
    // Each class has a prototype object which is the prototype of all
    // instances of the class. A classes prototype extends its parent
    // classes prototype.
    prototype: {},

    // Each class has a map of Axioms added to the class.
    // Map keys are the name of the axiom.
    // The classes axiomMap_'s extends its parent's axiomMap_.
    axiomMap_: {},

    // Each class has a map of "private" variables for use by
    // axioms. Storing internal data in private_ instead of on the
    // class directly avoids name conflicts with public features of
    // the class.
    private_:  { axiomCache: {} }
  },

  methods: [
    function create(args, opt_parent) {
      /**
       * Create a new instance of this class.
       * Configured from values taken from 'args', if supplifed.
       */

      var obj = Object.create(this.prototype);

      // Increment number of objects created of this class.
      this.count_++;

      // Properties have their values stored in instance_ instead
      // of on the object directly. This lets us defineProperty on
      // the object itself so that we can add extra behaviour
      // to properties (things like preSet, postSet, firing property-
      // change events, etc.).
      obj.instance_ = {};

      // initArgs() is the standard argument extraction method.
      obj.initArgs(args, opt_parent);

      var axioms = this.getInitAgents();
      for ( var i = 0 ; i < axioms.length ; i++ ) {
        axioms[i].initObject(obj);
      }

      // init() is called when object is created.
      // This is where class-specific initialization code should
      // be put (not in initArgs).
      obj.init();

      return obj;
    },

    function createSubClass_() {
      /**
       * Used to create a sub-class of this class.  Sets up the appropriate
       * prototype chains for the class, class.prototype and axiomMap_
       *
       * The very first "subClass" that we create will be FObject itself, when
       * we define the FObject class rather than the FObject lib that we are
       * currently defining.
       *
       * So instead of actually creating a subClass, we will just return "this"
       * and replace createSubClass() on FObject to actually create real
       * sub-classes for all subsequent uses of FObject.createSubClass()
       */
      foam.core.FObject.createSubClass_ = function() {
        var cls = Object.create(this);

        cls.prototype = Object.create(this.prototype);
        cls.axiomMap_ = Object.create(this.axiomMap_);
        cls.private_  = { axiomCache: {} };

        return cls;
      };

      return this;
    },

    function getSuperClass() {
      return this.model_.__context__.lookup(this.model_.extends);
    },

    function installAxioms(axs) {
      /**
       * Install Axioms into the class and prototype.
       * Invalidate the axiom-cache, used by getAxiomsByName().
       *
       * FUTURE: Wait for first object to be created before creating prototype.
       * Currently it installs axioms into the protoype immediately, but in should
       * wait until the first object is created. This will provide
       * better startup performance.
       */
      this.private_.axiomCache = {};

      // We install in two passes to avoid ordering issues from Axioms which
      // need to access other axioms, like ids: and exports:.

      var existing = new Array(axs.length);

      for ( var i = 0 ; i < axs.length ; i++ ) {
        var a = axs[i];

        // Store the destination class in the Axiom. Used by describe().
        // Store source class on a clone of 'a' so that the Axiom can be
        // reused without corrupting the sourceCls_.
        a.sourceCls_ = this;

        if ( Object.prototype.hasOwnProperty.call(this.axiomMap_, a.name) ) {
          existing[i] = this.axiomMap_[a.name];
        }

        this.axiomMap_[a.name] = a;
      }

      for ( var i = 0 ; i < axs.length ; i++ ) {
        var a = axs[i];

        var superAxiom = this.getSuperAxiomByName(a.name);

        a.installInClass && a.installInClass(this,           superAxiom, existing[i]);
        a.installInProto && a.installInProto(this.prototype, superAxiom, existing[i]);

        if ( a.name ) {
          this.pubsub_ && this.pubsub_.pub('installAxiom', a.name, a);
        }
      }
    },

    function installAxiom(a) {
      this.installAxioms([a]);
    },

    function installConstant(key, value) {
      var cName = foam.String.constantize(key);
      var prev  = this[cName];

      // Detect constant name collisions
      if ( prev && prev.name !== key ) {
        throw 'Class constant conflict: ' +
          this.id + '.' + cName + ' from: ' + key + ' and ' + prev.name;
      }

      this.prototype[cName] = this[cName] = value;
    },

    function isInstance(o) {
      /**
       * Determine if an object is an instance of this class
       * or one of its sub-classes.
       */

      return !! ( o && o.cls_ && this.isSubClass(o.cls_) );
    },

    function isSubClass(c) {
      /**
       * Determine if a class is either this class, a sub-class, or
       * if it implements this class (directly or indirectly).
       */

      if ( ! c || ! c.id ) return false;

      // Optimize most common case and avoid creating cache
      if ( this === foam.core.FObject ) return true;

      var cache = this.private_.isSubClassCache ||
        ( this.private_.isSubClassCache = {} );

      if ( cache[c.id] === undefined ) {
        cache[c.id] = ( c === this.prototype.cls_ ) ||
          ( c.getAxiomByName && !! c.getAxiomByName('implements_' + this.id) ) ||
          this.isSubClass(c.__proto__);
      }

      return cache[c.id];
    },

    function getAxiomByName(name) {
      /**
       * Find an axiom by the specified name from either this class or an
       * ancestor.
       */
      return this.axiomMap_[name];
    },

    function getAxiomsByClass(cls) {
      /**
       * Returns all axioms defined on this class or its parent classes
       * that are instances of the specified class.
       */
      // FUTURE: Add efficient support for:
      //    .where() .orderBy() .groupBy()
      var as = this.private_.axiomCache[cls.id];
      if ( ! as ) {
        as = [];
        for ( var key in this.axiomMap_ ) {
          var a = this.axiomMap_[key];
          if ( cls.isInstance(a) ) as.push(a);
        }
        this.private_.axiomCache[cls.id] = as;
      }

      return as;
    },

    function getSuperAxiomByName(name) {
      /**
       * Find an axiom by the specified name from an ancestor.
       */
      return this.axiomMap_.__proto__[name];
    },

    function hasOwnAxiom(name) {
      /**
       * Return true if an axiom named "name" is defined on this class
       * directly, regardless of what parent classes define.
       */
      return Object.hasOwnProperty.call(this.axiomMap_, name);
    },

    function getOwnAxiomsByClass(cls) {
      /**
       * Returns all axioms defined on this class that are instances of the
       * specified class.
       */
      return this.getAxiomsByClass(cls).filter(function(a) {
        return this.hasOwnAxiom(a.name);
      }.bind(this));
    },

    function getOwnAxioms() {
      /** Returns all axioms defined on this class. */
      return this.getAxioms().filter(function(a) {
        return this.hasOwnAxiom(a.name);
      }.bind(this));
    },

    function getAxioms() {
      /** Returns all axioms defined on this class or its parent classes. */

      // The full axiom list is stored in the regular cache with '' as a key.
      var as = this.private_.axiomCache[''];
      if ( ! as ) {
        as = [];
        for ( var key in this.axiomMap_ ) as.push(this.axiomMap_[key]);
        this.private_.axiomCache[''] = as;
      }
      return as;
    },

    function getInitAgents() {
      if ( ! this.private_.initAgentsCache ) {
        this.private_.initAgentsCache = [];
        for ( var key in this.axiomMap_ ) {
          var axiom = this.axiomMap_[key];
          if (axiom.initObject) this.private_.initAgentsCache.push(axiom);
        }
      }
      return this.private_.initAgentsCache;
    },

    // NOP, is replaced if debug.js is loaded
    function validate() { },

    function toString() { return this.name + 'Class'; },

    function installModel(m) {
      /**
       * Temporary Bootstrap Implementation
       *
       * This is a temporary version of installModel.
       * When the bootstrap is finished, it will be replaced by a
       * version that only knows how to install axioms in Boot.js phase3().
       *
       * It is easier to start with hard-coded method and property
       * support because Axioms need methods to install themselves
       * and Property Axioms themselves have properties.
       *
       * However, once we've bootstrapped proper Property and Method
       * Axioms, we can remove this support and just install Axioms.
       */


      /*
        Methods can be defined using two formats.
        1. Short-form function literal:
             function foo() {
               console.log('bar');
             }

        3. Long-form JSON:
             {
               name: 'foo',
               code: function() {
                 console.log('bar');
               }
             }
           The long-form will support many options (many of which are defined
           in Method.js), but only 'name' and 'code' are mandatory.
       */
      if ( m.methods ) {
        for ( var i = 0 ; i < m.methods.length ; i++ ) {
          var a = m.methods[i];
          if ( foam.Function.isInstance(a) ) {
            var name = foam.Function.getName(a);
            m.methods[i] = a = { name: name, code: a };
          }
          if ( foam.core.Method ) {
            foam.assert(a.cls_ !== foam.core.Method,
              'Method', a.name, 'on', m.name,
              'has already been upgraded to a Method');

            a = foam.core.Method.create(a);
            this.installAxiom(a);
          } else {
            this.prototype[a.name] = a.code;
          }
        }
      }

      /*
        Properties can be defined using three formats:
        1. Short-form String:  'firstName' or 'sex'

        2. Medium-form Array:  [ 'firstName', 'John' ] or [ 'sex', 'Male' ]
           The first element of the array is the name and the second is the
           default value.

        3. Long-form JSON:     { class: 'String', name: 'sex', value: 'Male' }
           The long-form will support many options (many of which are defined
           in Property.js), but only 'name' is mandatory.
       */
      if ( foam.core.Property && m.properties ) {
        for ( var i = 0 ; i < m.properties.length ; i++ ) {
          var a = m.properties[i];

          if ( Array.isArray(a) ) {
            m.properties[i] = a = { name: a[0], value: a[1] };
          } else if ( foam.String.isInstance(a) ) {
            m.properties[i] = a = { name: a };
          }

          var type = foam.lookup(a.class, true) || foam.core.Property;
          foam.assert(
            type !== a.cls_,
            'Property', a.name, 'on', m.name,
            'has already been upgraded to a Property.');

          a = type.create(a);

          this.installAxiom(a);
        }
      }
    }
  ]
});

/**
 * The implicit base class for the FOAM class hierarchy. If you do not
 * explicitly extend another class, FObject is used.
 */
foam.CLASS({
  package: 'foam.core',
  name: 'FObject',

  // Effectively imports the following methods, but imports: isn't available
  // yet, so we add with 'methods:'.
  //
  // imports: [ 'error', 'log', 'warn' ],

  methods: [
    function init() {
      /**
       * Template init() method, basic FObject this is a no-op, but classes
       * can override this to do their own per-instance initialization
       */
    },

    function initArgs(args) {
      /**
       * This is a temporary version of initArgs.
       * When the bootstrap is finished, it will be replaced by a version
       * that knows about a classes Properties, so it can do a better job.
       */

      if ( ! args ) return;

      for ( var key in args ) this[key] = args[key];
    },

    function hasOwnProperty(name) {
      /**
       * Returns true if this object is storing a value for a property
       * named by the 'name' parameter.
       */

      return ! foam.Undefined.isInstance(this.instance_[name]);
    },

    function hasDefaultValue(name) {
      if ( ! this.hasOwnProperty(name) ) return true;

      var axiom = this.cls_.getAxiomByName(name);
      return axiom.isDefaultValue(this[name]);
    },

    function clearProperty(name) {
      /**
       * Undefine a Property's value.
       * The value will revert to either the Property's 'value' or
       * 'expression' value, if they're defined or undefined if they aren't.
       * A propertyChange event will be fired, even if the value doesn't change.
       */

      var prop = this.cls_.getAxiomByName(name);
      foam.assert(prop && foam.core.Property.isInstance(prop),
                    'Attempted to clear non-property', name);

      if ( this.hasOwnProperty(name) ) {
        var oldValue = this[name];
        this.instance_[name] = undefined;
        this.clearPrivate_(name);

        // Avoid creating slot and publishing event if nobody is listening.
        if ( this.hasListeners('propertyChange', name) ) {
          this.pub('propertyChange', name, this.slot(name));
        }
      }
    },

    function setPrivate_(name, value) {
      /**
       * Private support is used to store per-object values that are not
       * instance variables.  Things like listeners and topics.
       */
      ( this.private_ || ( this.private_ = {} ) )[name] = value;
      return value;
    },

    function getPrivate_(name) {
      return this.private_ && this.private_[name];
    },

    function hasOwnPrivate_(name) {
      return this.private_ && ! foam.Undefined.isInstance(this.private_[name]);
    },

    function clearPrivate_(name) {
      if ( this.private_ ) this.private_[name] = undefined;
    },

    function validate() {
      var as = this.cls_.getAxioms();
      for ( var i = 0 ; i < as.length ; i++ ) {
        var a = as[i];
        a.validateInstance && a.validateInstance(this);
      }
    },


    /************************************************
     * Console
     ************************************************/

    // Imports aren't implemented yet, so mimic:
    //   imports: [ 'lookup', 'assert', 'error', 'log', 'warn' ],


    // Bootstrap form replaced after this.__context__ is added.
    function lookup() { return foam.lookup.apply(foam, arguments); },

    function error() { this.__context__.error.apply(null, arguments); },

    function log() { this.__context__.log.apply(null, arguments); },

    function warn() { this.__context__.warn.apply(null, arguments); },


    /************************************************
     * Publish and Subscribe
     ************************************************/

    function createListenerList_() {
      /**
       * This structure represents the head of a doubly-linked list of
       * listeners. It contains 'next', a pointer to the first listener,
       * and 'children', a map of sub-topic chains.
       *
       * Nodes in the list contain 'next' and 'prev' links, which lets
       * removing subscriptions be done quickly by connecting next to prev
       * and prev to next.
       *
       * Note that both the head structure and the nodes themselves have a
       * 'next' property. This simplifies the code because there is no
       * special case for handling when the list is empty.
       *
       * Listener List Structure
       * -----------------------
       * next     -> {
       *   prev: <-,
       *   sub: {src: <source object>, detach: <destructor function> },
       *   l: <listener>,
       *   next: -> <same structure>,
       *   children -> {
       *     subTopic1: <same structure>,
       *     ...
       *     subTopicn: <same structure>
       *   }
       * }
       *
       * TODO: Move this structure to a foam.LIB, and add a benchmark
       * to show why we are using plain javascript objects rather than
       * modeled objects for this structure.
    */
      return { next: null };
    },

    function listeners_() {
      /**
       * Return the top-level listener list, creating if necessary.
       */
      return this.getPrivate_('listeners') ||
        this.setPrivate_('listeners', this.createListenerList_());
    },

    function notify_(listeners, a) {
      /**
       * Notify all of the listeners in a listener list.
       * Pass 'a' arguments to listeners.
       * Returns the number of listeners notified.
       */
      var count = 0;
      while ( listeners ) {
        var l = listeners.l;
        var s = listeners.sub;

        // Update 'listeners' before notifying because the listener
        // may set next to null.
        listeners = listeners.next;

        // Like l.apply(l, [s].concat(Array.from(a))), but faster.
        // FUTURE: add benchmark to justify
        // ???: optional exception trapping, benchmark
        try {
          switch ( a.length ) {
            case 0: l(s); break;
            case 1: l(s, a[0]); break;
            case 2: l(s, a[0], a[1]); break;
            case 3: l(s, a[0], a[1], a[2]); break;
            case 4: l(s, a[0], a[1], a[2], a[3]); break;
            case 5: l(s, a[0], a[1], a[2], a[3], a[4]); break;
            case 6: l(s, a[0], a[1], a[2], a[3], a[4], a[5]); break;
            case 7: l(s, a[0], a[1], a[2], a[3], a[4], a[5], a[6]); break;
            case 8: l(s, a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]); break;
            case 9: l(s, a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]); break;
            default: l.apply(l, [s].concat(Array.from(a)));
          }
        } catch (x) {}
        count++;
      }
      return count;
    },

    function hasListeners(/* args */) {
      /**
       * Return true iff there are listeners for the supplied message.
       */

      var listeners = this.getPrivate_('listeners');

      for ( var i = 0 ; listeners ; i++ ) {
        if ( listeners.next        ) return true;
        if ( i == arguments.length ) return false;
        listeners = listeners.children && listeners.children[arguments[i]];
      }

      return false;
    },

    function pub(a1, a2, a3, a4, a5, a6, a7, a8) {
      /**
       * Publish a message to all matching sub()'ed listeners.
       *
       * All sub()'ed listeners whose specified pattern match the
       * pub()'ed arguments will be notified.
       * Ex.
       * <pre>
       *   var obj  = foam.core.FObject.create();
       *   var sub1 = obj.sub(               function(a,b,c) { console.log(a,b,c); });
       *   var sub2 = obj.sub('alarm',       function(a,b,c) { console.log(a,b,c); });
       *   var sub3 = obj.sub('alarm', 'on', function(a,b,c) { console.log(a,b,c); });
       *
       *   obj.pub('alarm', 'on');  // notifies sub1, sub2 and sub3
       *   obj.pub('alarm', 'off'); // notifies sub1 and sub2
       *   obj.pub();               // only notifies sub1
       *   obj.pub('foobar');       // only notifies sub1
       * </pre>
       *
       * Note how FObjects can be used as generic pub/subs.
       *
       * Returns the number of listeners notified.
       */

      // This method prevents this function not being JIT-ed because
      // of the use of 'arguments'. Doesn't generate any garbage ([]'s
      // don't appear to be garbage in V8).
      // FUTURE: benchmark
      switch ( arguments.length ) {
        case 0:  return this.pub_([]);
        case 1:  return this.pub_([ a1 ]);
        case 2:  return this.pub_([ a1, a2 ]);
        case 3:  return this.pub_([ a1, a2, a3 ]);
        case 4:  return this.pub_([ a1, a2, a3, a4 ]);
        case 5:  return this.pub_([ a1, a2, a3, a4, a5 ]);
        case 6:  return this.pub_([ a1, a2, a3, a4, a5, a6 ]);
        case 7:  return this.pub_([ a1, a2, a3, a4, a5, a6, a7 ]);
        case 8:  return this.pub_([ a1, a2, a3, a4, a5, a6, a7, a8 ]);
        default: return this.pub_(arguments);
      }
    },

    function pub_(args) {
      /** Internal publish method, called by pub(). */

      // No listeners, so return.
      if ( ! this.hasOwnPrivate_('listeners') ) return 0;

      var listeners = this.listeners_();

      // Notify all global listeners.
      var count = this.notify_(listeners.next, args);

      // Walk the arguments, notifying more specific listeners.
      for ( var i = 0 ; i < args.length; i++ ) {
        listeners = listeners.children && listeners.children[args[i]];
        if ( ! listeners ) break;
        count += this.notify_(listeners.next, args);
      }

      return count;
    },

    function sub() { /* args..., l */
      /**
       * Subscribe to pub()'ed events.
       * args - zero or more values which specify the pattern of pub()'ed
       * events to match.
       * <p>For example:
       * <pre>
       *   sub('propertyChange', l) will match:
       *   pub('propertyChange', 'age', 18, 19), but not:
       *   pub('stateChange', 'active');
       * </pre>
       * <p>sub(l) will match all events.
       *   l - the listener to call with notifications.
       * <p> The first argument supplied to the listener is the "subscription",
       *   which contains the "src" of the event and a detach() method for
       *   cancelling the subscription.
       * <p>Returns a "subscrition" which can be cancelled by calling
       *   its .detach() method.
       */

      var l = arguments[arguments.length - 1];

      foam.assert(foam.Function.isInstance(l),
          'Listener must be a function');

      var listeners = this.listeners_();

      for ( var i = 0 ; i < arguments.length - 1 ; i++ ) {
        var children = listeners.children || ( listeners.children = {} );
        listeners = children[arguments[i]] ||
            ( children[arguments[i]] = this.createListenerList_() );
      }

      var node = {
        sub:  { src: this },
        next: listeners.next,
        prev: listeners,
        l:    l
      };
      node.sub.detach = function() {
        if ( node.next ) node.next.prev = node.prev;
        if ( node.prev ) node.prev.next = node.next;

        // Disconnect so that calling detach more than once is harmless
        node.next = node.prev = null;
      };

      if ( listeners.next ) listeners.next.prev = node;
      listeners.next = node;

      return node.sub;
    },

    function pubPropertyChange_(prop, oldValue, newValue) {
      /**
       * Publish to this.propertyChange topic if oldValue and newValue are
       * different.
       */
      if ( Object.is(oldValue, newValue) ) return;
      if ( ! this.hasListeners('propertyChange', prop.name) ) return;

      var slot = prop.toSlot(this);
      slot.setPrev(oldValue);
      this.pub('propertyChange', prop.name, slot);
    },

    function slot(obj) {
      /**
       * Creates a Slot for an Axiom.
       */
      if ( typeof obj === 'function' ) {
        return foam.core.ExpressionSlot.create(
            arguments.length === 1 ?
                { code: obj, obj: this } :
                {
                  code: obj,
                  obj: this,
                  args: Array.prototype.slice.call(arguments, 1)
                });
      }

      if ( foam.Array.isInstance(obj) ) {
        return foam.core.ExpressionSlot.create({
          obj: this,
          args: obj[0].map(this.slot.bind(this)),
          code: obj[1],
        });
      }

      var names = obj.split('$');
      var axiom = this.cls_.getAxiomByName(names.shift());

      foam.assert(axiom, 'slot() called with unknown axiom name:', obj);
      foam.assert(axiom.toSlot, 'Called slot() on unslottable axiom:', obj);

      var slot = axiom.toSlot(this)
      names.forEach(function(n) {
        slot = slot.dot(n);
      });

      return slot;
    },


    /************************************************
     * Destruction
     ************************************************/

    function onDetach(d) {
      /**
       * Register a function or a detachable to be called when this object is
       * detached.
       *
       * A detachable is any object with a detach() method.
       *
       * Does nothing is the argument is falsy.
       *
       * Returns the input object, which can be useful for chaining.
       */
      foam.assert(! d || foam.Function.isInstance(d.detach) ||
          foam.Function.isInstance(d),
          'Argument to onDetach() must be callable or detachable.');
      if ( d ) this.sub('detach', d.detach ? d.detach.bind(d) : d);
      return d;
    },

    function detach() {
      /**
       * Detach this object. Free any referenced objects and destory
       * any registered detroyables.
       */
      if ( this.instance_.detaching_ ) return;

      // Record that we're currently detaching this object,
      // to prevent infinite recursion.
      this.instance_.detaching_ = true;
      this.pub('detach');
      this.instance_.detaching_ = false;
      this.clearPrivate_('listeners');
    },


    /************************************************
     * Utility Methods: clone, equals, hashCode, etc.
     ************************************************/

    function equals(other) { return this.compareTo(other) === 0; },

    function compareTo(other) {
      if ( other === this ) return 0;
      if ( ! other        ) return 1;

      if ( this.model_ !== other.model_ ) {
        return other.model_ ?
          foam.util.compare(this.model_.id, other.model_.id) :
          1;
      }

      // FUTURE: check 'id' first
      // FUTURE: order properties
      var ps = this.cls_.getAxiomsByClass(foam.core.Property);
      for ( var i = 0 ; i < ps.length ; i++ ) {
        var r = ps[i].compare(this, other);
        if ( r ) return r;
      }

      return 0;
    },

    /**
     * Compare this object to another object of the same type, and produce a raw
     * javascript object which shows the differences between the two.
     * Example
     * <pre>
     * var obj1 = Abc.create({ a: 1, b: ['A', 'B', 'C'] });
     * var obj2 = Abc.create({ a: 2, b: ['A', 'D'] });
     * var diff = obj1.diff(obj2);
     * </pre>
     * The diff object will look like
     * <pre>
     * { a: 2, b: { added: ['D'], removed: ['B', 'C'] } };
     * </pre>
     */
    function diff(other) {
      var d = {};

      foam.assert(other, 'Attempt to diff against null.');
      foam.assert(other.cls_ === this.cls_, 'Attempt to diff objects with different classes.', this, other);

      var ps = this.cls_.getAxiomsByClass(foam.core.Property);
      for ( var i = 0, property ; property = ps[i] ; i++ ) {
        // FUTURE: move this to a refinement in case not needed?
        // FUTURE: add nested Object support
        // FUTURE: add patch() method?

        // Property adds its difference(s) to "d".
        property.diffProperty(this, other, d, property);
      }

      return d;
    },

    /**
      Create an integer hash code value based on all properties of this object.
    */
    function hashCode() {
      var hash = 17;

      var ps = this.cls_.getAxiomsByClass(foam.core.Property);
      for ( var i = 0 ; i < ps.length ; i++ ) {
        var prop = this[ps[i].name];
        hash = ((hash << 5) - hash) + foam.util.hashCode(prop);
        hash &= hash; // forces 'hash' back to a 32-bit int
      }

      return hash;
    },

    function clone(opt_X) {
      /** Create a deep copy of this object. **/
      var m = {};
      for ( var key in this.instance_ ) {
        if ( this.instance_[key] === undefined ) continue; // Skip previously cleared keys.

        var value = this[key];
        this.cls_.getAxiomByName(key).cloneProperty(value, m);
      }
      return this.cls_.create(m, opt_X || this.__context__);
    },

    /**
      Copy property values from the supplied object or map.

      Ex.
<pre>
  person.copyFrom({fName: 'John', lName: 'Smith', age: 42})
  or
  person.copyFrom(otherPerson);
</pre>
     The first example is short-form for:
<pre>
  person.fName = 'John';
  person.lName = 'Smith';
  person.age   = 42;
</pre>
     If an FObject is supplied, it doesn't need to be the same class as 'this'.
     Only properties that the two classes have in common will be copied.
     Null or undefined values are ignored.
     */
    function copyFrom(o, opt_warn) {
      if ( ! o ) return this;

      // When copying from a plain map, just enumerate the keys
      if ( o.__proto__ === Object.prototype || ! o.__proto__ ) {
        for ( var key in o ) {
          var name = key.endsWith('$') ?
              key.substring(0, key.length - 1) :
              key ;

          var a = this.cls_.getAxiomByName(name);
          if ( a && foam.core.Property.isInstance(a) ) {
            this[key] = o[key];
          } else if ( opt_warn ) {
            this.unknownArg(key, o[key]);
          }
        }
        return this;
      }

      // When copying from an object of the same class
      // We don't copy default values or the values of expressions
      // so that the unset state of those properties is preserved
      var props = this.cls_.getAxiomsByClass(foam.core.Property);

      if ( o.cls_ && ( o.cls_ === this.cls_ || o.cls_.isSubClass(this.cls_) ) ) {
        for ( var i = 0 ; i < props.length ; i++ ) {
          var name = props[i].name;

          // Only copy values that are set or have a factory.
          // Any default values or expressions will be the same
          // for each object since they are of the exact same
          // type.
          if ( o.hasOwnProperty(name) || props[i].factory ) {
            this[name] = o[name];
          }
        }
        return this;
      }

      // If the source is an FObject, copy any properties
      // that we have in common.
      if ( foam.core.FObject.isInstance(o) ) {
        for ( var i = 0 ; i < props.length ; i++ ) {
          var name = props[i].name;
          var otherProp = o.cls_.getAxiomByName(name);
          if ( otherProp && foam.core.Property.isInstance(otherProp) ) {
            this[name] = o[name];
          }
        }
        return this;
      }

      // If the source is some unknown object, we do our best
      // to copy any values that are not undefined.
      for ( var i = 0 ; i < props.length ; i++ ) {
        var name = props[i].name;
        if ( typeof o[name] !== 'undefined' ) {
          this[name] = o[name];
        }
      }
      return this;
    },

    function toString() {
      // Distinguish between prototypes and instances.
      return this.cls_.id + (
          this.cls_.prototype === this ? 'Proto' : '');
    },

    function dot(name) {
      // Behaves just like Slot.dot().  Makes it easy for creating sub-slots
      // without worrying if you're holding an FObject or a slot.
      return this[name + '$'];
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/** Class/Prototype description. */
foam.CLASS({
  package: 'foam.core',
  name: 'Model',

  documentation: 'A Class Model (description).',

  properties: [
    {
      name: 'id',
      hidden: true,
      transient: true,
      getter: function() {
        return this.package ? this.package + '.' + this.name : this.name;
      }
    },
    'package',
    'abstract',
    'name',
    {
      name: 'flags',
      factory: function() { return {}; }
    },
    {
      name: 'label',
      expression: function(name) { return foam.String.labelize(name); }
    },
    [ 'extends', 'FObject' ],
    'refines',
    { name: 'documentation', adapt: function(_, d) { return typeof d === 'function' ? foam.String.multiline(d).trim() : d; } },
    {
      // List of all axioms, including methods, properties, listeners,
      // etc. and 'axioms'.
      name: 'axioms_',
      transient: true,
      hidden: true,
      factory: function() { return []; }
    },
    {
      // List of extra axioms. Is added to axioms_.
      name: 'axioms',
      hidden: true,
      factory: function() { return []; },
      postSet: function(_, a) { this.axioms_.push.apply(this.axioms_, a); }
    },
    {
      // Is upgraded to an AxiomArray later.
      of: 'Property',
      name: 'properties'
    },
    {
      // Is upgraded to an AxiomArray later.
      of: 'Method',
      name: 'methods'
    }
  ],

  methods: [ foam.boot.buildClass ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  A Property is a high-level instance variable.

  Properties contain more information than typical variable declarations.
  Such as: label, help text, pre/post-set callbacks, default value,
  value factory, units, etc.

  When setting a Propery's value, the callback order is:
    1. adapt()
    2. assertValue()
    3. preSet()
       value updated
       property change event fired
    4. postSet()

   Unless the user has provided a customer 'setter', in which case the order is
     1. setter()

  A sub-class or refinement can include a partial Property definition which
  will override or add meta-information to the Property.
**/
foam.CLASS({
  package: 'foam.core',
  name: 'Property',
  extends: 'FObject',

  properties: [
    {
      name: 'name',
      required: true
    },
    {
      name: 'label',
      // If not provided, it defaults to the name "labelized".
      expression: function(name) { return foam.String.labelize(name); }
    },

    /* Developer-level documentation. */
    'documentation',

    /* User-level help. Could/should appear in GUI's as online help. */
    'help',

    /* Hidden properties to not appear in GUI's by default. */
    { class: 'Boolean', name: 'hidden' },

    /**
      The default-value of this property.
      A property which has never been set or has been cleared
      by setting it to 'undefined' or cleared with clearProperty()
      will have the default value.
    */
    'value',

    /**
      A factory is a function which initializes the property value
      when accessed for the first time, if not already set.
    */
    'factory',

    /**
      A function of the form:
        Object function(oldValue, newValue)
      adapt is called whenver the property is set. It's intended
      to adapt the value to the appropriate type if required.
      Adapt must return a value. It can return newValue unchanged
      if it was already the appropriate type.
    */
    'adapt',

    /**
      A function of the form:
        Object function(oldValue, newValue)
      preSet is called before the propery's value is updated.
      It can veto the value change by returning a different newValue
      (including returning oldValue to leave the property unchanged).
    */
    'preSet',

    /**
      A function of the form:
        void function(oldValue, newValue) throws Exception
      assertValue can validate newValue and throw an exception if it's an
      invalid value.
    */
    'assertValue',

    /**
      A function of the form:
        void function(oldValue, newValue)
      postSet is called after the Property's value has been updated.
    */
    'postSet',

    /**
      A dynamic function which defines this Property's value.
      Similar to 'factory', except that the function takes arguments
      which are named the same as other properties of this object.
      Whenever the values of any of the argument properties change,
      the value of this Property is invalidated. Like a regular factory,
      an invalidated property will be recalculated by calling the provided
      expression function when accessed. This makes expressions very efficient
      because the value is only recomputed when actually needed.
    */
    'expression',

    /**
      A getter function which completely replaces the normal
      Property getter process. Whenever the property is accessed, getter is
      called and its value is returned.
    */
    'getter',

    /**
      A setter function which completely replaces the normal
      Property setter process. Whenever the property is set, setter is
      called.
      A function of the form:
        void function(newValue)
    */
    'setter',

    [ 'cloneProperty', function(
      /* any // The value to clone */         value,
      /* object // Add values to this map to
         have them installed on the clone. */ cloneMap
      ) {
        /** Override to provide special deep cloning behavior. */
        cloneMap[this.name] = ( value && value.clone ) ? value.clone() :
          foam.util.clone(value);
      }
    ],

    /**
      A final Property can only be set once.
      After being set, its value is final (read-only).
    */
    'final',

    /**
      A required Property can not be set to null, undefined, 0 or "".
     */
    'required',

    [
      /**
        Called to convert a string into a value suitable for this property.
        Eg. this might convert strings to numbers, or parse RFC 2822 timestamps.
        By default it simply returns the string unchanged.
       */
      'fromString',
      function(str) { return str; }
    ],

    [
      /**
        Compare two values taken from this property.
        <p>Used by Property.compare().
        It is a property rather than a method so that it can be configured
        without subclassing.
      */
      'comparePropertyValues',
      function(o1, o2) { return foam.util.compare(o1, o2); }
    ],

    [
      'isDefaultValue',
      function(v) { return ! this.comparePropertyValues(this.value, v); }
    ],

    {
      /** Makes Properties useful as map functions. */
      name: 'f',
      transient: true,
      factory: function() {
        var name = this.name;
        return function f(o) { return o[name]; }
      }
    },

    {
      /** Makes Properties useful as comparators. */
      name: 'compare',
      transient: true,
      factory: function() {
        var comparePropertyValues = this.comparePropertyValues;
        var f = this.f;
        return function compare(o1, o2) {
          return comparePropertyValues(f(o1), f(o2));
        };
      }
    },
    // FUTURE: Move to refinement?
    {
      name: 'diffPropertyValues',
      transient: true,
      value: function(v1, v2, diff) {
        // TODO: instead of array check, have different implementation in ArrayProperty
        if ( Array.isArray(v1) ) {
          var subdiff = foam.Array.diff(v1, v2);
          if ( subdiff.added.length !== 0 || subdiff.removed.length !== 0 ) {
            diff[this.name] = subdiff;
          }
        } else if ( ! foam.util.equals(v1, v2) ) {
          // if the primary value is undefined, use the compareTo of the other
          diff[this.name] = v2;
        }
        return diff;
      }
    },
    {
      name: 'diffProperty',
      transient: true,
      value: function diffProperty(o1, o2, diff, prop) {
        return prop.diffPropertyValues(prop.f(o1), prop.f(o2), diff);
      }
    },
    {
      name: 'forClass_',
      transient: true
    }
  ],

  methods: [
    /**
      Handle overriding of Property definition from parent class by
      copying undefined values from parent Property, if it exists.
    */
    function installInClass(c, superProp, existingProp) {
      var prop = this;

      if ( superProp && foam.core.Property.isInstance(superProp) ) {
        prop = superProp.createChildProperty_(prop);

        // If properties would be shadowed by superProp properties, then
        // clear the shadowing property since the new value should
        // take precedence since it was set later.
        var es = foam.core.Property.SHADOW_MAP || {};
        for ( var key in es ) {
          var e = es[key];
          for ( var j = 0 ; j < e.length ; j++ ) {
            if ( this.hasOwnProperty(e[j]) && superProp[key] ) {
              prop.clearProperty(key);
              break;
            }
          }
        }

        c.axiomMap_[prop.name] = prop;
      }

      if ( this.forClass_ && this.forClass_ !== c.id && prop === this ) {
        // Clone this property if it's been installed before.
        prop = this.clone();
        c.axiomMap_[prop.name] = prop;
      }

      prop.forClass_ = c.id + '.' + this.name;

      // var reinstall = foam.events.oneTime(function reinstall(_,_,_,axiom) {
      //   // We only care about Property axioms.

      //   // FUTURE: we really only care about those properties that affect
      //   // the definition of the property getter and setter, so an extra
      //   // check would help eliminate extra reinstalls.

      //   // Handle special case of axiom being installed into itself.
      //   // For example foam.core.String has foam.core.String axioms for things
      //   // like "label"
      //   // In the future this shouldn't be required if a reinstall is
      //   // only triggered on this which affect getter/setter.
      //   if ( prop.cls_ === c ) {
      //     return;
      //   }

      //   if ( foam.core.Property.isInstance(axiom) ) {
      //     // console.log('**************** Updating Property: ', c.name, prop.name);
      //     c.installAxiom(prop);
      //   }
      // });

      // // If the superProp is updated, then reinstall this property
      // c.__proto__.pubsub_ && c.__proto__.pubsub_.sub(
      //   'installAxiom',
      //   this.name,
      //   reinstall
      // );

      // // If the class of this Property changes, then also reinstall
      // if (
      //   c.id !== 'foam.core.Property' &&
      //   c.id !== 'foam.core.Model'    &&
      //   c.id !== 'foam.core.Method'   &&
      //   c.id !== 'foam.core.FObject'  &&
      //   this.cls_.id !== 'foam.core.FObject'
      // ) {
      //   this.cls_.pubsub_.sub('installAxiom', reinstall);
      // }

      c.installConstant(prop.name, prop);
    },

    /**
      Install a property onto a prototype from a Property definition.
      (Property is 'this').
    */
    function installInProto(proto) {
      // Take Axiom from class rather than using 'this' directly,
      // since installInClass() may have created a modified version
      // to inherit Property Properties from a super-Property.
      var prop        = proto.cls_.getAxiomByName(this.name);
      var name        = prop.name;
      var adapt       = prop.adapt
      var assertValue = prop.assertValue;
      var preSet      = prop.preSet;
      var postSet     = prop.postSet;
      var factory     = prop.factory;
      var getter      = prop.getter;
      var value       = prop.value;
      var hasValue    = typeof value !== 'undefined';
      var slotName    = name + '$';
      var isFinal     = prop.final;
      var eFactory    = this.exprFactory(prop.expression);
      var FIP         = factory && ( prop.name + '_fip' ); // Factory In Progress
      var fip         = 0;

      // Factory In Progress (FIP) Support
      // When a factory method is in progress, the object sets a private
      // flag named by the value in FIP.
      // This allows for the detection and elimination of
      // infinite recursions (if a factory accesses another property
      // which in turn tries to access its propery) and allows for
      // the property change event to not be fired when the value
      // is first set by the factory (since the value didn't change,
      // the factory is providing its original value).
      // However, this is expensive, so we keep a global 'fip' variable
      // which indicates that the factory is already being called on any
      // object and then we only track on a per-instance basis when this
      // is on. This eliminates almost all per-instance FIP checks.

      // Property Slot
      // This costs us about 4% of our boot time.
      // If not in debug mode we should share implementations like in F1.
      //
      // Define a PropertySlot accessor (see Slot.js) for this Property.
      // If the property is named 'name' then 'name$' will access a Slot
      // for this Property. The Slot is created when first accessed and then
      // cached.
      // If the Slot is set (to another slot) the two Slots are link()'ed
      // together, meaning they will now dynamically share the same value.
      Object.defineProperty(proto, slotName, {
        get: function propertySlotGetter() {
          return prop.toSlot(this);
        },
        set: function propertySlotSetter(slot2) {
          prop.toSlot(this).linkFrom(slot2);
        },
        configurable: true,
        enumerable: false
      });

      // Define Property getter and setter based on Property properties.
      // By default, getter and setter stores instance value for property
      // in this.instance_[<name of property>],
      // unless the user provides custom getter and setter methods.

      // Getter
      // Call 'getter' if provided, else return value from instance_ if set.
      // If not set, return value from 'factory', 'expression', or
      // (default) 'value', if provided.
      var get =
        getter ? function() { return getter.call(this, prop); } :
        factory ? function factoryGetter() {
          var v = this.instance_[name];
          if ( v !== undefined ) return v;
          // Indicate the Factory In Progress state
          if ( fip > 10 && this.getPrivate_(FIP) ) {
            console.warn('reentrant factory for property:', name);
            return undefined;
          }

          var oldFip = fip;
          fip++;
          if ( oldFip === 10 ) this.setPrivate_(FIP, true);
          v = factory.call(this, prop);
          // Convert undefined to null because undefined means that the
          // value hasn't been set but it has. Setting it to undefined
          // would prevent propertyChange events if the value were cleared.
          this[name] = v === undefined ? null : v;
          if ( oldFip === 10 ) this.clearPrivate_(FIP);
          fip--;

          return this.instance_[name];
        } :
        eFactory ? function eFactoryGetter() {
          return this.hasOwnProperty(name) ? this.instance_[name]   :
                 this.hasOwnPrivate_(name) ? this.getPrivate_(name) :
                 this.setPrivate_(name, eFactory.call(this)) ;
        } :
        hasValue ? function valueGetter() {
          var v = this.instance_[name];
          return v !== undefined ? v : value ;
        } :
        function simpleGetter() { return this.instance_[name]; };

      var set = prop.setter ? prop.setter :
        ! ( postSet || factory || eFactory || adapt || assertValue || preSet || isFinal ) ?
        function simplePropSetter(newValue) {
          if ( newValue === undefined ) {
            this.clearProperty(name);
            return;
          }

          var oldValue = this.instance_[name] ;
          this.instance_[name] = newValue;
          this.pubPropertyChange_(prop, oldValue, newValue);
        }
        : factory && ! ( postSet || eFactory || adapt || assertValue || preSet || isFinal ) ?
        function factoryPropSetter(newValue) {
          if ( newValue === undefined ) {
            this.clearProperty(name);
            return;
          }

          var oldValue = this.hasOwnProperty(name) ? this[name] : undefined;

          this.instance_[name] = newValue;

          // If this is the result of a factory setting the initial value,
          // then don't fire a property change event, since it hasn't
          // really changed.
          if ( oldValue !== undefined )
            this.pubPropertyChange_(prop, oldValue, newValue);
        }
        :
        function propSetter(newValue) {
          // ???: Should clearProperty() call set(undefined)?
          if ( newValue === undefined ) {
            this.clearProperty(name);
            return;
          }

          // Getting the old value but avoid triggering factory or expression if
          // present. Factories and expressions (which are also factories) can be
          // expensive to generate, and if the value has been explicitly set to
          // some value, then it isn't worth the expense of computing the old
          // stale value.
          var oldValue =
            factory  ? ( this.hasOwnProperty(name) ? this[name] : undefined ) :
            eFactory ?
                ( this.hasOwnPrivate_(name) || this.hasOwnProperty(name) ?
                  this[name] :
                  undefined ) :
            this[name] ;

          if ( adapt ) newValue = adapt.call(this, oldValue, newValue, prop);

          if ( assertValue ) assertValue.call(this, newValue, prop);

          if ( preSet ) newValue = preSet.call(this, oldValue, newValue, prop);

          // ???: Should newValue === undefined check go here instead?

          this.instance_[name] = newValue;

          if ( isFinal ) {
            Object.defineProperty(this, name, {
              value: newValue,
              writable: false,
              configurable: true // ???: is this needed?
            });
          }

          // If this is the result of a factory setting the initial value,
          // then don't fire a property change event, since it hasn't
          // really changed.
          if ( ! factory || oldValue !== undefined )
            this.pubPropertyChange_(prop, oldValue, newValue);

          // FUTURE: pub to a global topic to support dynamic()

          if ( postSet ) postSet.call(this, oldValue, newValue, prop);
        };

      Object.defineProperty(proto, name, {
        get: get,
        set: set,
        configurable: true
      });
    },

    /** Validate an object which has this Property. */
    function validateInstance(o) {
      if ( this.required && ! o[this.name] ) {
        throw 'Required property ' +
            o.cls_.id + '.' + this.name +
            ' not defined.';
      }
    },

    /**
     * Create a factory function from an expression function.
     * Function arguments are validated in debug.js.
     **/
    function exprFactory(e) {
      if ( ! e ) return null;

      var argNames = foam.Function.argNames(e);
      var name     = this.name;

      // FUTURE: determine how often the value is being invalidated,
      // and if it's happening often, then don't unsubscribe.
      return function exportedFactory() {
        var self = this;
        var args = new Array(argNames.length);
        var subs = [];
        var l    = function() {
          if ( ! self.hasOwnProperty(name) ) {
            var oldValue = self[name];
            self.clearPrivate_(name);

            // Avoid creating slot and publishing event if no listeners
            if ( self.hasListeners('propertyChange', name) ) {
              self.pub('propertyChange', name, self.slot(name));
            }
          }
          for ( var i = 0 ; i < subs.length ; i++ ) subs[i].detach();
        };
        for ( var i = 0 ; i < argNames.length ; i++ ) {
          var slot = this.slot(argNames[i]);
          // This check was introduced to handle optional imports not having a
          // slot when the import isn't found in the context.
          if (slot) {
            var s = slot.sub(l);
            s && subs.push(s);
            args[i] = slot.get();
          }
        }
        var ret = e.apply(this, args);
        if ( ret === undefined ) this.warn('Expression returned undefined: ', e);
        return ret;
      };
    },

    /** Returns a developer-readable description of this Property. **/
    function toString() { return this.name; },

    /** Flyweight getter for this Property. **/
    function get(o) { return o[this.name]; },

    /** Flyweight setter for this Property. **/
    function set(o, value) {
      o[this.name] = value;
      return this;
    },

    /**
     * Handles property inheritance.  Builds a new version of
     * this property to be installed on classes that inherit from
     * this but define their own property with the same name as this.
     */
    function createChildProperty_(child) {
      var prop = this.clone();

      if ( child.cls_ !== foam.core.Property &&
           child.cls_ !== this.cls_ )
      {
        if ( this.cls_ !== foam.core.Property ) {
          this.warn('Unsupported change of property type from', this.cls_.id, 'to', child.cls_.id);
        }

        return child;
      }

      prop.sourceCls_ = child.sourceCls_;

      for ( var key in child.instance_ ) {
        prop.instance_[key] = child.instance_[key];
      }

      return prop;
    },

    function exportAs(obj, sourcePath) {
      /** Export obj.name$ instead of just obj.name. */

      var slot = this.toSlot(obj);

      for ( var i = 0 ; sourcePath && i < sourcePath.length ; i++ ) {
        slot = slot.dot(sourcePath[i]);
      }

      return slot;
    },

    function toSlot(obj) {
      /** Create a Slot for this Property. */
      var slotName = this.slotName_ || ( this.slotName_ = this.name + '$' );
      var slot     = obj.getPrivate_(slotName);

      if ( ! slot ) {
        slot = foam.core.internal.PropertySlot.create();
        slot.obj  = obj;
        slot.prop = this;
        obj.setPrivate_(slotName, slot);
      }

      return slot;
    }
  ]
});


/**
  A Simple Property skips the regular FOAM Property getter/setter/instance_
  mechanism. In gets installed on the CLASS as a Property constant, but isn't
  added to the prototype at all. From this point of view, it's mostly just for
  documentation. Simple Properties are used only in special cases to maximize
  performance and/or minimize memory use.
  Used for MDAO indices and Slots.

  USE WITH EXTREME CAUTION (OR NOT AT ALL).
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Simple',
  extends: 'Property',

  methods: [
    function installInProto(proto) {}
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
<p>
  Methods are only installed on the prototype.
  If the method is overriding a method from a parent class,
  then SUPER support is added.

<p>
  Ex.
<pre>
  foam.CLASS({
    name: 'Parent',
    methods: [
      // short-form
      function sayHello() { console.log('hello'); },

      // long-form
      {
        name: 'sayGoodbye',
        code: function() { console.log('goodbye'); }
      }
    ]
  });

  // Create a subclass of Parent and override the 'sayHello' method.
  // The parent classes 'sayHello' methold is called with 'this.SUPER()'
  foam.CLASS({
    name: 'Child',
    extends: 'Parent',
    methods: [
      function sayHello() { this.SUPER(); console.log('world'); }
    ]
  });

  Child.create().sayHello();
  >> hello
  >> world
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'AbstractMethod',

  properties: [
    { name: 'name', required: true },
    { name: 'code', required: false },
    'documentation',
    'returns',
    {
      name: 'args',
      factory: function() { return this.code ? foam.Function.args(this.code) : []; }
    }
  ],

  methods: [
    /**
      Decorate a method so that it can call the
      method it overrides with this.SUPER().
    */
    function override_(proto, method, superMethod) {
      if ( ! method ) return;

      // Not using SUPER, so just return original method
      if ( method.toString().indexOf('SUPER') == -1 ) return method;

      var superMethod_ = proto.cls_.getSuperAxiomByName(this.name);
      var super_;

      if ( ! superMethod_ ) {
        var name = this.name;

        // This method itself provides a false-posistive because
        // it references SUPER(), so ignore.
        if ( name !== 'override_' ) {
          super_ = function() {
            console.warn(
                'Attempted to use SUPER() in',
                name, 'on', proto.cls_.id, 'but no parent method exists.');
          };

          // Generate warning now.
          super_();
        }
      } else {
        foam.assert(foam.core.AbstractMethod.isInstance(superMethod_),
          'Attempt to override non-method', this.name, 'on', proto.cls_.id);

        // Fetch the super method from the proto, as the super method axiom
        // may have decorated the code before installing it.
        super_ = proto.__proto__[this.name];
      }

      function SUPER() { return super_.apply(this, arguments); }

      var f = function superWrapper() {
        var oldSuper = this.SUPER;
        this.SUPER = SUPER;

        try {
          return method.apply(this, arguments);
        } finally {
          this.SUPER = oldSuper;
        }

        return ret;
      };

      foam.Function.setName(f, this.name);
      f.toString = function() { return method.toString(); };

      return f;
    },

    function createChildMethod_(child) {
      /**
        Template method for use by Method subclasses.
        (Used by JavaSource.)
      */
      return child;
    },

    function installInClass(cls, superMethod, existingMethod) {
      var method = this;

      var parent = superMethod;
      if ( parent && foam.core.AbstractMethod.isInstance(parent) ) {
        method = parent.createChildMethod_(method);
      }

      cls.axiomMap_[method.name] = method;
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Method',
  extends: 'foam.core.AbstractMethod',

  methods: [
    function installInProto(proto, superAxiom) {
      proto[this.name] = this.override_(proto, this.code, superAxiom);
    },

    function exportAs(obj) {
      var m = obj[this.name];
      /** Bind the method to 'this' when exported so that it still works. **/
      return function exportedMethod() { return m.apply(obj, arguments); };
    }
  ]
});


foam.boot.phase2();
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Boolean',
  extends: 'Property',

  documentation: 'A Property for Boolean values.',

  properties: [
    [ 'value', false ],
    [ 'adapt', function adaptBoolean(_, v) { return !!v; } ]
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'AxiomArray',
  extends: 'Property',

  documentation: 'An Array of Axioms (used by Model) whose elements are added to this.axioms_.',

  properties: [
    {
      name: 'of',
      required: true
    },
    {
      name: 'adapt',
      value: function(_, a, prop) {
        if ( ! Array.isArray(a) ) return a;

        var copy;
        for ( var i = 0 ; i < a.length ; i++ ) {
          var b = prop.adaptArrayElement.call(this, a[i], prop);
          if ( b !== a[i] ) {
            if ( ! copy ) copy = a.slice();
            copy[i] = b;
          }
        }

        return copy || a;
      }
    },
    {
      name: 'assertValue',
      value: function(v, prop) {
        foam.assert(Array.isArray(v),
            'Tried to set', prop.name, 'to non array value');

        var of = this.lookup(prop.of, true);
        foam.assert(
            of,
            'Unknown "of" Model in AxiomArray: property=',
            prop.name,
            ' of=',
            prop.of);
        for ( var i = 0 ; i < v.length ; i++ ) {
          foam.assert(of.isInstance(v[i]),
              'Element', i, 'of', prop.name, 'is not an instance of',
              prop.of);
        }
      }
    },
    {
      name: 'adaptArrayElement',
      value: function(a, prop) {
        var of = this.lookup(prop.of);
        return of.isInstance(a) ? a : of.create(a, this);
      }
    },
    [ 'postSet', function(_, a) { this.axioms_.push.apply(this.axioms_, a); } ]
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * Map of Property property names to arrays of names of properties that they shadow.
 *
 * Ex. 'setter' has higher precedence than 'adapt', 'preSet', and 'postSet', so if
 * it is set, then it shadows those other properties if they are set, causing their
 * values to be ignored.
 *
 * Not defined as a constant, because they haven't been defined yet.
 */
foam.core.Property.SHADOW_MAP = {
  setter:     [ 'adapt', 'preSet', 'postSet' ],
  getter:     [ 'factory', 'expression', 'value' ],
  factory:    [ 'expression', 'value' ],
  expression: [ 'value' ]
};


/** Add new Axiom types (Implements, Constants, Topics, Properties, Methods and Listeners) to Model. */
foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Property',
      name: 'properties',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var p = foam.core.Property.create();
          p.name = o;
          return p;
        }

        if ( Array.isArray(o) ) {
          var p = foam.core.Property.create();
          p.name  = o[0];
          p.value = o[1];
          return p;
        }

        if ( o.class ) {
          var m = this.lookup(o.class);
          if ( ! m ) throw 'Unknown class : ' + o.class;
          return m.create(o, this);
        }

        return foam.core.Property.isInstance(o) ? o : foam.core.Property.create(o);
      }
    },
    {
      class: 'AxiomArray',
      of: 'Method',
      name: 'methods',
      adaptArrayElement: function(o, prop) {
        if ( typeof o === 'function' ) {
          var name = foam.Function.getName(o);
          foam.assert(name, 'Method must be named');
          var m = this.lookup(prop.of).create();
          m.name = name;
          m.code = o;
          return m;
        }
        if ( this.lookup(prop.of).isInstance(o) ) return o;
        if ( o.class ) return this.lookup(o.class).create(o, this);
        return foam.lookup(prop.of).create(o);
      }
    }
  ]
});


foam.boot.phase3();


foam.CLASS({
  refines: 'foam.core.FObject',

  documentation: 'Upgrade FObject to fully bootstraped form.',

  axioms: [
    {
      name: '__context__',
      installInProto: function(p) {
        Object.defineProperty(p, '__context__', {
          get: function() {
            var x = this.getPrivate_('__context__');
            if ( ! x ) {
              var contextParent = this.getPrivate_('contextParent');
              if ( contextParent ) {
                this.setPrivate_(
                    '__context__',
                    x = contextParent.__subContext__ || contextParent.__context__);
                this.setPrivate_('contextParent', undefined);
              } else {
                // Happens during bootstrap with Properties.
                x = foam.__context__;
              }
            }
            return x;
          },
          set: function(x) {
            if ( x ) {
              this.setPrivate_(
                  foam.core.FObject.isInstance(x) ?
                      'contextParent' :
                      '__context__',
                  x);
            }
          }
        });

        // If no delcared exports, then sub-context is the same as context.
        Object.defineProperty(
            p,
            '__subContext__',
            {
              get: function() { return this.__context__; },
              set: function() {
                throw new Error(
                    'Attempted to set unsettable __subContext__ in ' +
                    this.cls_.id);
              }
            });
      }
    }
  ],

  methods: [
    /**
      Called to process constructor arguments.
      Replaces simpler version defined in original FObject definition.
    */
    function initArgs(args, ctx) {
      if ( ctx  ) this.__context__ = ctx;
      if ( args ) this.copyFrom(args, true);
    },

    /**
      Template method used to report an unknown argument passed
      to a constructor. Is set in debug.js.
    */
    function unknownArg(key, value) {
      // NOP
    },

    function lookup() { return this.__context__.lookup.apply(this.__context__, arguments); },
  ]
});

foam.boot.end();


/**
  Refine foam.core.Property to add 'transient' support.

  A transient Property is not intended to be persisted
  or transfered over the network.

  Ex. A computed Property could be made transient to avoid
  wasting disk space or network bandwidth.

  For finer control, there are also separate properties called
  'networkTransient' and 'storageTransient', which default to
  the value of 'transient' if not explicitly set.

  A networkTransient field is not marshalled over network calls.
  foam.json.Network does not encode networkTransient fields.

  A storageTransient field is not stored to persistent storage.
  foam.json.Storage does not encode storageTransient fields.
 */
foam.CLASS({
  refines: 'foam.core.Property',

  properties: [
    {
      class: 'Boolean',
      name: 'transient'
    },
    {
      class: 'Boolean',
      name: 'networkTransient',
      expression: function(transient) {
        return transient;
      }
    },
    {
      class: 'Boolean',
      name: 'storageTransient',
      expression: function(transient) {
        return transient;
      }
    }
  ]
});


/**
 * Replace foam.CLASS() with a lazy version which only
 * build the class when first accessed.
 */
(function() {
  // List of unused Models in the system.
  foam.USED      = {};
  foam.UNUSED    = {};

  // Used to store an async. arequire() function which must be called
  // before the class can be created. Used by FoamTagLoader, but should
  // be extended into a more general classloader.
  foam.AREQUIRES = {};

  var CLASS = foam.CLASS;

  foam.CLASS = function(m) {
    if ( m.refines ) return CLASS(m);

    m.id = m.package ? m.package + '.' + m.name : m.name;
    foam.UNUSED[m.id] = true;

    if ( m.arequire ) foam.AREQUIRES[m.id] = m.arequire;

    var f = foam.Function.memoize0(function() {
      delete foam.UNUSED[m.id];
      var c = CLASS(m);
      foam.USED[m.id] = c;
      return c;
    });

    foam.__context__.registerFactory(m, f);
    foam.package.registerClassFactory(m, f);
  };
})();
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'FObjectArray',
  extends: 'Property',

  documentation: "A Property which contains an array of 'of' FObjects.",

  properties: [
    { name: 'of', required: true },
    [
      'factory',
      function() { return []; }
    ],
    [ 'adapt', function(_, /* array? */ a, prop) {
        if ( ! a ) return [];
        // If not an array, allow assertValue to assert the type-check.
        if ( ! Array.isArray(a) ) return a;

        var b = new Array(a.length);
        for ( var i = 0 ; i < a.length ; i++ ) {
          b[i] = prop.adaptArrayElement(a[i], this);
        }
        return b;
      }
    ],
    [ 'assertValue', function(v, prop) {
        foam.assert(Array.isArray(v),
            prop.name, 'Attempt to set array property to non-array value', v);
      }
    ],
    [ 'adaptArrayElement', function(o, obj) {
      // FUTURE: replace 'foam.' with '(this.__subContext__ || foam).' ?
      var ctx = obj.__subContext__ || foam;
      var of = o.class || this.of;
      var cls = ctx.lookup(of);
      return cls.isInstance(o) ? o : cls.create(o, obj);
    }],
    {
      name: 'fromJSON',
      value: function(value, ctx, prop) {
        return foam.json.parse(value, prop.of, ctx);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Constants are installed on both the prototype and class.
<pre>
  Ex.
  constants: {
    KEY: 'some value'
  }

  this.cls_.KEY === this.KEY === 'some value'
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Constant',

  documentation: 'An Axiom for defining class constants.',

  properties: [ 'name', 'value' ],

  methods: [
    function installInClass(cls) {
      Object.defineProperty(
        cls,
        foam.String.constantize(this.name),
        {
          value: this.value,
          configurable: false
        });
    },
    function installInProto(proto) {
      this.installInClass(proto);
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Constant',
      name: 'constants',
      adapt: function(_, a, prop) {
        if ( ! a ) return [];
        if ( ! Array.isArray(a) ) {
          var cs = [];
          for ( var key in a ) {
            cs.push(foam.core.Constant.create({name: key, value: a[key]}));
          }
          return cs;
        }
        var b = new Array(a.length);
        for ( var i = 0 ; i < a.length ; i++ ) {
          b[i] = prop.adaptArrayElement.call(this, a[i], prop);
        }
        return b;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  refines: 'foam.core.Property',

  properties: [
    {
      name: 'validateObj',
      expression: function(name, label, required) {
        return !required ? null : [[name],
          function() {
            return !this.hasOwnProperty(name) && (label + ' is required.');
          }]
      },
    },
  ]
});


foam.CLASS({
  package: 'foam.core.internal',
  name: 'Errors',
//  extends: 'foam.core.Property',

  documentation: `
    A psedo-Property Axiom added to FObject which contains an object\'s validation errors.
    Adds the following attributes to an Object:
    <dl>
      <dt>errors_</dt><dd>list of current errors</dd>
      <dt>errors_$</dt><dd>Slot representation of errors_</dd>
      <dt>validateObject()</dt><dd>calls the validateObj() method of all property Axioms, allowing them to populate errors_</dd>
    </dl>
  `,

  properties: [
    [ 'name', 'errors_' ]
  ],

  methods: [
    function installInProto(proto) {
      var self = this;
      Object.defineProperty(proto, 'errors_', {
        get: function() {
          return self.toSlot(this).get();
        },
        configurable: true,
        enumerable: false
      });

      Object.defineProperty(proto, 'errors_$', {
        get: function() {
          return self.toSlot(this);
        },
        configurable: true,
        enumerable: false
      });
    },

    function toSlot(obj) {
      var slotName = this.slotName_ || ( this.slotName_ = this.name + '$' );
      var slot     = obj.getPrivate_(slotName);

      if ( ! slot ) {
        slot = this.createErrorSlot_(obj)
        obj.setPrivate_(slotName, slot);
      }

      return slot;
    },

    function createErrorSlot_(obj) {
      var args = [];
      var ps   = obj.cls_.getAxiomsByClass(foam.core.Property).
        filter(function(a) { return a.validateObj; });

      for ( var i = 0 ; i < ps.length ; i++ ) {
        var p = ps[i];
        args.push(obj.slot(p.validateObj));
      }

      function validateObject() {
        var ret;

        for ( var i = 0 ; i < ps.length ; i++ ) {
          var p = ps[i];
          var err = args[i].get();
          if ( err ) (ret || (ret = [])).push([p, err]);
        }

        return ret;
      }

      return foam.core.ExpressionSlot.create({
        obj: obj,
        code: validateObject,
        args: args});
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.FObject',

  axioms: [
    foam.core.internal.Errors.create()
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

/**
  A Faceted Axiom, when added to a Class, makes it implement
  the Facet-Manager Pattern, meaning that calls to create() can
  be intercepted and return a special Facet class depending on the
  value of the 'of' create argument.

  Ex.:
  foam.CLASS({
    name: 'View',
    axioms: [ foam.pattern.Faceted.create() ],
    properties: [ 'of' ],
    methods: [ function view() { return 'default' } ]
  });

  foam.CLASS({name: 'A'});
  foam.CLASS({name: 'B'});
  foam.CLASS({name: 'C'});
  foam.CLASS({name: 'BView', extends: 'View', methods: [function view() { return 'BView'; }]});
  foam.CLASS({name: 'CView', extends: 'View', methods: [function view() { return 'CView'; }]});

  console.log(View.create({of: A}));
  console.log(View.create({of: B}));
  console.log(View.create({of: C}));
*/
// FUTURE: add createOriginal() (or similar) method.
foam.CLASS({
  package: 'foam.pattern',
  name: 'Faceted',

  methods: [
    function installInClass(cls) {
      var oldCreate = cls.create;

      cls.getFacetOf = function(of, X) {
        if ( ! of ) return this;
        X = X || foam.__context__;

        var name;
        var pkg;
        if ( foam.String.isInstance(of) ) {
          name = of.substring(of.lastIndexOf('.') + 1);
          pkg = of.substring(0, of.lastIndexOf('.'))
        } else {
          name = of.name;
          pkg  = of.package;
        }

        var id = ( pkg ? pkg + '.' : '' ) + name + this.name;

        return X.lookup(id, true) || this;
      };

      // ignoreFacets is set to true when called to prevent a second-level
      // of facet checking
      cls.create = function(args, X, ignoreFacets) {
        if ( ! ignoreFacets ) {
          var facetCls = this.getFacetOf(args && args.of, X);

          if ( facetCls !== this ) return facetCls.create(args, X, true);
        }

        return oldCreate.apply(this, arguments);
      }
    }
  ],

  properties: [
    ['name', 'foam.pattern.Faceted']
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Int',
  extends: 'Property',

  properties: [
    'units',
    [ 'value', 0 ],
    'min',
    'max',
    [ 'adapt', function adaptInt(_, v) {
        return typeof v === 'number' ? Math.trunc(v) :
          v ? parseInt(v) :
          0 ;
      }
    ],
    [ 'fromString', function intFromString(str) {
        return str ? parseInt(str) : 0;
      }
    ]
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'String',
  extends: 'Property',

  documentation: 'StringProperties coerce their arguments into Strings.',

  properties: [
    { class: 'Int', name: 'width', value: 30 },
    [ 'adapt', function(_, a) {
        return typeof a === 'function' ? foam.String.multiline(a) :
               typeof a === 'number'   ? String(a)                :
               a && a.toString         ? a.toString()             :
                                         ''                       ;
      }
    ],
    [ 'value', '' ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  documentation: 'Upgrade Mode.documentation to a proper String property.',

  properties: [
    { class: 'String', name: 'documentation' }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Date',
  extends: 'Property',

  // documentation: 'Describes properties of type Date.',
  label: 'Date',

  properties: [
    {
      name: 'adapt',
      value: function (_, d) {
        if ( typeof d === 'number' ) return new Date(d);
        if ( typeof d === 'string' ) {
          var ret = new Date(d);

          if ( isNaN(ret.getTime()) ) throw 'Invalid Date: ' + d;

          return ret;
        }
        return d;
      }
    },
    {
      name: 'comparePropertyValues',
      value: function(o1, o2) {
        if ( ! o1 ) return o2 ? -1 : 0;
        if ( ! o2 ) return 1;

        return foam.Date.compare(o1, o2);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'DateTime',
  extends: 'Date',

  documentation: 'Describes properties of type DateTime.',
  label: 'Date and time'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Byte',
  extends: 'Int',

  documentation: 'Describes properties of type Byte.',
  label: 'Round byte numbers'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Short',
  extends: 'Int',

  documentation: 'Describes properties of type Short.',
  label: 'Round short numbers'
});


foam.CLASS({
  package: 'foam.core',
  name:  'Long',
  extends: 'Int',

  documentation:  'Describes properties of type Long.',
  label: 'Round long numbers'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Float',
  extends: 'Int',

  // documentation:  'Describes properties of type Float.',
  label: 'Decimal numbers',

  properties: [
    'precision',
    [
      'adapt',
      function (_, v) {
        return typeof v === 'number' ? v : v ? parseFloat(v) : 0.0 ;
      }
    ]
  ]
});


/**
 No different than Float for JS, but useful when targeting with other languages.
 **/
foam.CLASS({
  package: 'foam.core',
  name: 'Double',
  extends: 'Float'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Function',
  extends: 'Property',

  documentation: 'Describes properties of type Function.',
  label: 'Code that can be run',

  properties: [
    [
      'value',
      function() {}
    ],
    [
      'assertValue',
      function(value, prop) {
        foam.assert(typeof value === 'function', prop.name, 'Cannot set to non function type.');
      }
    ]
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Blob',
  extends: 'Property',

  // documentation: 'A chunk of binary data.',
  label: 'Binary data',
});


foam.CLASS({
  package: 'foam.core',
  name: 'Object',
  extends: 'Property',
  documentation: ''
});


foam.CLASS({
  package: 'foam.core',
  name: 'Array',
  extends: 'Property',

  properties: [
    [
      'factory',
      function() { return []; }
    ],
    [
      'isDefaultValue',
      function(v) { return ! v || ! v.length; }
    ]
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'List',
  extends: 'foam.core.Object'
});


foam.CLASS({
  package: 'foam.core',
  name: 'StringArray',
  extends: 'Property',

  documentation: 'An array of String values.',
  label: 'List of text strings',

  properties: [
    {
      name: 'of',
      value: 'String',
      documentation: 'The FOAM sub-type of this property.'
    },
    [
      'factory',
      function() { return []; }
    ],
    [
      'adapt',
      function(_, v, prop) {
        if ( ! Array.isArray(v) ) return v;

        var copy;
        for ( var i = 0 ; i < v.length ; i++ ) {
          if ( typeof v[i] !== 'string' ) {
            if ( ! copy ) copy = v.slice();
            copy[i] = '' + v[i];
          }
        }

        return copy || v;
      }
    ],
    [
      'assertValue',
      function(v, prop) {
        if ( v === null ) return;

        foam.assert(Array.isArray(v),
            prop.name, 'Tried to set StringArray to non-array type.');
        for ( var i = 0 ; i < v.length ; i++ ) {
          foam.assert(typeof v[i] === 'string',
              prop.name, 'Element', i, 'is not a string', v[i]);
        }
      }
    ]
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Class',
  extends: 'Property',

  properties: [
    {
      name: 'getter',
      value: function(prop) {
        var c = this.instance_[prop.name];

        // Implement value and factory support.
        if ( foam.Undefined.isInstance(c) ) {
          if ( ! foam.Undefined.isInstance(prop.value) ) {
            c = prop.value;
          } else if ( prop.factory ) {
            c = this.instance_[prop.name] = prop.factory.call(this, prop);
          }
        }

        // Upgrade Strings to actual classes, if available.
        if ( foam.String.isInstance(c) ) {
          c = this.lookup(c, true);
          if ( c ) this.instance_[prop.name] = c;
        }

        return c;
      }
    },
    {
      name: 'toJSON',
      value: function(value) { return value ? value.id : value; }
    }
  ],

  methods: [
    function installInProto(proto) {
      this.SUPER(proto);

      var name = this.name;

      Object.defineProperty(proto, name + '$cls', {
        get: function classGetter() {
          console.warn("Deprecated use of 'cls.$cls'. Just use 'cls' instead.");
          return typeof this[name] !== 'string' ? this[name] :
            this.__context__.lookup(this[name], true);
        },
        configurable: true
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'EMail',
  extends: 'String',
  // FUTURE: verify
  label: 'Email address'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Image',
  extends: 'String',
  // FUTURE: verify
  label: 'Image data or link'
});


foam.CLASS({
  package: 'foam.core',
  name: 'URL',
  extends: 'String',
  // FUTURE: verify
  label: 'Web link (URL or internet address)'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Color',
  extends: 'String',
  label: 'Color'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Password',
  extends: 'String',
  label: 'Password that displays protected or hidden text'
});


foam.CLASS({
  package: 'foam.core',
  name: 'PhoneNumber',
  extends: 'String',
  label: 'Phone number'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Currency',
  extends: 'Long'
});


foam.CLASS({
  package: 'foam.core',
  name: 'Map',
  extends: 'Property',

  // TODO: Remove need for sorting
  properties: [
    [ 'factory', function() { return {} } ],
    [
      'comparePropertyValues',
      function(o1, o2) {
        if ( foam.typeOf(o1) != foam.typeOf(o2) ) return -1;

        var keys1 = Object.keys(o1).sort();
        var keys2 = Object.keys(o2).sort();
        if ( keys1.length < keys2.length ) return -1;
        if ( keys1.length > keys2.length ) return 1;
        for ( var i = 0 ; i < keys1.length ; i++ ) {
          var c = foam.String.compare(keys1[i], keys2[i]);
          if ( c != 0 ) return c;
          c = foam.util.compare(o1[keys1[i]], o2[keys2[i]]);
          if ( c != 0 ) return c;
        }

        return 0;
      }
    ],
    [
      'diffPropertyValues',
      function(o1, o2) {
        // TODO
      }
    ],
    'of'
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'FObjectProperty',
  extends: 'Property',

  properties: [
    {
      class: 'Class',
      name: 'of',
      value: 'foam.core.FObject'
    },
    {
      name: 'fromJSON',
      value: function(json, ctx, prop) {
        return foam.json.parse(json, prop.of, ctx);
      }
    },
    {
      name: 'adapt',
      value: function(_, v, prop) {
        // All FObjects may be null.
        if (v === null) return v;

        var of = prop.of;

        return of.isInstance(v) ?
            v :
            ( v.class ?
                this.lookup(v.class) :
                of ).create(v, this.__subContext__);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Reference',
  extends: 'Property',

  properties: [
    {
      class: 'Class',
      name: 'of'
    },
    {
      class: 'String',
      name: 'targetDAOKey',
      expression: function(of) { return foam.String.daoize(of.name); }
    },
    {
      name: 'adapt',
      value: function(oldValue, newValue, prop) {
        return prop.of.isInstance(newValue) ?
          newValue.id :
          newValue ;
      }
    }
  ],

  methods: [
    function installInProto(proto) {
      this.SUPER(proto);
      var key  = this.targetDAOKey;
      var name = this.name;

      Object.defineProperty(proto, name + '$find', {
        get: function classGetter() {
          return this.__context__[key].find(this[name]);
        },
        configurable: true
      });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  documentation: 'Update Model Property types.',

  properties: [
    { class: 'String',  name: 'name' },
    { class: 'Boolean', name: 'abstract' }
  ]
});


foam.CLASS({
  refines: 'Property',

  axioms: [
    foam.pattern.Faceted.create()
  ],

  properties: [
    {
      name: 'of'
    }
  ]
});


foam.CLASS({
  refines: 'Property',

  properties: [
    /**
      A short-name is an optional shorter name for a property.
      It is used by JSON and XML support when 'useShortNames'
      is enabled. Short-names enable output to be smaller,
      which can save disk space and/or network bandwidth.
      Ex.
    <pre>
      properties: [
        { name: 'firstName', shortName: 'fn' },
        { name: 'lastName',  shortName: 'ln' }
      ]
    </pre>
    */
    { class: 'String', name: 'shortName' }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Topic',

  documentation: `
  Topics delcare the types of events that an object publishes.
  <pre>
    Ex.
    foam.CLASS({
      name: 'Alarm',
      topics: [ 'ring' ]
    });

    then doing:
    alarm.ring.pub();
    alarm.ring.sub(l);

    is the same as:
    alarm.pub('ring');
    alarm.sub('ring', l);
  </pre>
  `,

  properties: [
    'name',
    'description',
    {
      class: 'FObjectArray',
      of: 'Topic',
      name: 'topics',
      adaptArrayElement: function(o) {
        return typeof o === 'string' ?
          foam.core.Topic.create({ name: o }, this) :
          foam.core.Topic.create(o, this);
      }
    }
  ],

  methods: [
    function installInProto(proto) {
      var name      = this.name;
      var topic     = this;
      var makeTopic = this.makeTopic;

      Object.defineProperty(proto, name, {
        get: function topicGetter() {
          if ( ! this.hasOwnPrivate_(name) ) {
            this.setPrivate_(name, makeTopic(topic, this));
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    },

    function makeTopic(topic, parent) {
      var name   = topic.name;
      var topics = topic.topics || [];

      var ret = {
        pub: foam.Function.bind(parent.pub, parent, name),
        sub: foam.Function.bind(parent.sub, parent, name),
        hasListeners: foam.Function.bind(parent.hasListeners, parent, name),
        toString: function() { return 'Topic(' + name + ')'; }
      };

      for ( var i = 0 ; i < topics.length ; i++ ) {
        ret[topics[i].name] = makeTopic(topics[i], ret);
      }

      return ret;
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Topic',
      name: 'topics',
      adaptArrayElement: function(o) {
        return typeof o === 'string'        ?
          foam.core.Topic.create({name: o}) :
          foam.core.Topic.create(o)         ;
      }
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.FObject',
  topics: [ 'propertyChange' ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Classes can have "inner-classes" which are classes which are defined within
  the scope of a class itself rather than being top-level classes which reside
  in a package or globally. This helps to avoid polluting namespaces with classes
  which are only used by a single class.

<pre>
  Ex.
  // Classes can have inner-Classes.
  foam.CLASS({
    name: 'InnerClassTest',
    classes: [
      { name: 'InnerClass1', properties: ['a', 'b'] },
      { name: 'InnerClass2', properties: ['x', 'y'] }
    ],
    methods: [
      function init() {
        var ic1 = this.InnerClass1.create({a:1, b:2});
        var ic2 = this.InnerClass2.create({x:5, y:10});
        log(ic1.a, ic1.b, ic2.x, ic2.y);
      }
    ]
  });
  InnerClassTest.create();
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'InnerClass',

  documentation: 'Axiom for defining inner-classes. An inner-class is a class defined in the scope of the outer/owner class. This avoids poluting the package namespace with classes which are only used internally by a class.',

  properties: [
    {
      name: 'name',
      getter: function() { return this.model.name; }
    },
    {
      name: 'model',
      adapt: function(_, m) {
        return this.modelAdapt_(m);
      }
    }
  ],

  methods: [
    function modelAdapt_(m) {
      return foam.core.Model.isInstance(m) ? m :
          foam.core.EnumModel.isInstance(m) ? m :
          foam.core.InnerClass.isInstance(m) ? this.modelAdapt_(m.model) :
          m.class ? this.modelAdapt_(foam.json.parse(m)) :
          foam.core.Model.create(m);
    },

    function installInClass(cls) {
      cls[this.model.name] = this.model.buildClass();
    },

    function installInProto(proto) {
      // get class already created in installInClass();
      var name = this.model.name;
      var cls = proto.cls_[name];

      // Create a private_ clone of the Class with the create() method decorated
      // to pass 'this' as the context if not explicitly provided.  This ensures
      // that the created object has access to this object's exported bindings.
      Object.defineProperty(proto, name, {
        get: function innerClassGetter() {
          if ( ! this.hasOwnPrivate_(name) ) {
            var parent = this;
            var c      = Object.create(cls);

            c.create = function innerClassCreate(args, ctx) {
              return cls.create(args, ctx || parent);
            };
            this.setPrivate_(name, c);
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'InnerClass',
      name: 'classes',
      // A custom adaptArrayElement is needed because we're
      // passing the model definition as model:, rather than
      // as all of the arguments to create().
      adaptArrayElement: function(o) {
        return foam.core.InnerClass.isInstance(o) ?
          o :
          foam.core.InnerClass.create({model: o}) ;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Classes can have "inner-enums" which are enums which are defined within
  the scope of a class itself rather than being top-level enums which reside
  in a package or globally. This helps to avoid polluting namespaces with enums
  which are only used by a single class.

<pre>
  Ex.
  // Classes can have inner-Enums.
  foam.CLASS({
    name: 'InnerEnumTest',
    enums: [
      { name: 'InnerEnum', values: [
        { name: 'OPEN',   label: 'Open'   },
        { name: 'CLOSED', label: 'Closed' }
      ] }
    ],
    methods: [
      function init() {
        log(this.InnerEnum.OPEN, this.InnerEnum.CLOSED)
      }
    ]
  });
  InnerEnumTest.create();
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'InnerEnum',

  documentation: 'Axiom for defining inner-enums. An inner-enum is an enum defined in the scope of the outer/owner class. This avoids poluting the package namespace with enums which are only used internally by a class.',

  properties: [
    {
      name: 'name',
      getter: function() { return this.model.name; }
    },
    {
      name: 'model',
      adapt: function(_, m) {
        return foam.core.EnumModel.isInstance(m) ? m : foam.core.EnumModel.create(m);
      }
    }
  ],

  methods: [
    function installInClass(cls) {
      cls[this.model.name] = this.model.buildClass();
    },

    function installInProto(proto) {
      // get class already created in installInClass();
      var name = this.model.name;
      var cls = proto.cls_[name];
      proto[name] = cls;
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'InnerEnum',
      name: 'enums',
      // A custom adaptArrayElement is needed because we're
      // passing the model definition as model:, rather than
      // as all of the arguments to create().
      adaptArrayElement: function(o) {
        return foam.core.InnerEnum.isInstance(o) ?
          o :
          foam.core.InnerEnum.create({model: o}) ;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Implements',

  documentation: function() {/*
    Axiom for declaring intent to implement an interface.

    Since interfaces can also have implementations, it
    can also be used to provide mix-ins, which is a safe form of
    multiple-inheritance.
  <pre>
    Ex.
    foam.CLASS({
      name: 'SalaryI',
      properties: [ 'salary' ]
    });

    foam.CLASS({
      name: 'Employee',
      extends: 'Person',
      implements: [ 'SalaryI' ]
    });
  </pre>
  Employee extends Person through regular inheritance, but
  the axioms from SalaryI are also added to the class.
  Any number of mix-ins/interfaces can be specified.
  */},

  properties: [
    { 
      name: 'name', 
      getter: function() { return 'implements_' + this.path; } 
    },
    {
      name: 'java',
      class: 'Boolean',
      value: true
    },
    'path'
  ],

  methods: [
    function installInClass(cls) {
      var m = this.lookup(this.path);
      if ( ! m ) throw 'No such interface or trait: ' + this.path;

      // TODO: clone these axioms since they could be reused and then would
      // have the wrong sourceCls_;

      // This next part is a bit tricky.
      // If we install a mixin and then override properties of one of the
      // Properties from the mixin, the mixin Property will see the overridden
      // Property as its super-prop, which is wrong. So, we insert a new level
      // in the axiomMap_ between the current axiomMap_ and its prototype, and
      // then install the mixin there.

      // Current AxiomMap
      var aMap = cls.axiomMap_;

      // New mixin AxiomMap to install into
      var sMap = Object.create(aMap.__proto__);

      // Insert new AxiomMap between current and its parent
      aMap.__proto__ = sMap;

      // Temporarily set the class'es AxiomMap to sMap so that
      // mixin axioms get installed into it.
      cls.axiomMap_ = sMap;

      cls.installAxioms(m.getOwnAxioms());

      // Put the original AxiomMap back, with the inserted parent.
      cls.axiomMap_ = aMap;
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Implements',
      name: 'implements',
      adaptArrayElement: function(o) {
        return typeof o === 'string' ?
          foam.core.Implements.create({path: o}) :
          foam.core.Implements.create(o)         ;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Imports and Exports provide implicit Context dependency management.

  A class can list which values it requires from the Context, and then
  these values will be added to the object itself so that it doesn't need
  to explicitly work with the Context.

  A class can list which values (properties, methods, or method-like axioms)
  that it exports, and these will automatically be added to the object's
  sub-Context. The object's sub-Context is the context that is used when
  new objects are created by the object.

  Ex.
<pre>
foam.CLASS({
  name: 'ImportsTest',

  imports: [ 'log', 'warn' ],

  methods: [
    function foo() {
      this.log('log foo from ImportTest');
      this.warn('warn foo from ImportTest');
    }
  ]
});

foam.CLASS({
  name: 'ExportsTest',
  requires: [ 'ImportsTest' ],

  exports: [ 'log', 'log as warn' ],

  methods: [
    function init() {
      // ImportsTest will be created in ExportTest's
      // sub-Context, which will have 'log' and 'warn'
      // exported.
      this.ImportsTest.create().foo();
    },
    function log(msg) {
      console.log('log:', msg);
    }
  ]
});
</pre>

  Aliasing:
    Bindings can be renamed or aliased when they're imported or exported using
    'as alias'.

  Examples:
    // import 'userDAO' from the Context and make available as this.dao
    imports: [ 'userDAO as dao' ]

    // export my log method as 'warn'
    exports: [ 'log as warn' ]

    // If the axiom to be exported isn't named, but just aliased, then 'this'
    // is exported as the named alias.  This is how objects export themselves.
    exports: [ 'as Controller' ]

  See Context.js.
 */
foam.CLASS({
  package: 'foam.core',
  name: 'Import',

  documentation: 'Axiom to Import a Context Value.',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    'key',
    {
      class: 'Boolean',
      name: 'required',
      value: true
    },
    {
      name: 'slotName_',
      factory: function() {
        return foam.String.toSlotName(this.name);
      }
    }
  ],

  methods: [
    function installInProto(proto) {
      foam.assert(this.key, 'No key for import: ' + this.name);

      var name     = this.name;
      var key      = foam.String.toSlotName(this.key);
      var slotName = this.slotName_;

      Object.defineProperty(proto, slotName, {
        get: function importsSlotGetter() {
          return this.__context__[key];
        },
        configurable: false,
        enumerable: false
      });

      Object.defineProperty(proto, name, {
        get: function importsGetter()  {
          var slot = this[slotName];
          if ( slot ) return slot.get();
          console.warn('Access missing import:', name);
          return undefined;
        },
        set: function importsSetter(v) {
          var slot = this[slotName];
          if ( slot )
            slot.set(v);
          else
            console.warn('Attempt to set missing import:', name);
        },
        configurable: true,
        enumerable: false
      });
    },

    function toSlot(obj) {
      return obj[this.slotName_];
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Export',

  documentation: 'Axiom to Export a Sub-Context Value.',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      name: 'exportName',
      postSet: function(_, name) {
        this.name = 'export_' + name;
      }
    },
    'key'
  ],

  methods: [
    function getExportMap() {
      var m = {};
      var bs = this.cls_.getAxiomsByClass(foam.core.Export);
      for ( var i = 0 ; i < bs.length ; i++ ) {
        var b = bs[i];

        if ( b.key ) {
          var path = b.key.split('.');

          var a = this.cls_.getAxiomByName(path[0]);

          foam.assert(!!a, 'Unknown axiom: "', path[0], '" in model: ',
                      this.cls_.id, ", trying to export: '", b.key, "'");

          // Axioms have an option of wrapping a value for export.
          // This could be used to bind a method to 'this', for example.
          var e = a.exportAs ? a.exportAs(this, path.slice(1)) : this[path[0]];

          m[b.exportName] = e;
        } else {
          // Ex. 'as Bank', which exports an implicit 'this'
          m[b.exportName] = this;
        }
      }
      return m;
    },

    function installInProto(proto) {
      if ( Object.prototype.hasOwnProperty.call(proto, '__subContext__' ) ) {
        return;
      }

      var axiom = this;

      Object.defineProperty(proto, '__subContext__', {
        get: function YGetter() {
          if ( ! this.hasOwnPrivate_('__subContext__') ) {
            var ctx = this.__context__;
            var m = axiom.getExportMap.call(this);
            this.setPrivate_('__subContext__', ctx.createSubContext(m));
          }

          return this.getPrivate_('__subContext__');
        },
        set: function() {
          throw new Error('Attempted to set unsettable __subContext__ in ' + this.cls_.id);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Import',
      name: 'imports',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var a        = o.split(' as ');
          var key      = a[0];
          var optional = key.endsWith('?');
          if ( optional ) key = key.slice(0, key.length-1);
          return foam.core.Import.create({name: a[1] || key, key: key, required: ! optional});
        }

        return foam.core.Import.create(o);
      }
    },
    {
      class: 'AxiomArray',
      of: 'Export',
      name: 'exports',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var a = o.split(' ');

          switch ( a.length ) {
            case 1:
              return foam.core.Export.create({exportName: a[0], key: a[0]});

            case 2:
              // Export 'this'
              foam.assert(
                  a[0] === 'as',
                  'Invalid export syntax: key [as value] | as value');
              return foam.core.Export.create({exportName: a[1], key: null});

            case 3:
              foam.assert(
                  a[1] === 'as',
                  'Invalid export syntax: key [as value] | as value');
              return foam.core.Export.create({exportName: a[2], key: a[0]});

            default:
              foam.assert(false,
                  'Invalid export syntax: key [as value] | as value');
          }
        }

        return foam.core.Export.create(o);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Listeners are high-level pre-bound event call-backs.
<pre>
  Ex.
  foam.CLASS({
    name: 'Sprinkler',
    listeners: [

      // short-form
      function onAlarm() { ... },

      // long-form
      {
        name: 'onClear',
        isFramed: true,
        code: function() { ... }
      }
    ]
  });
</pre>
  You might use the above onAlarm listener like this:
  alarm.ring.sub(sprinker.onAlarm);
<p>
  Notice, that normally JS methods forget which object they belong
  to so you would need to do something like:
    <pre>alarm.ring.sub(sprinker.onAlarm.bind(sprinkler));</pre>
  But listeners are pre-bound.
*/
// TODO(kgr): Add SUPER support.
foam.CLASS({
  package: 'foam.core',
  name: 'Listener',
  extends: 'foam.core.AbstractMethod',

  properties: [
    { class: 'Boolean', name: 'isFramed',   value: false },
    { class: 'Boolean', name: 'isMerged',   value: false },
    { class: 'Int',     name: 'mergeDelay', value: 16, units: 'ms' }
  ],

  methods: [
    function installInProto(proto, superAxiom) {
      foam.assert(
        ! superAxiom ||
          foam.core.Listener.isInstance(superAxiom),
        'Attempt to override non-listener', this.name);

      var name       = this.name;
      var code       = this.override_(proto, foam.Function.setName(this.code, name), superAxiom);
      var isMerged   = this.isMerged;
      var isFramed   = this.isFramed;
      var mergeDelay = this.mergeDelay;

      Object.defineProperty(proto, name, {
        get: function listenerGetter() {
          if ( this.cls_.prototype === this ) return code;

          if ( ! this.hasOwnPrivate_(name) ) {
            var self = this;
            var l = function(sub) {
              // Is it possible to detect stale subscriptions?
              // ie. after an object has been detached.
              return code.apply(self, arguments);
            };

            if ( isMerged ) {
              l = this.__context__.merged(l, mergeDelay);
            } else if ( isFramed ) {
              l = this.__context__.framed(l);
            }
            this.setPrivate_(name, l);
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Listener',
      name: 'listeners',
      adaptArrayElement: function(o) {
        if ( typeof o === 'function' ) {
          var name = foam.Function.getName(o);
          foam.assert(name, 'Listener must be named');
          return foam.core.Listener.create({name: name, code: o});
        }

        return foam.core.Listener.isInstance(o) ?
            o :
            foam.core.Listener.create(o) ;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'MultiPartID',
  extends: 'foam.core.Property',

  documentation: function() {/*
  An Identity Axiom which installs a psedo-property to use as an id.

  Use when you want a multi-part primary-key.
  <pre>
  Ex.
  foam.CLASS({
    name: 'Person',
    ids: [ 'firstName', 'lastName' ],
    properties: [ 'firstName', 'lastName', 'age', 'sex' ]
  });

  > var p = Person.create({firstName: 'Kevin', lastName: 'Greer'});
  > p.id;
  ["Kevin", "Greer"]
  </pre>
  */},

  properties: [
    [ 'name', 'id' ],
    [ 'transient', true ],
    [ 'hidden', true ],
    'propNames',
    'props',
    [ 'getter', function multiPartGetter() {
      var props = this.cls_.ID.props;

      if ( props.length === 1 ) return props[0].get(this);

      var a = new Array(props.length);
      for ( var i = 0 ; i < props.length ; i++ ) a[i] = props[i].get(this);
      return a;
    }],
    [ 'setter', function multiPartSetter(a) {
      var props = this.cls_.ID.props;

      if ( props.length === 1 ) {
        props[0].set(this, a);
      } else {
        for ( var i = 0 ; i < props.length ; i++ ) props[i].set(this, a[i]);
      }
    }],
    {
      name: 'compare',
      value: function multiPartCompare(o1, o2) {
        var props = this.props;
        if ( props.length === 1 ) return props[0].compare(o1, o2);

        for ( var i = 0 ; i < props.length ; i++ ) {
          var c = props[i].compare(o1, o2);
          if ( c ) return c;
        }
        return 0;
      }
    },
    {
      name: 'toJSON',
      value: function toJSON(value, outputter) {
        var props = this.props;

        if ( props.length === 1 ) return props[0].toJSON(value, outputter);

        var ret = new Array(props.length);
        for ( var i = 0; i < props.length; i++ ) {
          ret[i] = props[i].toJSON(value[i], outputter);
        }
        return ret;
      }
    }
  ],

  methods: [
    function installInClass(c) {
      this.props = this.propNames.map(function(n) {
        var prop = c.getAxiomByName(n);
        foam.assert(prop, 'Unknown ids property:', c.id + '.' + n);
        foam.assert(foam.core.Property.isInstance(prop), 'Ids property:', c.id + '.' + n, 'is not a Property.');
        return prop;
      });

      // Extends Property, so actually gets installed in SUPER call
      this.SUPER(c);
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      name: 'ids',
      postSet: function(_, ids) {
        foam.assert(foam.Array.isInstance(ids), 'Ids must be an array.');
        foam.assert(ids.length, 'Ids must contain at least one property.');

        this.axioms_.push(foam.core.MultiPartID.create({propNames: ids}));
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  The Requires Axiom is used to declare that a class requires/creates objects
  of a particular class. Required classes can be accessed without fully
  qualifying their package names. Required classes are automatically
  created in the sub-context of the creating object.
<pre>
  Ex.
  foam.CLASS({
    package: 'demo.bank',
    name: 'AccountTester',
    requires: [
      // Require demo.bank.Account so that it can be accessed as this.Account
      'demo.bank.Account',

      // Require SavingsAccount and alias it so that it can be accessed
      // as this.SAccount
      'demo.bank.SavingsAccount as SAccount'
    ],
    methods: [ function init() {
      var a = this.Account.create();
      var s = this.SAccount.create();
    } ]
  });
</pre>
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Requires',

  properties: [ 'name', 'path' ],

  methods: [
    function installInProto(proto) {
      var name = this.name;
      var path = this.path;

      // Create a private_ clone of the Class with the create() method decorated
      // to pass 'this' as the context if not explicitly provided.  This ensures
      // that the created object has access to this object's exported bindings.
      Object.defineProperty(proto, name, {
        get: function requiresGetter() {
          if ( ! this.hasOwnPrivate_(name) ) {
            var cls    = (this.__context__ || foam).lookup(path);
            var parent = this;
            foam.assert(cls, 'Requires: Unknown class: ', path);

            var c = Object.create(cls);
            c.create = function requiresCreate(args, ctx) { return cls.create(args, ctx || parent); };
            this.setPrivate_(name, c);
          }

          return this.getPrivate_(name);
        },
        configurable: true,
        enumerable: false
      });
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      of: 'Requires',
      name: 'requires',
      adaptArrayElement: function(o) {
        if ( typeof o === 'string' ) {
          var a     = o.split(' as ');
          var path  = a[0];
          var parts = path.split('.');
          var name  = a[1] || parts[parts.length-1];
          return foam.core.Requires.create(
              {name: name, path: path}, this);
        }

        return foam.core.Requires.create(o, this);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Slot', // ???: Rename AbstractSlot or make an Interface

  documentation: `
    Slots are observable values which can change over time.

    Slots are simple single-value Model-View-Controller Models, but since
    another meaning of 'Model' is already heavily used in FOAM, Slot is
    used to avoid overloading the term.

    <ul>Types of Slots include:
      <li>PropertySlot
      <li>ConstantSlot
      <li>ExpressionSlot
    </ul>
  `,

  methods: [
    /**
      Subscribe to the Slot's value, if it has one. If the Slot's
      value changes, then unsubscribe from the previous value and
      resubscribe to the new one.
    */
    function valueSub() {
      var self = this;
      var args = Array.from(arguments);
      var s;
      var l = function() {
        var v = self.get();
        if ( s ) s.detach();
        if ( v ) s = v.sub.apply(v, args);
      };
      l();
      this.sub(l);
    },

    /**
      Create a sub-Slot for this Slot's value. If this Slot's
      value changes, then the sub-Slot becomes the Slot for
      the new value's sub-Slot instead. Useful for creating
      Slot paths without having to rebuild whenever a value
      along the chain changes.
    */
    function dot(name) {
      return foam.core.internal.SubSlot.create({
        parent: this,
        name:   name
      });
    },

    // TODO: remove when all code ported
    function link(other) {
      console.warn('deprecated use of link(), use linkFrom() instead');
      return this.linkFrom(other);
    },

    /**
      Link two Slots together, setting both to other's value.
      Returns a Detachable which can be used to break the link.
      After copying a value from one slot to the other, this implementation
      then copies the value back in case the target slot rejected the value.
    */
    function linkFrom(s2) {
      var s1        = this;
      var feedback1 = false, feedback2 = false;

      // TODO: once all slot types property set 'src', these
      // two listeneners can be merged.
      var l1 = function(e) {
        if ( feedback1 ) return;

        if ( ! foam.util.is(s1.get(), s2.get()) ) {
          feedback1 = true;
          s2.set(s1.get());
          if ( ! foam.util.is(s1.get(), s2.get()) )
            s1.set(s2.get());
          feedback1 = false;
        }
      };

      var l2 = function(e) {
        if ( feedback2 ) return;

        if ( ! foam.util.is(s1.get(), s2.get()) ) {
          feedback2 = true;
          s1.set(s2.get());
          if ( ! foam.util.is(s1.get(), s2.get()) )
            s2.set(s1.get());
          feedback2 = false;
        }
      };

      var sub1 = s1.sub(l1);
      var sub2 = s2.sub(l2)

      l2();

      return {
        detach: function() {
          sub1 && sub1.detach();
          sub2 && sub2.detach();
          sub1 = sub2 = null;
        }
      };
    },

    function linkTo(other) {
      return other.linkFrom(this);
    },

    /**
      Have this Slot dynamically follow other's value.
      Returns a Detachable which can be used to cancel the binding.
    */
    function follow(other) {
      foam.assert(other, 'Slot.follow requires Slot argument.');
      var self = this;
      var l = function() {
        if ( ! foam.util.is(self.get(), other.get()) ) {
          self.set(other.get());
        }
      };
      l();
      return other.sub(l);
    },

    /**
     * Maps values from one model to another.
     * @param f maps values from srcValue to dstValue
     */
    function mapFrom(other, f) {
      var self = this;
      var l = function() { self.set(f(other.get())); };
      l();
      return other.sub(l);
    },

    function mapTo(other, f) {
      return other.mapFrom(this, f);
    },

    function map(f) {
      return foam.core.ExpressionSlot.create({code: f, args: [this]});
    },

    /**
     * Relate to another Slot.
     * @param f maps from this to other
     * @param fprime maps other to this
     */
    function relateTo(other, f, fPrime) {
      var self     = this;
      var feedback = false;
      var sub      = foam.core.FObject.create();
      var l1 = function() {
        if ( feedback ) return;
        feedback = true;
        other.set(f(self.get()));
        feedback = false;
      };
      var l2 = function() {
        if ( feedback ) return;
        feedback = true;
        self.set(fPrime(other.get()));
        feedback = false;
      };

      sub.onDetach(this.sub(l1));
      sub.onDetach(other.sub(l2));

      l1();

      return sub;
    },

    function relateFrom(other, f, fPrime) {
      return other.relateTo(this, fPrime, f);
    }
  ]
});


foam.CLASS({
  package: 'foam.core.internal',
  name: 'PropertySlot',
  extends: 'foam.core.Slot',

  documentation: `
    Represents object properties as Slots.
    Created with calling obj.prop$ or obj.slot('prop').
    For internal use only.
  `,

  methods: [
    function initArgs() { },
    function init() { },

    function get() {
      return this.prop.get(this.obj);
    },

    function set(value) {
      return this.prop.set(this.obj, value);
    },

    function getPrev() {
      return this.oldValue;
    },

    function setPrev(value) {
      return this.oldValue = value;
    },

    function sub(l) {
      var s = this.obj.sub('propertyChange', this.prop.name, l);
      s.src = this;
      return s;
    },

    function isDefined() {
      return this.obj.hasOwnProperty(this.prop.name);
    },

    function clear() {
      this.obj.clearProperty(this.prop.name);
    },

    function toString() {
      return 'PropertySlot(' + this.obj.cls_.id + '.' + this.prop.name + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.core.internal',
  name: 'SubSlot',
  extends: 'foam.core.Slot',

  documentation:
      'For internal use only. Is used to implement the Slot.dot() method.',

  properties: [
    'of',
    'parent', // parent slot, not parent object
    'name',
    'value',
    'prevSub'
  ],

  methods: [
    function init() {
      this.parent.sub(this.parentChange);
      this.parentChange();
    },

    function get() {
      var o = this.parent.get();

      return o && o[this.name];
    },

    function set(value) {
      var o = this.parent.get();

      if ( o ) o[this.name] = value;
    },

    /** Needed? **/
    function getPrev() {
      debugger;
      return this.oldValue;
    },

    /** Needed? **/
    function setPrev(value) {
      debugger;
      return this.oldValue = value;
    },

    function sub(l) {
      return this.SUPER('propertyChange', 'value', l);
    },

    function isDefined() {
      return this.parent.get().hasOwnProperty(this.name);
    },

    function clear() {
      this.parent.get().clearProperty(this.name);
    },

    function toString() {
      return 'SubSlot(' + this.parent + ',' + this.name + ')';
    }
  ],

  listeners: [
    function parentChange(s) {
      this.prevSub && this.prevSub.detach();
      var o = this.parent.get();

      // If the parent object changes class, then don't update
      // because a new class will have different sub-slots.
      if ( ( ! this.of  ) && o ) this.of = o.cls_;

      this.prevSub = o && o.slot(this.name).sub(this.valueChange);
      this.valueChange();
    },

    function valueChange() {
      var parentValue = this.parent.get();
      this.value = parentValue ? parentValue[this.name] : undefined;
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'ConstantSlot',

  implements: [ 'foam.core.Slot' ],

  documentation: 'An immutable constant valued Slot.',

  properties: [
    {
      name: 'value',
      getter: function() { return this.value_; },
      setter: function() {}
    }
  ],

  methods: [
    function initArgs(args) { this.value_ = args && args.value; },

    function get() { return this.value; },

    function set() {
      throw new Error('Tried to mutate immutable ConstantSlot.');
    },

    function sub(l) { /* nop */ }
  ]
});


/**
*/
foam.CLASS({
  package: 'foam.core',
  name: 'ExpressionSlot',
  implements: [ 'foam.core.Slot' ],

  documentation: `
    Tracks dependencies for a dynamic function and invalidates if they change.

    <pre>
      foam.CLASS({name: 'Person', properties: ['fname', 'lname']});
      var p = Person.create({fname: 'John', lname: 'Smith'});
      var e = foam.core.ExpressionSlot.create({
        args: [ p.fname$, p.lname$ ],
        code: function(f, l) { return f + ' ' + l; }
      });
      log(e.get());
      e.sub(log);
      p.fname = 'Steve';
      p.lname = 'Jones';
      log(e.get());

      Output:
       > John Smith
       > [object Object] propertyChange value [object Object]
       > [object Object] propertyChange value [object Object]
       > Steve Jones

      var p = foam.CLASS({name: 'Person', properties: [ 'f', 'l' ]}).create({f:'John', l: 'Doe'});
      var e = foam.core.ExpressionSlot.create({
        obj: p,
        code: function(f, l) { return f + ' ' + l; }
      });
    </pre>
  `,

  properties: [
    'obj',
    'code',
    {
      name: 'args',
      expression: function(obj) {
        foam.assert(obj, 'ExpressionSlot: "obj" or "args" required.');

        var args = foam.Function.argNames(this.code);
        for ( var i = 0 ; i < args.length ; i++ ) {
          args[i] = obj.slot(args[i]);
        }

        // this.invalidate(); // ???: Is this needed?
        this.subToArgs_(args);

        return args;
      },
      postSet: function(_, args) {
        this.subToArgs_(args);
      }
    },
    {
      name: 'value',
      factory: function() {
        return this.code.apply(this.obj || this, this.args.map(function(a) {
          return a.get();
        }));
      }
    },
    'cleanup_', // detachable to cleanup old subs when obj changes
  ],

  methods: [
    function init() { this.onDetach(this.cleanup); },

    function get() { return this.value; },

    function set() { /* nop */ },

    function sub(l) {
      return arguments.length === 1 ?
        this.SUPER('propertyChange', 'value', l) :
        this.SUPER.apply(this,arguments);
    },

    function subToArgs_(args) {
      this.cleanup();

      var cleanup = foam.core.FObject.create();

      for ( var i = 0 ; i < args.length ; i++ ) {
        cleanup.onDetach(args[i].sub(this.invalidate));
      }

      this.cleanup_ = cleanup;
    }
  ],

  listeners: [
    function cleanup() { this.cleanup_ && this.cleanup_.detach(); },
    function invalidate() { this.clearProperty('value'); }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
 * The Proxy axiom enables your class to automatically proxy methods of
 * an interface to a delegate object.
 *
 * It is an implementation of the Proxy design pattern.
 *
 * The Proxy axiom itself is a property which holds the delegate object
 * that we are proxying.  It also installs a number of Method axioms onto
 * the target class, which proxy all the the specific methods of the interface
 * being proxied.
 *
 * Currently only methods are proxied.
 *
 * USAGE:
 *
 * foam.CLASS({
 *   name: 'Abc',
 *   methods: [
 *     function foo() {
 *       console.log("foo");
 *     }
 *   ]
 * });
 *
 * foam.CLASS({
 *   name: 'ProxyAbc',
 *   properties: [
 *     {
 *       class: 'Proxy',
 *       of: 'Abc'
 *       name: 'delegateAbc'
 *     }
 *   ]
 * });
 *
 * var a = ProxyAbc.create({ delegateAbc: Abc.create() });
 * a.foo();
 *
 * will output:
 *
 * "foo"
 *
 *
 * Methods can be forwarded or delegated to the proxied object.
 * Forwarded methods are the simple case:
 *
 * function foo() {
 *   // This is what a forwarded method looks like
 *   this.delegateAbc.foo();
 * }
 *
 * Delegated methods call the proxied object's implementation
 * but keep "this" as the same object.
 *
 * If the foo method was delegated it would look like this:
 *
 * function foo() {
 *   this.delegateAbc.foo.call(this);
 * }
 *
 * FUTURE(adamvy): Support proxying properties?
 * TODO(adamvy): Document how topics are proxied once the implementation is settled.
 */
// NB: Extending a Proxied object and unsetting options (like setting
//     topics: []) will not undo the work the base class has already done.
//     The ProxySub is already installed in the prototype and will still
//     be active in the derived class, even though it appears that topics is
//     not proxied when examining the dervied class' axiom.
foam.CLASS({
  package: 'foam.core',
  name: 'Proxy',
  extends: 'Property',

  properties: [
    { name: 'of', required: true },
    {
      class: 'StringArray',
      name: 'topics'
    },
    {
      class: 'StringArray',
      name: 'forwards',
      factory: null,
      value: null
      //documentation: 'Methods that are forwarded to the proxies object.'
    },
    {
      class: 'StringArray',
      name: 'delegates',
      factory: null,
      value: null
      //documentation: 'Methods that are delegated to the proxied object.'
    },
    {
      name: 'fromJSON',
      value: function(json, ctx) {
        return foam.json.parse(json, null, ctx);
      }
    }
  ],

  methods: [
    function installInClass(cls) {
      this.SUPER(cls);

      var name     = this.name;
      var delegate = this.lookup(this.of);

      function resolveName(name) {
        var m = delegate.getAxiomByName(name);
        foam.assert(foam.core.Method.isInstance(m), 'Cannot proxy non-method', name);
        return m;
      }

      var delegates = this.delegates ? this.delegates.map(resolveName) : [];

      var forwards = this.forwards ?
          this.forwards.map(resolveName) :
          // TODO(adamvy): This isn't the right check.  Once we have modeled interfaces
          // we can proxy only that which is defined in the interface.
          delegate.getOwnAxiomsByClass(foam.core.Method);

      var axioms = [];
      for ( var i = 0 ; i < forwards.length ; i++ ) {
        var method = forwards[i];
        axioms.push(foam.core.ProxiedMethod.create({
          name: method.name,
          returns: method.returns,
          property: name,
          args: method.args
        }));
      }

      for ( var i = 0 ; i < delegates.length ; i++ ) {
        var method = delegates[i];
        axioms.push(foam.core.ProxiedMethod.create({
          name: method.name,
          returns: method.returns,
          property: name,
          args: method.args,
          delegate: true
        }));
      }

      if ( ! this.topics || this.topics.length ) {
        axioms.push(foam.core.ProxySub.create({
          topics: this.topics,
          prop:   this.name
        }));
      }

      cls.installAxioms(axioms);
    }
  ]
});

/**
 * ProxiedMethod is a type of method that delegates or forwards calls
 * to a delegate object.  It is used as an implementation detail of the
 * Proxy axiom
 *
 * Delegation means that the delegate object's implementation is called with
 * "this" still being the original object.
 *
 * Forwarding means that the method call is simply "forwarded" to the delegate
 * object.  "this" will be the delegate object.
 */
foam.CLASS({
  package: 'foam.core',
  name: 'ProxiedMethod',
  extends: 'Method',

  properties: [
    {
      class: 'String',
      name: 'property'
    },
    {
      class: 'Boolean',
      name: 'delegate',
      value: false
    },
    {
      name: 'code',
      expression: function(name, property, returns, delegate) {
        return delegate ?
            function delegate() {
              return this[property][name].apply(this, arguments);
            } :
            function forward() {
              return this[property][name].apply(this[property], arguments);
            } ;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'EventProxy',

  properties: [
    {
      name: 'dest'
    },
    {
      name: 'topic',
      factory: function() { return []; }
    },
    {
      class: 'Boolean',
      name: 'active',
      value: false,
      postSet: function(old, a) {
        for ( var key in this.children ) {
          this.children[key].active = ! a;
        }

        if ( old !== a ) {
          if ( a ) {
            this.doSub();
          } else {
            this.doUnsub();
          }
        }
      }
    },
    {
      name: 'parent'
    },
    {
      name: 'children',
      factory: function() {
        return {};
      }
    },
    {
      name: 'src',
      postSet: function(o, src) {
        if ( this.active ) this.doSub();
        for ( var key in this.children ) {
          this.children[key].src = src;
        }
      }
    },
    {
      name: 'subscription'
    }
  ],

  methods: [
    function init() {
      this.onDetach(foam.Function.bind(function() {
        this.subscription && this.subscription.detach();

        if ( this.parent ) {
          this.parent.removeChild(this);
          this.parent.active = true;
        }
      }, this));
    },

    function doSub() {
      if ( this.subscription ) this.subscription.detach();

      if ( ! this.src ) return;

      var args = this.topic.slice()
      args.push(this.onEvent);
      this.subscription = this.src.sub.apply(this.src, args);
    },

    function doUnsub() {
      if ( this.subscription ) this.subscription.detach();
    },

    function removeChild(c) {
      for ( var key in this.children ) {
        if ( this.children[key] === c ) {
          delete this.children[key];
          return;
        }
      }
    },

    function getChild(key) {
      if ( ! this.children[key] ) {
        this.children[key] = this.cls_.create({
          parent: this,
          dest: this.dest,
          src: this.src,
          topic: this.topic.slice().concat(key)
        });
      }
      return this.children[key];
    },

    function addProxy(topic) {
      var c = this;
      var active = true;
      for ( var i = 0 ; i < topic.length ; i++ ) {
        active = active && ! c.active;
        c = c.getChild(topic[i]);
      }

      c.active = active;
    }
  ],

  listeners: [
    function onEvent(s) {
      if ( this.active ) {
        var args = foam.Function.appendArguments([], arguments, 1);
        var c = this.dest.pub.apply(this.dest, args);
        if ( ! c ) this.detach();
      }
    }
  ]
});

foam.CLASS({
  package: 'foam.core',
  name: 'ProxySub',
  extends: 'Method',

  properties: [
    {
      name: 'name',
      getter: function() {
        return 'sub';
      }
    },
    {
      class: 'String',
      name: 'prop'
    },
    {
      class: 'StringArray',
      name: 'topics',
      factory: null
    },
    {
      name: 'code',
      expression: function(prop, topics) {
        var privateName = prop + 'EventProxy_';
        return function subProxy(a1) {
          if ( ! topics || topics.indexOf(a1) != -1 ) {
            var proxy = this.getPrivate_(privateName);
            if ( ! proxy ) {
              proxy = foam.core.EventProxy.create({
                dest: this,
                src: this[prop]
              });
              this.setPrivate_(privateName, proxy);

              proxy.src$.follow(this.slot(prop));
            }

            proxy.addProxy(Array.from(arguments).slice(0, -1));
          }

          return this.SUPER.apply(this, arguments);
        };
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'PromisedMethod',
  extends: 'ProxiedMethod',

  properties: [
    {
      name: 'code',
      expression: function(name, property, returns, delegate) {
        if ( delegate ) {
          return returns ?
            function() {
              var self = this;
              var args = arguments;
              return this[property].then(function(d) {
                return d[name].apply(self, args);
              });
            } :
            function() {
              var self = this;
              var args = arguments;
              this[property].then(function(d) {
                d[name].apply(self, args);
              });
            };
        }
        return returns ?
          function() {
            var self = this;
            var args = arguments;
            return this[property].then(function(d) {
              return d[name].apply(d, args);
            });
          } :
          function() {
            var self = this;
            var args = arguments;
            this[property].then(function(d) {
              d[name].apply(d, args);
            });
          };
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Promised',
  extends: 'Property',

  properties: [
    {
      name: 'of',
      required: true
    },
    {
      class: 'StringArray',
      name: 'methods',
      value: null,
      factory: null
    },
    {
      class: 'StringArray',
      name: 'topics',
      value: null,
      factory: null
    },
    {
      name: 'postSet',
      expression: function(name) {
        var stateName    = name + 'State';
        var delegateName = name + 'Delegate';
        return function(_, p) {
          var self = this;
          this[stateName]    = undefined;
          this[delegateName] = undefined;

          p.then(function(d) { self[delegateName] = d; });
        };
      }
    }
  ],

  methods: [
    function installInClass(cls) {
      this.SUPER(cls);

      var myName         = this.name;
      var stateName      = this.name + 'State';
      var delegateName   = this.name + 'Delegate';
      var pendingState   = 'Pending' + foam.String.capitalize(myName);
      var fulfilledState = 'Fulfilled' + foam.String.capitalize(myName);

      var delegate = this.lookup(this.of);

      function resolveName(name) {
        var m = delegate.getAxiomByName(name);
        foam.assert(foam.core.Method.isInstance(m), 'Cannot proxy non-method', name);
        return m;
      }

      var methods = this.methods ?
          this.methods.map(resolveName) :
          delegate.getOwnAxiomsByClass(foam.core.Method);

      var methodNames = methods.map(function(m) { return m.name; });

      var myAxioms = [
        foam.core.Proxy.create({
          name:      stateName,
          of:        this.of,
          delegates: methodNames,
          forwards:  [],
          factory: function() {
            return this[pendingState].create();
          },
          transient: true
        }),
        foam.core.Property.create({
          name: delegateName,
          postSet: function() {
            this[stateName] = this[fulfilledState].create();
          }
        }),
        foam.core.ProxySub.create({
          topics: this.topics,
          prop:   delegateName
        })
      ];

      var pendingMethods = [];

      for ( var i = 0 ; i < methods.length ; i++ ) {
        pendingMethods.push(foam.core.PromisedMethod.create({
          name: methods[i].name,
          property: myName,
          returns:  methods[i].returns,
          delegate: false
        }));
      }

      var name = this.name;
      myAxioms = myAxioms.concat(
        foam.core.InnerClass.create({
          model: {
            name: pendingState,
            axioms: [
              foam.pattern.Singleton.create()
            ],
            methods: pendingMethods
          }
        }),
        foam.core.InnerClass.create({
          model: {
            name: fulfilledState,
            properties: [
              {
                class:    'Proxy',
                name:     delegateName,
                of:       this.of,
                topics:   this.topics,
                forwards: methodNames
              }
            ],
            axioms: [
              foam.pattern.Singleton.create()
            ]
          }
        }));

      cls.installAxioms(myAxioms);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core.internal',
  name: 'InterfaceMethod',
  extends: 'foam.core.Method',

  documentation: 'An InterfaceMethod is a Method declaration, but lacks code.',

  properties: [
    {
      name: 'code',
      required: false
    },
    {
      class: 'Boolean',
      name: 'abstract',
      value: true
    }
  ],

  methods: [
    function installInProto() { }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'InterfaceModel',
  extends: 'foam.core.Model',

  documentation: 'An Interface Mode/definition. Created with foam.INTERFACE().',

  properties: [
    [ 'extends', 'foam.core.AbstractInterface' ],
    {
      class: 'AxiomArray',
      name: 'methods',
      of: 'foam.core.internal.InterfaceMethod'
    },
    {
      class: 'StringArray',
      name: 'javaExtends'
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'AbstractInterface',

  documentation: 'Abstract base-class for Interfaces.',

  axioms: [
    {
      installInClass: function(cls) {
        cls.create = function() {
          throw new Error("Cannot instantiate an Interface.");
        };
      }
    }
  ]
});


foam.LIB({
  name: 'foam',

  methods: [
    function INTERFACE(m) {

      m.class = m.class || 'foam.core.InterfaceModel';
      // if m.implements not defined, add it as an array, otherwise add its content
      // in an array
      if ( ! m.implements ) {
        m.implements = [];
      } else if ( typeof m.implements === 'string' ) {
        m.implements = [m.implements];
      }
      // adds m.extends content to m.implements and then remove it
      if ( m.extends ) {
        if ( typeof m.extends === 'string' ) {
          m.implements.push(m.extends);
        } else if( m.extends.length > 0 ) {
          m.implements = m.implements.concat(m.extends);
        }
        delete m.extends;
      }
      foam.CLASS(m);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'ContextMethod',
  extends: 'foam.core.Method',

  documentation: 'A Method which has the call-site context added as the first argument when exported. See use in foam.u2.U2Context.E',

  methods: [
    function exportAs(obj) {
      var m = obj[this.name];

      return function() {
        var ctx = foam.core.FObject.isInstance(this) ? this.__context__ : this;

        return m.apply(obj, foam.Function.appendArguments([ctx], arguments, 0));
      };
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'Window',

  documentation: function(){/*
    Encapsulates top-level window/document features.

    Export common window/document services through the Context.

    Rather than using window or document directly, objects should import: the
    services that foam.core.Window exports:, and then access them as this.name,
    rather than as console.name or document.name.

    All FObjects already import: [ 'error', 'log', 'warn' ], meaning
    that these do not need to be explicitly imported.

    This is done to remove dependency on the globals 'document' and 'window',
    which makes it easier to write code which works with multiple windows.

    It also allows for common services to be decorated, trapped, or replaced
    in sub-contexts (for example, to replace console.error and console.warn when
    running test).

    A foam.core.Window is installed by FOAM on starup for the default
    window/document, but if user code opens a new Window, it should create
    and install a new foam.core.Window explicitly.
  */},

  exports: [
    'getElementsByClassName',
    'getElementById',
    'async',
    'cancelAnimationFrame',
    'clearInterval',
    'clearTimeout',
    'console',
    'debug',
    'delayed',
    'document',
    'error',
    'framed',
    'info',
    'installCSS',
    'log',
    'merged',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout',
    'warn',
    'window'
  ],

  properties: [
    [ 'name', 'window' ],
    'window',
    {
      name: 'document',
      factory: function() { return this.window.document; }
    },
    {
      name: 'console',
      factory: function() { return this.window.console; }
    }
  ],

  methods: [
    function getElementById(id) {
      return this.document.getElementById(id);
    },

    function getElementsByClassName(cls) {
      return this.document.getElementsByClassName(cls);
    },

    function debug() {
      this.console.debug.apply(this.console, arguments);
    },

    function error() {
      this.console.error.apply(this.console, arguments);
    },

    function info() {
      this.console.info.apply(this.console, arguments);
    },

    function log() {
      this.console.log.apply(this.console, arguments);
    },

    function warn() {
      this.console.warn.apply(this.console, arguments);
    },

    function async(l) {
      /* Decorate a listener so that the event is delivered asynchronously. */
      return this.delayed(l, 0);
    },

    function delayed(l, delay) {
      /* Decorate a listener so that events are delivered 'delay' ms later. */
      return foam.Function.bind(function() {
        this.setTimeout(
          function() { l.apply(this, arguments); },
          delay);
      }, this);
    },

    function merged(l, opt_delay) {
      var delay = opt_delay || 16;
      var ctx     = this;

      return foam.Function.setName(function() {
        var triggered = false;
        var lastArgs  = null;
        function mergedListener() {
          triggered = false;
          var args = Array.from(lastArgs);
          lastArgs = null;
          l.apply(this, args);
        }

        var f = function() {
          lastArgs = arguments;

          if ( ! triggered ) {
            triggered = true;
            ctx.setTimeout(mergedListener, delay);
          }
        };

        return f;
      }(), 'merged(' + l.name + ')');
    },

    function framed(l) {
      var ctx = this;

      return foam.Function.setName(function() {
        var triggered = false;
        var lastArgs  = null;
        function frameFired() {
          triggered = false;
          var args = lastArgs;
          lastArgs = null;
          l.apply(this, args);
        }

        var f = function framed() {
          lastArgs = arguments;

          if ( ! triggered ) {
            triggered = true;
            ctx.requestAnimationFrame(frameFired);
          }
        };

        return f;
      }(), 'framed(' + l.name + ')');
    },

    function setTimeout(f, t) {
      return this.window.setTimeout(f, t);
    },
    function clearTimeout(id) {
      this.window.clearTimeout(id);
    },

    function setInterval(f, t) {
      return this.window.setInterval(f, t);
    },
    function clearInterval(id) {
      this.window.clearInterval(id);
    },

    function requestAnimationFrame(f) {
      return this.window.requestAnimationFrame(f);
    },
    function cancelAnimationFrame(id) {
      this.window.cancelAnimationFrame(id);
    },
    function installCSS(text) {
      /* Create a new <style> tag containing the given CSS code. */
      this.document.head.insertAdjacentHTML('beforeend',
          '<style>' + text + '</style>');
    }
  ]
});


/*
 * requestAnimationFrame is not available on nodejs,
 * so swap out with calls to setTimeout.
 */
if ( foam.isServer ) {
  foam.CLASS({
    refines: 'foam.core.Window',
    methods: [
      function requestAnimationFrame(f) {
        return this.setTimeout(f, 16);
      },
      function cancelAnimationFrame(id) {
        this.clearTimeout(id);
      }
    ]
  });
}


// Replace top-level Context with one which includes Window's exports.
foam.__context__ = foam.core.Window.create(
  { window: global },
  foam.__context__
).__subContext__;
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.core.internal',
  name: 'ContextMultipleInheritence',
  
  exports: [
    'createSubContext'
  ],

  methods: [
    {
      class: 'ContextMethod',
      name: 'createSubContext',
      code: function createSubContext(X, opt_args, opt_name) {
        // TODO(adamvy): Revisit this.  Consider adding a MultiContext object which
        // implemented context multiple inheritence property.
        if ( foam.core.FObject.isInstance(opt_args) ) {
          var obj = opt_args;

          var exports = obj.cls_.getAxiomsByClass(foam.core.Export);

          if ( ( ! exports ) || ( ! exports.length ) ) return X;

          opt_args = exports[0].getExportMap.call(obj);
        }

        return this.__context__.createSubContext.call(X, opt_args, opt_name);
      }
    }
  ]
});

(function() {
  var tmp = foam.core.internal.ContextMultipleInheritence.create();
  tmp.setPrivate_('__context__', foam.__context__);
  foam.__context__ = tmp.__subContext__;
})();
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.classloader',
  name: 'ModelARequireExtension',
  refines: 'foam.core.Model',

  methods: [
    function arequire(opt_deps) {
      var X = this.__context__;
      var promises = [];
      if ( this.extends ) promises.push(X.arequire(this.extends, opt_deps));

      for ( var i = 0, a; a = this.axioms_[i]; i++ ) {
        if ( a.arequire ) promises.push(a.arequire(opt_deps));
      }

      return Promise.all(promises);
    }
  ]
});


foam.CLASS({
  package: 'foam.classloader',
  name: 'RequiresARequireExtension',
  refines: 'foam.core.Requires',

  methods: [
    function arequire(opt_deps) {
      return this.__context__.arequire(this.path, opt_deps);
    }
  ]
});


foam.CLASS({
  package: 'foam.classloader',
  name: 'ClassLoader',

  documentation: 'Asynchronous class loader service. Loads classes dynamically.',

  exports: [
    'arequire'
  ],

  properties: [
    {
      name: 'pending',
      class: 'Object',
      factory: function() { return {}; }
    }
  ],

  methods: [
    {
      name: 'arequire',
      class: 'foam.core.ContextMethod',
      code: function(X, modelId, opt_deps) {
        // Contains models that depend on the modelId and have already been
        // arequired. Used to avoid circular dependencies from waiting on
        // each other.
        var deps = opt_deps || {};

        if ( X.isRegistered(modelId) ) return Promise.resolve();
        if ( deps[modelId] ) return Promise.resolve();
        if ( this.pending[modelId] ) return this.pending[modelId];
        deps[modelId] = true;

        var modelDao = X[foam.String.daoize(foam.core.Model.name)];
        this.pending[modelId] = modelDao.find(modelId).then(function(m) {
          // Model validation may make use of deps. Require them first, then
          // validate the model.
          foam.assert(m, 'Cannot find ' + modelId);
          return m.arequire(deps).then(function() {
            m.validate();
            return m;
          });
        }).then(function(m) {
          if ( X.isRegistered(modelId) ) return m;

          if ( m.refines ) {
            foam.CLASS(m);
            return m;
          }

          m.id = m.package ? m.package + '.' + m.name : m.name;
          foam.UNUSED[m.id] = true;

          var f = foam.Function.memoize0(function() {
            delete foam.UNUSED[m.id];
            var c = m.buildClass();
            c.validate();
            foam.USED[m.id] = c;
            return c;
          });

          // Register model in global context and global namespace.
          foam.__context__.registerFactory(m, f);
          foam.package.registerClassFactory(m, f);
          return m;
        });

        var self = this;
        this.pending[modelId].then(function() {
          delete self.pending[modelId];
        });

        return this.pending[modelId];
      }
    }
  ]
});

// Export ClassLoader.arequire by overwriting global context with
// ClassLoader's sub-context.
foam.__context__ = foam.classloader.ClassLoader.create(
  {},
  foam.__context__
).__subContext__;
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.LIB({
  name: 'foam.Function',

  methods: [
    (function() {
      var ret = function resolveTypeString(typeStr) {
        /** Looks up a type as a FOAM class, stdlib String, Number, etc., or 'any' */
        // missing types are checked for _after_ the body comment is checked
        if ( ! typeStr ) return undefined;

        typeStr = typeStr.trim();
        if ( typeStr.substring(typeStr.length - 2) === '[]' ) {
          return foam.Array;
        }
        if ( typeStr === 'any' ) {
          return undefined;
        }

        // otherwise look for foam.<primitive> type
        cls = foam[typeStr];
        if ( cls ) return cls;

        var cls = foam.lookup(typeStr, true);
        if ( cls ) return cls;

        // could not resolve
        throw new TypeError('foam.Function.args could not resolve type ' +
          typeStr);
      };
      ret.isTypeChecked__ = true;
      return ret;
    })(),

    function args(fn) {
      /**
       * Extracts the arguments and their types from the given function.
       * @param {Function} fn The function to extract from. The toString() of the function
       *     must be accurate.
       * @return {Array} An array of Argument objects.
       */
      // strip newlines and find the function(...) declaration
      var args = foam.Function.argsStr(fn);

      if ( ! args ) return [];

      args += ','; // easier matching

      var ret = [];
      var retMapByName = {};
      // check each arg for types
      // Optional commented type(incl. dots for packages), argument name,
      // optional commented return type
      // ws [/* ws package.type? ws */] ws argname ws [/* ws retType ws */]
      var argIdx = 0;
      var argMatcher = /(\s*\/\*\s*(\.\.\.)?([\w._$\[\]]+)(\=)?\s*(\/\/\s*(.*?))?\s*\*\/)?\s*(\.\.\.)?([\w_$]+)\s*(\/\*\s*([\w._$\[\]]+)(\?)?\s*\*\/)?\s*\,+/g;
      var typeMatch;

      while ( typeMatch = argMatcher.exec(args) ) {
        // if can't match from start of string, fail
        if ( argIdx === 0 && typeMatch.index > 0 ) break;

        if ( ret.returnType ) {
          throw new SyntaxError('foam.Function.args return type \'' +
            ret.returnType.typeName +
            '\' must appear after the last argument only: ' +
            args.toString() + '\n' +
            'For function:\n' +
            fn.toString() + '\n'

          );
        }

        // record the argument
        var arg = foam.core.Argument.create({
          name:          typeMatch[8],
          typeName:      typeMatch[3],
          type:          this.resolveTypeString(typeMatch[3]),
          optional:      true, //typeMatch[4] === '=', // TODO: mandatory
          repeats:       typeMatch[2] === '...' || typeMatch[7] === '...',
          index:         argIdx++,
          documentation: typeMatch[6]
        });
        ret.push(arg);
        retMapByName[arg.name] = arg;

        // if present, record return type (if not the last arg, we fail on the
        // next iteration)
        if ( typeMatch[9] ) {
          ret.returnType = foam.core.Argument.create({
            name: 'ReturnValue',
            optional: typeMatch[11],
            typeName: typeMatch[10]
          });
        }
      }

      if ( argIdx === 0 ) {
        // check for bare return type with no args
        typeMatch = args.match(/^\s*\/\*\s*([\w._$\[\]]+)(\=)?\s*\*\/\s*/);
        if ( typeMatch && typeMatch[1] ) {
          foam.assert(! ret.returnType,
            'foam.Function.args found two return types: ' + fn.toString());
          ret.returnType = foam.core.Argument.create({
            name: 'ReturnValue',
            optional: typeMatch[2] === '=',
            typeName: typeMatch[1]
          });
        } else {
          throw new SyntaxError(
              'foam.Function.args argument parsing error:\n' +
              args.toString() + '\n' +
            'For function:\n' +
            fn.toString() + '\n'
          );
        }
      }

      // Also pull args out of the documentation comment (if inside the body
      // so we can access it)
      var comment = foam.Function.functionComment(fn);
      if ( comment ) {
        // match @arg or @param {opt_type} arg_name
        var commentMatcher = /.*(\@arg|\@param|\@return)\s+(?:\{(\.\.\.)?([\w._$\[\]]+)(\=)?\}\s+)?(.*?)\s+(?:([^\@]*))?/g;
        var commentMatch;
        while ( commentMatch = commentMatcher.exec(comment) ) {
          var name     = commentMatch[5];
          var optional = commentMatch[4] === '=';
          var repeats  = commentMatch[2] === '...';
          var type     = commentMatch[3];
          var docs     = commentMatch[6] && commentMatch[6].trim();

          if ( commentMatch[1] === '@return' ) {
            if ( ret.returnType ) {
              throw new SyntaxError(
                  'foam.Function.args duplicate return type ' +
                  'definition in block comment: \"' +
                  type + '\" from \:\n' + fn.toString());
            }

            ret.returnType = foam.core.Argument.create({
              name: 'ReturnValue',
              optional: optional,
              repeats: repeats,
              typeName: type,
              type: this.resolveTypeString(type),
              documentation: docs
            });
          } else {
            // check existing args
            if ( retMapByName[name] ) {
              if ( retMapByName[name].typeName ) {
                throw new SyntaxError(
                    'foam.Function.args duplicate argument ' +
                    'definition in block comment: \"' +
                    name + '\" from:\n' + fn.toString());
              }

              retMapByName[name].typeName      = type;
              retMapByName[name].optional      = optional;
              retMapByName[name].repeats       = repeats;
              retMapByName[name].documentation = docs;
              retMapByName[name].type          = this.resolveTypeString(type);
            } else {
              var arg = foam.core.Argument.create({
                name:          name,
                optional:      optional,
                repeats:       repeats,
                typeName:      type,
                index:         argIdx++,
                documentation: docs
              });
              ret.push(arg);
              retMapByName[arg.name] = arg;
            }
          }
        }
      }

      // Check for missing types
      var missingTypes = [];
      for ( var i = 0; i < ret.length; i++ ) {
        if ( ! ret[i].typeName ) missingTypes.push(ret[i].name);
      }

      if ( missingTypes.length ) {
        //(this.warn || console.warn)('Missing type(s) for ' +
        //  missingTypes.join(', ') + ' in:\n' + fn.toString());
      }

      return ret;
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Argument',

  documentation: 'Describes one argument of a function or method.',

  properties: [
    {
      /** The name of the argument */
      name: 'name'
    },
    {
      name: 'of'
    },
    {
      /**
       * The string name of the type
       * (either a model name or foam.String, foam.Function, etc. or [])
       */
      name: 'typeName'
    },
    {
      /**
       * If set, this holds the actual FOAM Class or LIB represented
       * by typeName.
       */
      name: 'type',
      factory: function() {
        return foam.Function.resolveTypeString(this.typeName) || null;
      }
    },
    {
      /** If true, indicates that this argument is optional. */
      name: 'optional', value: false
    },
    {
      /** If true, indicates a variable number of arguments. */
      name: 'repeats', value: false
    },
    {
      /** The index of the argument (the first argument is at index 0). */
      name: 'index', value: -1
    },
    {
      /** The documentation associated with the argument (denoted by a // ) */
      name: 'documentation', value: ''
    }
  ],

  methods: [
    (function() {
      var validate = function validate(arg) {
        /**
          Validates the given argument against this type information.
          If any type checks are failed, a TypeError is thrown.
         */
        if ( ! this.type ) {
          // no type, no check to perform
          return;
        }

        var i = ( this.index >= 0 ) ? ' ' + this.index + ', ' : ', ';

        // optional check
        if ( foam.Null.isInstance(arg) || foam.Undefined.isInstance(arg) ) {
          if ( ! this.optional ) {
            throw new TypeError(
              'Argument ' + i + this.name + ' {' + this.typeName + '}' +
                ', is not optional, but was undefined in a function call');
          }

          return; // value is undefined, but ok with that
        }

        // have a modelled type
        if ( ! this.type.isInstance(arg) ) {
          var gotType = (arg.cls_) ? arg.cls_.name : typeof arg;
          throw new TypeError(
              'Argument ' + i + this.name +
              ', expected type ' + this.typeName + ' but passed ' + gotType);
        }
      };

      validate.isTypeChecked__ = true; // avoid type checking this method
      return validate;
    })()
  ]
});

foam.CLASS({
  refines: 'foam.core.Method',
  properties: [
    {
      class: 'FObjectArray',
      of: 'foam.core.Argument',
      name: 'args',
      adaptArrayElement: function(e, obj) {
        var ctx = obj.__subContext__ || foam;
        var of = e.class || this.of;
        var cls = ctx.lookup(of);

        return cls.isInstance(e) ? e :
          foam.String.isInstance(e) ? cls.create({ name: e }) :
          cls.create(e, obj);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/*
  A -> foo(C)
       foo(D)
  B -> foo(C)

  How does B.foo(D) work?
  Copy methods? Then what if A gets refined?
  Lookup B.foo, otherwise lookup A.foo()?
    Then what about FObject vs. particular class lookup?
  What about treating 'this' as first argument?
*/

foam.CLASS({
  package: 'foam.core',
  name: 'MultiMethod',
  extends: 'foam.core.AbstractMethod',

  properties: [
    {
      name: 'name',
      factory: function() {
        return this.methodName +
          this.args.map(function(a) { return a.typeName; }).join(':');
      }
    },
    {
      name: 'methodName',
      required: true
    }
  ],

  methods: [
    function installInProto(proto) {
      var key = this.cls_.id.replace(/\./g,':') + ':' + this.methodName;
      console.log('Installing: ' + key);
      var dispath = this.createDispatch(proto, key, 0, this.args);
      displatch.code = this.code;
    },

    function createDispatch(proto, prefix, pos, args) {
      var d = proto[prefix];

      if ( ! d ) {
        var prefix2 = prefix + ':' + args[pos] + typeName;
        proto[prefix] = function dispatch() {
          if ( arguments.length === pos ) {
            return arguments.callee.code.apply(this, arguments);
          }
          var t = foam.typeOf(arguments[pos]);
          var f = t[prefix2];
          return f.apply(this, arguments);
        };
      }

      if ( pos === args.length ) return proto[prefix];
    },

    function exportAs(obj) {
      var m = obj[this.name];
      /** Bind the method to 'this' when exported so that it still works. **/
      return function exportedMethod() { return m.apply(obj, arguments); };
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.pattern',
  name: 'Singleton',

  documentation: `
  A Singleton Axiom, when added to a Class, makes it implement
  the Singleton Pattern, meaning that all calls to create()
  will return the same (single) instance.
  `,

  properties: [ [ 'name', 'create' ] ],

  methods: [
    function installInClass(cls) {
      /** @param {any} cls */
      var oldCreate = cls.create;
      var newCreate = cls.create = function() {
        // This happens when a newer Axiom replaces create().
        // If this happens, don't apply Singleton behaviour.
        if ( this.create !== newCreate )
          return oldCreate.apply(this, arguments);

        return this.private_.instance_ ||
            ( this.private_.instance_ = oldCreate.apply(this, arguments) );
      };
    },

    function installInProto(p) {
      // Not needed, but improves performance.
      p.clone  = function() { return this; };
      p.equals = function(o) { /** @param {any=} o */ return this === o; };
    }
  ]
});

// We only need one Singleton, so make it a Singleton.
foam.CLASS({
  refines: 'foam.pattern.Singleton',
  axioms: [ foam.pattern.Singleton.create() ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  A Multiton Axiom, when added to a Class, makes it implement
  the Multiton Pattern, meaning that calls to create() with
  the same value for the specified 'property', will return the
  same instance.

  Ex.:
  foam.CLASS({
    name: 'Color',
    axioms: [ foam.pattern.Multiton.create({property: 'color'}) ],
    properties: [ 'color' ],
    methods: [ function init() { log('Creating Color:', this.color); } ]
  });

  var red1 = Color.create({color: 'red'});
  var red2 = Color.create({color: 'red'});
  var blue = Color.create({color: 'blue'});

  log(red1 === red2); // true, same object
  log(red1 === blue); // false, different objects
*/
foam.CLASS({
  package: 'foam.pattern',
  name: 'Multiton',

  properties: [
    [ 'name', 'create' ],
    {
      // FUTURE: switch to 'properties' to support multiple keys when/if needed.
      class: 'String',
      name: 'property'
    }
  ],

  methods: [
    function installInClass(cls) {
      var property  = this.property;
      var oldCreate = cls.create;

      cls.create = function(args) {
        var instances = this.private_.instances ||
            ( this.private_.instances = {} );
        var key = args[property];

        // If key isn't provided, try using property.value instead
        if ( key === undefined ) {
          key = cls.getAxiomByName(property).value;
        }

        return instances[key] ||
            ( instances[key] = oldCreate.apply(this, arguments) );
      };
    },

    function installInProto(p) {
      // Not needed, but improves performance.
      p.clone  = function() { return this; };
      p.equals = function(o) { return this === o; };
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

/**
 * For those familiar with Java, FOAM Enums are very similar to Java enums in
 * design.
 *
 * An Enum is essentially a class with a fixed number of named instances.
 * The instances are frequently referred to as Enum Values, or the 'values'
 * of an Enum.
 *
 * Enums have most of the features available to FOAM classes, including
 * properties, methods, constants, templates, and listeners.
 *
 * Enums extend from FObject, so they inherit FObject features such as
 * pub/sub events, diffing, hashCode, etc.
 *
 * Enums also have a few built-in properties by default. Every Enum has an
 * 'ordinal' property, which is a integer unique to all the Enum Values of a
 * particular Enum. Each enum also has a 'name' property, which is the name
 * given to each Enum Value.
 *
 * Example usage:
 * <pre>
 * // To define an enum we use the foam.ENUM() function.
 * foam.ENUM({
 *   name: 'IssueStatus',
 *
 *   // Enums share many features with regular classes, the properties
 *   // and methods we want our enums to have are defined as follows.
 *   properties: [
 *     {
 *       class: 'Boolean',
 *       name: 'consideredOpen',
 *       value: true
 *     }
 *   ],
 *
 *   methods: [
 *     function foo() {
 *       return this.label + ( this.consideredOpen ? ' is' : ' is not' ) +
 *           ' considered open.';
 *     }
 *   ],
 *
 *   // Use the values: key to define the actual Enum Values that we
 *   // want to exist.
 *   values: [
 *     {
 *       name: 'OPEN'
 *     },
 *     {
 *       // The ordinal can be specified explicitly.
 *       name: 'CLOSED',
 *       ordinal: 100
 *     },
 *     {
 *       // If the ordinal isn't given explicitly it is auto assigned as
 *       // the previous ordinal + 1
 *       name: 'ASSIGNED'
 *     },
 *     {
 *       // You can specify the label, which will be used when rendering in a
 *       // combo box or similar
 *       name: 'UNVERIFIED',
 *       label: 'Unverified'
 *     },
 *     {
 *       // Values for additional properties to your enum are also defined
 *       // inline.
 *       name: 'FIXED',
 *       label: 'Fixed',
 *       consideredOpen: false
 *     }
 *   ]
 * });
 *
 * console.log(IssueStatus.OPEN.name); // outputs "OPEN"
 * console.log(IssueStatus.ASSIGNED.consideredOpen); // outputs "true"
 *
 * // Enum value ordinals can be specified.
 * console.log(IssueStatus.CLOSED.ordinal); // outputs 100
 * // values without specified ordinals get auto assigned.
 * console.log(IssueStatus.ASSIGNED.ordinal); // outputs 101
 *
 * // Methods can be called on the enum values.
 * // outputs "Fixed is not considered open."
 * console.log(IssueStatus.FIXED.foo());
 *
 * // To store enums on a class, it is recommended to use the Enum property
 * // type.
 * foam.CLASS({
 *   name: 'Issue',
 *   properties: [
 *     {
 *       class: 'Enum',
 *       of: 'IssueStatus',
 *       name: 'status'
 *     }
 *   ]
 * });
 *
 * var issue = Issue.create({ status: IssueStatus.UNVERIFIED });
 * console.log(issue.status.label); // outputs "Unverified"
 *
 * // Enum properties give you some convenient adapting.
 * // You can set the property to the ordinal or the
 * // name of an enum, and it will set the property
 * // to the correct Enum value.
 *
 * issue.status = 100;
 *
 * issue.status === IssueStatus.CLOSED; // is true
 *
 * // Enum properties also allow you to assign them via the name
 * // of the enum.
 *
 * issue.status = "ASSIGNED"
 *
 * issue.status === IssueStatus.ASSIGNED; // is true
 *
 * The extent of all Enum values can be accessed from either the collection or from any
 * individual Enum value:
 * console.log(IssueStatus.VALUES, IssueStatus.CLOSED.VALUES);
 *
 * Values can be specified as just Strings if you don't want to explicitly set the label
 * or ordinal. Ex.:
 *
 * foam.ENUM({
 *  name: 'DaysOfWeek',
 *  values: [
 *    'SUNDAY',
 *    'MONDAY',
 *    'TUESDAY',
 *    'WEDNESDAY',
 *    'THURSDAY',
 *    'FRIDAY',
 *    'SATURDAY'
 *  ]
 * });
 *
 * </pre>
 */
// TODO: Make extend Model so can override methods (or do some other way).
foam.CLASS({
  package: 'foam.core.internal',
  name: 'EnumValueAxiom',

  documentation: 'The definition of a single Enum value.',

  properties: [
    {
      name: 'ordinal',
      getter: function() { return this.definition.ordinal; },
      setter: function(o) { this.definition.ordinal = o; }
    },
    {
      name: 'name',
      getter: function() { return this.definition.name; }
    },
    'definition'
  ],

  methods: [
    function installInClass(cls) {
      var e = cls.create(this.definition);
      cls.installConstant(this.name, e);
      cls.VALUES.push(e);
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'EnumModel',
  extends: 'Model',

  documentation: 'Model for defining Enum(erations).',

  properties: [
    [ 'extends', 'foam.core.AbstractEnum' ],
    {
      class: 'AxiomArray',
      of: 'foam.core.internal.EnumValueAxiom',
      name: 'values',
      adapt: function(_, v) {
        var used = {}; // map of ordinals used to check for duplicates

        var next = 0;
        for ( var i = 0 ; i < v.length ; i++ ) {
          var def = v[i];

          if ( foam.String.isInstance(def) ) {
            def = { label: def, name: foam.String.constantize(def) };
          }

          if ( def.ordinal || def.ordinal === 0 ) {
            next = def.ordinal + 1;
          } else {
            def.ordinal = next++;
          }

          if ( ! foam.core.internal.EnumValueAxiom.isInstance(def) ) {
            v[i] = def = foam.core.internal.EnumValueAxiom.create({definition: def});
          }

          if ( used[def.ordinal] ) {
            throw this.id +
                ' Enum error: duplicate ordinal found ' + def.name + ' ' +
                used[def.ordinal] + ' both have an ordinal of ' + def.ordinal;
          }

          used[def.ordinal] = def.name;
        }

        return v;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'AbstractEnum',

  documentation: 'Abstract base class for all Enum classes.',

  axioms: [
    foam.pattern.Multiton.create({property: 'ordinal'}),
    {
      installInClass: function(cls) {
        // Each sub-class of AbstractEnum gets it's own VALUES array.
        Object.defineProperty(cls, 'VALUES', {
          get: function() {
            return this.private_.VALUES || ( this.private_.VALUES = [] );
          },
          configurable: true,
          enumerable: false
        });
      },
      installInProto: function(p) {
        Object.defineProperty(p, 'VALUES', {
          get: function() { return this.cls_.VALUES; },
          configurable: true,
          enumerable: false
        });
      }
    }
  ],

  properties: [
    { name: 'documentation', adapt: function(_, d) { return typeof d === 'function' ? foam.String.multiline(d).trim() : d; } },
    {
      class: 'Int',
      name: 'ordinal',
      // NOTE: Default value of -1 forces legitimate values (starting at 0) to
      // all be non-default. This is important for, e.g., serialization of enum
      // values:
      // https://github.com/foam-framework/foam2/issues/637
      value: -1,
      final: true
    },
    {
      class: 'String',
      name: 'name',
      final: true
    },
    {
      class: 'String',
      name: 'label',
      final: true,
      factory: function() {
        return this.name;
      }
    }
  ],

  methods: [
    function toString() { return this.name; }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Enum',
  extends: 'Property',

  documentation: 'A Property type for storing enum values.',

  properties: [
    {
      class: 'Class',
      name: 'of',
      required: true
    },
    {
      name: 'value',
      adapt: function(_, n) {
        if ( foam.String.isInstance(n) ) n = this.of[n];
        return n
      },
      expression: function(of) {
        return of && of.VALUES[0];
      },
    },
    {
      name: 'javaValue',
      expression: function(of, value) {
        return of.id + '.' + value;
      },
    },
    [
      'adapt',
      function(o, n, prop) {
        var of = prop.of;

        if ( n && n.cls_ === of ) return n;

        var type = foam.typeOf(n), ret;

        if ( type === foam.String ) {
          ret = of[foam.String.constantize(n)];
        } else if ( type === foam.Number ) {
          ret = of.create({ordinal: n}, foam.__context__);
        }

        if ( ret ) return ret;

        throw 'Attempt to set invalid Enum value. Enum: ' + of.id + ', value: ' + n;
      }
    ],
    {
      name: 'toJSON',
      value: function(value) { return value.ordinal; }
    }
  ]
});


foam.LIB({
  name: 'foam',

  methods: [
    function ENUM(m) {
      m.class = m.class || 'foam.core.EnumModel';
      return foam.CLASS(m);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
// JSON Support
//
// TODO:
//   - don't output default classes
*/

foam.CLASS({
  refines: 'foam.core.Property',

  properties: [
    {
      name: 'fromJSON',
      value: function fromJSON(value, ctx, prop, json) {
        return foam.json.parse(value, null, ctx);
      }
    },
    {
      name: 'toJSON',
      value: function toJSON(value, outputter) { return value; }
    }
  ],

  methods: [
    function outputJSON(o) {
      o.output({ class: '__Property__', forClass_: this.forClass_ });
    }
  ]
});

foam.CLASS({
  name: '__Property__',
  package: 'foam.core',
  axioms: [
    {
      name: 'create',
      installInClass: function(c) {
        var oldCreate = c.create;
        c.create = function(args, X) {
          var cls = args.forClass_.substring(0, args.forClass_.lastIndexOf('.'));
          var name = args.forClass_.substring(args.forClass_.lastIndexOf('.') + 1);

          var prop = X.lookup(cls).getAxiomByName(name);

          foam.assert(prop, 'Could not find property "', args.forClass_, '"');

          return prop;
        };
      }
    }
  ]
});

/** Add toJSON() method to FObject. **/
foam.CLASS({
  refines: 'foam.core.FObject',

  methods: [
    /**
      Output as a pretty-printed JSON-ish String.
      Use for debugging/testing purposes. If you want actual
      JSON output, use foam.json.* instead.
    */
    function stringify() {
      return foam.json.Pretty.stringify(this);
    }
  ]
});


/** JSON Outputter. **/
foam.CLASS({
  package: 'foam.json',
  name: 'Outputter',

  documentation: 'JSON Outputter.',

  properties: [
    {
      class: 'String',
      name: 'buf_',
      value: ''
    },
    {
      class: 'Int',
      name: 'indentLevel_',
      value: 0
    },
    {
      class: 'String',
      name: 'indentStr',
      value: '\t'
    },
    {
      class: 'String',
      name: 'nlStr',
      value: '\n'
    },
    {
      class: 'String',
      name: 'postColonStr',
      value: ' '
    },
    {
      class: 'Boolean',
      name: 'alwaysQuoteKeys',
      help: 'If true, keys are always quoted, as required by the JSON standard. If false, only quote keys which aren\'tvalid JS identifiers.',
      value: true
    },
    {
      class: 'Boolean',
      name: 'formatDatesAsNumbers',
      value: false
    },
    {
      class: 'Boolean',
      name: 'formatFunctionsAsStrings',
      value: true
    },
    {
      class: 'Boolean',
      name: 'outputDefaultValues',
      value: true
    },
    {
      class: 'Boolean',
      name: 'outputOwnPropertiesOnly',
      documentation: 'If true expressions are not stored.',
      value: true
    },
    {
      class: 'Boolean',
      name: 'outputClassNames',
      value: true
    },
    {
      class: 'Function',
      name: 'propertyPredicate',
      value: function(o, p) { return ! p.transient; }
    },
    {
      class: 'Boolean',
      name: 'useShortNames',
      value: false
    },
    {
      class: 'Boolean',
      name: 'sortObjectKeys',
      value: false
    },
    {
      class: 'Boolean',
      name: 'pretty',
      value: true,
      postSet: function(_, p) {
        if ( p ) {
          this.clearProperty('indentStr');
          this.clearProperty('nlStr');
          this.clearProperty('postColonStr');
          this.clearProperty('useShortNames');
        } else {
          this.indentStr = this.nlStr = this.postColonStr = null;
        }
      }
    },
    {
      // TODO: rename to FON
      class: 'Boolean',
      name: 'strict',
      value: true,
      postSet: function(_, s) {
        if ( s ) {
          this.useShortNames            = false;
          this.formatDatesAsNumbers     = false;
          this.alwaysQuoteKeys          = true;
          this.formatFunctionsAsStrings = true;
        } else {
          this.alwaysQuoteKeys          = false;
          this.formatFunctionsAsStrings = false;
        }
      }
    }
    /*
    {
      class: 'Boolean',
      name: 'functionFormat',
      value: false
    },
    */
  ],

  methods: [
    function reset() {
      this.indentLevel_ = 0;
      this.buf_ = '';
      return this;
    },

    function escape(str) {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/[\x00-\x1f]/g, function(c) {
          return "\\u00" + ((c.charCodeAt(0) < 0x10) ?
              '0' + c.charCodeAt(0).toString(16) :
              c.charCodeAt(0).toString(16));
        });
    },

    function maybeEscapeKey(str) {
      return this.alwaysQuoteKeys || ! /^[a-zA-Z\$_][0-9a-zA-Z$_]*$/.test(str) ?
          '"' + str + '"' :
          str ;
    },

    function out() {
      for ( var i = 0 ; i < arguments.length ; i++ ) this.buf_ += arguments[i];
      return this;
    },

    /**
      Start a block, using the supplied start character, which would typically
      be '{' for objects or '[' for arrays.  Handles indentation if enabled.
    */
    function start(c) {
      if ( c ) this.out(c).nl();
      if ( this.indentStr ) {
        this.indentLevel_++;
        this.indent();
      }
      return this;
    },

    /**
      End a block, using the supplied end character, which would typically
      be '}' for objects or ']' for arrays.
    */
    function end(c) {
      if ( this.indent ) {
        this.indentLevel_--;
      }
      if ( c ) this.nl().indent().out(c);
      return this;
    },

    function nl() {
      if ( this.nlStr && this.nlStr.length ) {
        this.out(this.nlStr);
      }
      return this;
    },

    function indent() {
      for ( var i = 0 ; i < this.indentLevel_ ; i++ ) this.out(this.indentStr);
      return this;
    },

    function outputPropertyName(p) {
      this.out(this.maybeEscapeKey(this.useShortNames && p.shortName ? p.shortName : p.name));
      return this;
    },

    function outputProperty(o, p, includeComma) {
      if ( ! this.propertyPredicate(o, p ) ) return false;
      if ( ! this.outputDefaultValues && p.isDefaultValue(o[p.name]) )
        return false;

      // Access property before checking o.hasOwnProperty.
      var v = o[p.name];
      if ( this.outputOwnPropertiesOnly && ! o.hasOwnProperty(p.name) )
        return false;

      if ( includeComma ) this.out(',');

      this.nl().indent().outputPropertyName(p).out(':', this.postColonStr);
      this.output(p.toJSON(v, this), p.of);
      return true;
    },

    function outputDate(o) {
      if ( this.formatDatesAsNumbers ) {
        this.out(o.valueOf());
      } else {
        this.out(JSON.stringify(o));
      }
    },

    function outputFunction(o) {
      if ( this.formatFunctionsAsStrings ) {
        this.output(o.toString());
      } else {
        this.out(o.toString());
      }
    },

    function outputObjectKeyValue_(key, value, first) {
      if ( ! first ) this.out(',').nl().indent();
      this.out(this.maybeEscapeKey(key), ':').output(value);
    },

    function outputObjectKeyValues_(o) {
      var first = true;
      for ( var key in o ) {
        this.outputObjectKeyValue_(key, o[key], first);
        first = false;
      }
    },

    function outputSortedObjectKeyValues_(o) {
      var key, keys = [];

      for ( key in o ) keys.push(key);
      keys.sort();

      var first = true;
      for ( var i = 0 ; i < keys.length; i++ ) {
        key = keys[i];
        this.outputObjectKeyValue_(key, o[key], first);
        first = false;
      }
    },

    {
      name: 'output',
      code: foam.mmethod({
        // JSON doesn't support sending 'undefined'
        Undefined: function(o) { this.out('null'); },
        Null:      function(o) { this.out('null'); },
        String:    function(o) { this.out('"', this.escape(o), '"'); },
        Number:    function(o) { this.out(o); },
        Boolean:   function(o) { this.out(o); },
        Date:      function(o) { this.outputDate(o); },
        Function:  function(o) { this.outputFunction(o); },
        FObject: function(o, opt_cls) {
          if ( o.outputJSON ) {
            o.outputJSON(this);
            return;
          }

          this.start('{');
          var cls = this.getCls(opt_cls);
          var outputClassName = this.outputClassNames && o.cls_ !== cls;
          if ( outputClassName ) {
            this.out(
                this.maybeEscapeKey('class'),
                ':',
                this.postColonStr,
                '"',
                o.cls_.id,
                '"');
          }
          var ps = o.cls_.getAxiomsByClass(foam.core.Property);
          var outputComma = outputClassName;
          for ( var i = 0 ; i < ps.length ; i++ ) {
            outputComma = this.outputProperty(o, ps[i], outputComma) ||
                outputComma;
          }
          this.nl().end('}');
        },
        Array: function(o, opt_cls) {
          this.start('[');
          var cls = this.getCls(opt_cls);
          for ( var i = 0 ; i < o.length ; i++ ) {
            this.output(o[i], cls);
            if ( i < o.length-1 ) this.out(',').nl().indent();
          }
          //this.nl();
          this.end(']');
        },
        Object: function(o) {
          if ( o.outputJSON ) {
            o.outputJSON(this);
          } else {
            this.start('{');
            if ( this.sortObjectKeys ) {
              this.outputSortedObjectKeyValues_(o);
            } else {
              this.outputObjectKeyValues_(o);
            }
            this.end('}');
          }
        }
      })
    },

    function stringify(o, opt_cls) {
      this.output(o, opt_cls);
      var ret = this.buf_;
      this.reset(); // reset to avoid retaining garbage
      return ret;
    },

    {
      name: 'objectify',
      code: foam.mmethod({
        Date: function(o) {
          return this.formatDatesAsNumbers ? o.valueOf() : o;
        },
        Function: function(o) {
          return this.formatFunctionsAsStrings ? o.toString() : o;
        },
        FObject: function(o, opt_cls) {
          var m = {};
          var cls = this.getCls(opt_cls);
          if ( this.outputClassNames && o.cls_ !== cls ) {
            m.class = o.cls_.id;
          }
          var ps = o.cls_.getAxiomsByClass(foam.core.Property);
          for ( var i = 0 ; i < ps.length ; i++ ) {
            var p = ps[i];
            if ( ! this.propertyPredicate(o, p) ) continue;
            if ( ! this.outputDefaultValues && p.isDefaultValue(o[p.name]) )
              continue;

            m[p.name] = this.objectify(p.toJSON(o[p.name], this), p.of);
          }
          return m;
        },
        Array: function(o, opt_cls) {
          var a = [];
          var cls = this.getCls(opt_cls);
          for ( var i = 0 ; i < o.length ; i++ ) {
            a[i] = this.objectify(o[i], cls);
          }
          return a;
        },
        Object: function(o) {
          var ret = {};
          for ( var key in o ) {
            // NOTE: Could lazily construct "ret" first time
            // this.objectify(o[key]) !== o[key].
            if ( o.hasOwnProperty(key) ) ret[key] = this.objectify(o[key]);
          }
          return ret;
        }
      },
      function(o) { return o; })
    },

    function getCls(opt_cls) {
      return foam.typeOf(opt_cls) === foam.String ? this.lookup(opt_cls, true) :
          opt_cls;
    }
  ]
});


foam.CLASS({
  package: 'foam.json',
  name: 'Parser',

  properties: [
    {
      class: 'Boolean',
      name: 'strict',
      value: true
    },
    {
      name: 'creationContext'
    },
    {
      name: 'fonParser_',
      expression: function(creationContext) {
        return foam.parsers.FON.create({
          creationContext: creationContext
        });
      }
    }
  ],

  methods: [
    function parseString(str, opt_ctx) {
      return this.strict ?
          // JSON.parse() is faster; use it when data format allows.
          foam.json.parse(JSON.parse(str), null,
                          opt_ctx || this.creationContext) :
          // Create new parser iff different context was injected; otherwise
          // use same parser bound to "creationContext" each time.
          opt_ctx ? foam.parsers.FON.create({
            creationContext: opt_ctx
          }).parseString(str) : this.fonParser_.parseString(str);
    }
  ]
});


/** Library of pre-configured JSON Outputters. **/
foam.LIB({
  name: 'foam.json',

  constants: {

    // Pretty Print
    Pretty: foam.json.Outputter.create({
      strict: false
    }),

    // Strict means output as proper JSON.
    Strict: foam.json.Outputter.create({
      pretty: false,
      strict: true
    }),

    // Pretty and proper JSON.
    PrettyStrict: foam.json.Outputter.create({
      pretty: true,
      strict: true
    }),

    // Compact output (not pretty)
    Compact: foam.json.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      strict: false
    }),

    // Shorter than Compact (uses short-names if available)
    Short: foam.json.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      // TODO: No deserialization support for shortnames yet.
      //      useShortNames: true,
      useShortNames: false,
      strict: false
    }),

    // Short, but exclude network-transient properties.
    Network: foam.json.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      // TODO: No deserialization support for shortnames yet.
      //      useShortNames: true,
      useShortNames: false,
      strict: false,
      propertyPredicate: function(o, p) { return ! p.networkTransient; }
    }),

    // Short, but exclude storage-transient properties.
    Storage: foam.json.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      // TODO: No deserialization support for shortnames yet.
      //      useShortNames: true,
      useShortNames: false,
      strict: false,
      propertyPredicate: function(o, p) { return ! p.storageTransient; }
    })
  },

  methods: [
    {
      // TODO: why is this called parse when it's really objectify?
      name: 'parse',
      code: foam.mmethod({
        Array: function(o, opt_class, opt_ctx) {
          var a = new Array(o.length);
          for ( var i = 0 ; i < o.length ; i++ ) {
            a[i] = this.parse(o[i], opt_class, opt_ctx);
          }

          return a;
        },
        FObject: function(o) { return o; },
        Object: function(json, opt_class, opt_ctx) {
          var cls = json.class || opt_class;

          if ( cls ) {
            var c = typeof cls === 'string' ? ( opt_ctx || foam ).lookup(cls) : cls;
            // TODO(markdittmer): Turn into static method: "parseJSON" once
            // https://github.com/foam-framework/foam2/issues/613 is fixed.
            if ( c.PARSE_JSON ) return c.PARSE_JSON(json, opt_class, opt_ctx);

            for ( var key in json ) {
              var prop = c.getAxiomByName(key);
              if ( prop ) {
                json[key] = prop.fromJSON(json[key], opt_ctx, prop, this);
              }
            }

            return c.create(json, opt_ctx);
          }

          for ( var key in json ) {
            var o = json[key];
            json[key] = this.parse(json[key], null, opt_ctx);
          }

          return json;
        }
      }, function(o) { return o; })
    },

    // TODO: unsafe and only used by LocalStorageDAO, so remove.
    function parseString(jsonStr, opt_ctx) {
      return this.parse(eval('(' + jsonStr + ')'), undefined, opt_ctx);
    },

    function stringify(o) {
      return foam.json.Compact.stringify(o);
    },

    function objectify(o) {
      return foam.json.Compact.objectify(o);
    }
  ]
});
/**
@license
Copyright 2017 The FOAM Authors. All Rights Reserved.
http://www.apache.org/licenses/LICENSE-2.0
*/

foam.CLASS({
  refines: 'foam.core.Property',

  properties: [
    {
      class: 'Boolean',
      name: 'xmlAttribute',
      default: false
    },
    {
      name: 'fromXML',
      value: function fromXML(value, ctx, prop, xml) {
        return foam.xml.parse(value, null, ctx);
      }
    },
    {
      name: 'toXML',
      value: function toXML(value, Outputter) { return value; }
    }
  ],

  methods: [
    function outputXML(o) {
      o.output({ class: '__Property__', forClass_: this.forClass_ });
    }
  ]
});

/** Add toXML() method to FObject. **/
foam.CLASS({
  refines: 'foam.core.FObject',

  methods: [
    /**
      Output as a pretty-printed XML-ish String.
      Use for debugging/testing purposes. If you want actual
      XML output, use foam.xml.* instead.
    */
    function stringify() {
      return foam.xml.Pretty.stringify(this);
    }
  ]
});


/** XML Outputter **/
foam.CLASS({
  package: 'foam.xml',
  name: "Outputter",

  documentation: 'XML Outputter.',

  properties: [
    {
      class: 'String',
      name: 'buf_',
      value: ''
    },
    {
      class: 'Int',
      name: 'indentLevel_',
      value: 0
    },
    {
      class: 'String',
      name: 'indentStr',
      value: '\t'
    },
    {
      class: 'String',
      name: 'nlStr',
      value: '\n'
    },
    {
      class: 'Boolean',
      name: 'outputDefaultValues',
      value: true
    },
    {
      class: 'Boolean',
      name: 'outputDefinedValues',
      value: true
    },
    {
      class: 'Boolean',
      name: 'formatDatesAsNumbers',
      value: false
    },
    {
      class: 'Boolean',
      name: 'outputClassNames',
      value: true
    },
    {
      class: 'Function',
      name: 'propertyPredicate',
      value: function(o, p) { return ! p.transient; }
    },
    {
      class: 'Boolean',
      name: 'useShortNames',
      value: false
    },
        {
      class: 'Boolean',
      name: 'sortObjectKeys',
      value: false
    },
    {
      class: 'Boolean',
      name: 'pretty',
      value: true,
      postSet: function(_, p) {
        if ( p ) {
          this.clearProperty('indentStr');
          this.clearProperty('nlStr');
          this.clearProperty('useShortNames');
        } else {
          this.indentStr = this.nlStr = null;
        }
      }
    }
  ],

  methods: [

    function reset() {
      this.indentLevel_ = 0;
      this.buf_ = '';
      return this;
    },

    function escape(str) {
        return str && str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    function maybeEscapeKey(str) {
      return this.alwaysQuoteKeys || ! /^[a-zA-Z\$_][0-9a-zA-Z$_]*$/.test(str) ?
          '"' + str + '"' :
          str ;
    },

    function escapeAttr(str) {
        return str && str.replace(/"/g, '&quot;');
    },

    function out() {
      for ( var i = 0 ; i < arguments.length ; i++ ) this.buf_ += arguments[i];
      return this;
    },

    function start(c) {
      if ( c ) this.out(c);
      if ( this.indentStr ) {
        this.indentLevel_++;
        this.indent();
      }
    },

    function end(c) {
      if ( this.indent ) {
        this.indentLevel_--;
      }
      if ( c ) this.nl().indent().out(c);
      return this;
    },

    function nl() {
      if ( this.nlStr && this.nlStr.length ) {
        this.out(this.nlStr);
      }
      return this;
    },

    function indent() {
      for ( var i = 0 ; i < this.indentLevel_ ; i++ ) this.out(this.indentStr);
      return this;
    },

    function outputPropertyName(p) {
      this.out(this.maybeEscapeKey(this.useShortNames && p.shortName ? p.shortName : p.name));
      return this;
    },

    function outputAttributes(v) {
      var attributes = v.cls_.getAxiomsByClass(foam.core.Property).filter(function (p) { return p.xmlAttribute });
      if ( attributes.length === 0 ) return this;

      for ( var i = 0 ; i < attributes.length ; i++ ) {
        this.out(' ' + attributes[i].name + '="' + this.escapeAttr(attributes[i].get(v)) + '"');
      }
      return this;
    },

    function propertyName(p) {
      return this.maybeEscapeKey(this.useShortNames && p.shortName ? p.shortName : p.name)
    },

    function outputProperty_(o, p) {
      if ( ! this.propertyPredicate(o, p ) ) return;
      // don't output default values unless value is defined and outputDefinedValues set to true
      if ( this.outputDefinedValues ) {
        if ( ! o.hasOwnProperty(p.name) ) return;
      } else if ( this.outputDefaultValues ) {
        if ( p.isDefaultValue(o[p.name]) ) return;
      }

      var v = o[p.name];
      if ( ! v || ( v instanceof Array && v.length === 0 ) ) {
        return;
      }

      this.nl().indent();
      this.outputProperty(v, p);
    },

    {
      name: 'outputProperty',
      code: foam.mmethod({
        Undefined:    function(v, p) {},
        String:       function(v, p) { this.outputPrimitive(v, p); },
        Number:       function(v, p) { this.outputPrimitive(v, p); },
        Boolean:      function(v, p) { this.outputPrimitive(v, p); },
        Date:         function(v, p) { this.outputPrimitive(v, p); },
        AbstractEnum: function(v, p) { this.outputPrimitive(v.name, p); },
        Array:     function(v, p) {
          for ( var i = 0 ; i < v.length ; i++ ) {
            if ( foam.core.FObjectArray.isInstance(p) ) {
              // output FObject array
              this.start('<' + this.propertyName(p) + '>');
              this.output(p.toXML(v[i], this));
              this.end('</' + this.propertyName(p) + '>');
            } else {
              // output primitive array
              this.outputPrimitive(v[i], p);
            }

            // new line and indent except on last element
            if ( i != v.length - 1 ) this.nl().indent();
          }
        },
        FObject: function(v, p) {
          if ( v.xmlValue ) {
            // if v.xmlValue exists then we have attributes
            // check if the value is an FObject and structure XML accordingly
            if ( foam.core.FObject.isInstance(v.xmlValue) ) {
              this.start('<' + this.propertyName(p) + this.outputAttributes(v) + '>');
              this.output(p.toXML(v, this));
              this.end('</' +  this.propertyName(p) + '>');
            } else {
              this.out('<').outputPropertyName(p).outputAttributes(v).out('>');
              this.out(p.toXML(v.xmlValue, this));
              this.out('</').outputPropertyName(p).out('>');
            }
          } else {
            // assume no attributes
            this.start('<' + this.propertyName(p) + '>');
            this.output(p.toXML(v, this));
            this.end('</' +  this.propertyName(p) + '>');
          }
        }
      })
    },

    function outputPrimitive(v, p){
      this.out('<').outputPropertyName(p).out('>');
      this.output(p.toXML(v, this));
      this.out('</').outputPropertyName(p).out('>');
    },

    function outputDate(o) {
      if ( this.formatDatesAsNumbers ) {
        this.out(o.valueOf());
      } else {
        this.out(o.toISOString());
      }
    },

    function outputFunction(o) {
      if ( this.formatFunctionsAsStrings ) {
        this.output(o.toString());
      } else {
        this.out(o.toString());
      }
    },

    function outputObjectKeyValue_(key, value, first) {
      if ( ! first ) this.out(',').nl().indent();
      this.out(this.maybeEscapeKey(key), ':').output(value);
    },

    function outputObjectKeyValues_(o) {
      var first = true;
      for ( var key in o ) {
        this.outputObjectKeyValue_(key, o[key], first);
        first = false;
      }
    },

    function outputSortedObjectKeyValues_(o) {
      var key, keys = [];

      for ( key in o ) keys.push(key);
      keys.sort();

      var first = true;
      for ( var i = 0 ; i < keys.length; i++ ) {
        key = keys[i];
        this.outputObjectKeyValue_(key, o[key], first);
        first = false;
      }
    },

    {
      name: 'output',
      code: foam.mmethod({
        Undefined:    function(o) { this.out('null'); },
        Null:         function(o) { this.out('null'); },
        String:       function(o) { this.out(this.escape(o)); },
        Number:       function(o) { this.out(o); },
        Boolean:      function(o) { this.out(o); },
        Date:         function(o) { this.outputDate(o); },
        Function:     function(o) { this.outputFunction(o); },
        AbstractEnum: function(o) { },
        FObject:      function(o) {
          if ( o.outputXML ) {
            o.outputXML(this)
            return;
          }

          var clsName = o.cls_.id;
          // Iterate through properties and output
          var ps = o.cls_.getAxiomsByClass(foam.core.Property);
          for ( var i = 0 ; i < ps.length ; i++ ) {
            // skip outputting of attributes
            if ( ps[i].xmlAttribute ) continue;
            this.outputProperty_(o, ps[i]);
          }
        },
        Object: function(o) {
          if ( o.outputXML ) {
            o.outputXML(this);
          } else {
            var oName = o.name;
            this.start("<object name='" + oName + "'>");
            if ( this.sortObjectKeys ) {
              this.outputSortedObjectKeyValues_(o);
            } else {
              this.outputObjectKeyValues_(o);
            }
            this.end('</object>');
          }
        }
      })
    },

    function stringify(o) {
      // Root tags of objects for array of FObjects
      if ( o instanceof Array ) {
        this.start("<objects>");
        this.output(o);
        this.end("</objects>");
      } else {
        this.output(o);
      }
      var ret = this.buf_;
      this.reset(); // reset to avoid retaining garbage
      return ret;
    },

    function objectify(doc, cls) {
      var obj = cls.create();
      var children = doc.children;

      for ( var i = 0 ; i < children.length ; i++ ) {
        // fetch property based on xml tag name since they may not be in order
        var node = children[i];
        var prop = obj.cls_.getAxiomByName(node.tagName);

        if ( foam.core.FObjectProperty.isInstance(prop) ) {
          // parse FObjectProperty
          prop.set(obj, this.objectify(node, prop.of));
        } else if ( foam.core.FObjectArray.isInstance(prop) ) {
          // parse array property
          prop.get(obj).push(this.objectify(node, foam.lookup(prop.of)));

        } else if ( foam.core.StringArray.isInstance(prop) ) {
          // parse string array
          prop.get(obj).push(node.firstChild ? node.firstChild.nodeValue : null);
        } else {
          // parse property
          prop.set(obj, node.firstChild ? node.firstChild.nodeValue : null);
        }
      }

      // check to see if xmlValue property exists
      var xmlValueProp = obj.cls_.getAxiomByName('xmlValue');
      if ( xmlValueProp ) {
        // parse attributes if they exist
        var attributes = doc.attributes;
        for ( var i = 0 ; i < attributes.length ; i++ ) {
          var attribute = attributes[i];
          var prop = obj.cls_.getAxiomByName(attribute.name);
          // don't need to check for types as attributes are always simple types
          prop.set(obj, attribute.value);
        }

        if ( foam.core.FObjectProperty.isInstance(xmlValueProp) ) {
          xmlValueProp.set(obj, this.objectify(doc, xmlValueProp.of));
        } else {
          xmlValueProp.set(obj, doc.firstChild ? doc.firstChild.nodeValue : null);
        }
      }

      return obj;
    },

    function parseString(str, opt_class) {
      // create DOM
      var parser = new DOMParser();
      var doc = parser.parseFromString(str, 'text/xml');
      var root = doc.firstChild;

      var rootClass = root.getAttribute('class');
      if ( rootClass )
        return this.objectify(root, foam.lookup(rootClass));

      if ( opt_class ) {
        // lookup class if given a string
        if ( typeof(opt_class) === 'string' )
          opt_class = foam.lookup(opt_class);
        return this.objectify(root, opt_class);
      }
      
      throw new Error('Class not provided');
    }
  ]
});


/** Library of pre-configured XML Outputters. **/
foam.LIB({
  name: 'foam.xml',

  constants: {
    // Pretty Print
    Pretty: foam.xml.Outputter.create({
      outputDefaultValues: false,
      outputDefinedValues: true
    }),

    // Compact output (not pretty)
    Compact: foam.xml.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      outputDefinedValues: false
    }),

    // Shorter than Compact (uses short-names if available)
    Short: foam.xml.Outputter.create({
      pretty: false,
      formatDatesAsNumbers: true,
      outputDefaultValues: false,
      outputDefinedValues: false,
      // TODO: No deserialization support for shortnames yet.
      //      useShortNames: true,
      useShortNames: false,
    })
  },

  methods: [
    function stringify(o) {
      return foam.xml.Compact.stringify(o);
    },

    function objectify(o) {
      return foam.xml.Compact.objectify(o);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.lib.csv',
  name: 'Outputter',

  documentation: 'CSV Outputter.',

  properties: [
    {
      class: 'String',
      name: 'buf_',
      value: ''
    },
    {
      class: 'String',
      name: 'delimiter',
      value: ','
    },
    {
      class: 'String',
      name: 'nestedObjectSeperator',
      value: '__'
    },
    {
      class: 'String',
      name: 'nlStr',
      value: '\n'
    },
    {
      class: 'String',
      name: 'undefinedStr',
      value: ''
    },
    {
      class: 'Boolean',
      name: 'outputHeaderRow',
      value: true
    },
    {
      class: 'Function',
      name: 'propertyPredicate',
      value: function(o, p) { return ! p.transient; }
    }
  ],

  methods: [
    function out() {
      for ( var i = 0 ; i < arguments.length ; i++ ) { 
        this.buf_ += arguments[i];
      }

      return this;
    },

    function toCSV(o) {
      // Resets buffer
      this.reset();

      // Outputs object headers
      this.outputHeader(o);

      // Outputs object values
      this.output(o, true);
      this.out(this.nlStr);

      return this.buf_;
    },

    function outputHeader(o) {
      if ( ! this.outputHeaderRow ) return;

      this.outputPropertyName(o, '', true);
      this.out(this.nlStr);
    },

    function outputHeaderTitle(o, prefix, first) {
      this.out(first ? '' : this.delimiter)
          .out(this.escapeString(prefix + this.sanitizeHeaderTitle(o)));
    },

    function outputPropertyName_(o, p, prefix, first) {
      if ( ! this.propertyPredicate(o, p) ) return;

      if ( foam.core.FObjectProperty.isInstance(p) ) {
        // Gets new empty object if FObjectProperty is currently undefined
        // Done to permit appropriate headers for multi-line CSVs (multiple objects to convert)
        if ( o[p.name] == undefined ) o[p.name] = p.of.id;

        // Appends object name to prefix for CSV Header
        prefix += this.sanitizeHeaderTitle(p.name) + this.nestedObjectSeperator;
        this.outputPropertyName(o[p.name], prefix, first);
      } else {
        this.outputPropertyName(p.name, prefix, first);
      }
    },

    function sanitizeHeaderTitle(t) {
      // Sanitizes header title by replacing the nested object seperator, by itself x 2
      return this.replaceAll(t, this.nestedObjectSeperator, 
                    this.nestedObjectSeperator + this.nestedObjectSeperator);
    },

    {
      name: 'outputPropertyName',
      code: foam.mmethod({
        FObject:   function(o, prefix, first) {
          // Gets and recurses through object properties
          var ps = o.cls_.getAxiomsByClass(foam.core.Property);

          for ( var i = 0 ; i < ps.length ; i++ ) {
            this.outputPropertyName_(o, ps[i], prefix, (i == 0 && first));
          }
        },
        Array: function(o) { /* Ignore arrays in CSV */ },
        Function: function(o) { /* Ignore functions in CSV */ },
        Object: function(o) { /* Ignore generic objects in CSV */ }
      }, function(o, prefix, first) { this.outputHeaderTitle(o, prefix, first); })
    },

    function outputProperty(o, p, first) {
      if ( this.propertyPredicate(o, p) ) this.output(o[p.name], first);
    },

    function reset() {
      this.buf_ = '';
      return this;
    },

    function outputPrimitive(val, first) {
      this.out(first ? '' : this.delimiter, val);
      return this;
    },

    function escapeString(source) {
      if ( source.includes(',') ) {
        // Surrounds fields with ',' in quotes
        // Escapes inner quotes by adding another quote char (Google Sheets strategy)
        source = '"' + this.replaceAll(source, '"', '""') + '"';
      }
      
      return source;
    },

    {
      name: 'output',
      code: foam.mmethod({
        Undefined:    function(o, first) { this.outputPrimitive(this.undefinedStr, first); },
        String:       function(o, first) { this.outputPrimitive(this.escapeString(o), first); },
        AbstractEnum: function(o, first) { this.outputPrimitive(o.ordinal, first); },
        FObject:   function(o, first) {
          if ( o.outputCSV ) {
            o.outputCSV(this)
            return;
          }
          
          var ps = o.cls_.getAxiomsByClass(foam.core.Property);

          for ( var i = 0 ; i < ps.length ; i++ ) {
            this.outputProperty(o, ps[i], (i == 0 && first));
          }
        },
        Array:        function(o) { /* Ignore arrays in CSV */ },
        Function:     function(o) { /* Ignore functions in CSV */ },
        Object:       function(o) { /* Ignore generic objects in CSV */ }
      }, function(o, first) { this.outputPrimitive(o, first); })
    },

    function fromCSV(cls, s, sink) {
      if ( ! s ) throw 'Invalid CSV input to convert. Arguments must be (class, csvString).'
      var lines = s.split('\n');

      if ( lines.length == 0 ) throw 'Insufficient CSV Input';

      // Trims quotes and splits CSV row into array
      var props = this.splitIntoValues(lines[0]).map(this.splitHeaderTitle.bind(this));

      for ( var i = 1 ; i < lines.length ; i++ ) {
        var values = this.splitIntoValues(lines[i]);

        // Skips blank lines
        if ( values.length == 0 ) continue;

        // Calls for creation of new model, and `puts` into sink
        sink.put(this.createModel(props, values, cls));
      }

      return sink;
    },

    function validString(s) {
      return ( s != undefined ) && ( s.length > 0);
    },

    function splitIntoValues(csvString) {
      if ( ! this.validString(csvString) ) return [];

      var parser = foam.lib.csv.CSVParser.create();
      return parser.parseString(csvString, this.delimiter).map(field => field.value == undefined ? '' : field.value);
    },

    function splitHeaderTitle(p) {
      if ( ! this.validString(p) ) return [];

      var parser = foam.lib.csv.CSVParser.create();
      return parser.parseHeader(p, this.nestedObjectSeperator).map(field => field.value == undefined ? '' : field.value);
    },

    // Perhaps move this to foam.core.string
    function replaceAll(text, search, replacement) {
      return text.replace(new RegExp(search, 'g'), replacement);
    },

    function createModel(props, values, cls) {
      foam.assert(props.length == values.length,
        'Invalid CSV Input, header and value rows must be the same number of cells');

      var model = cls.create();

      for ( var i = 0 ; i < props.length ; i++ ) {
        var p = props[i];
        var v = values[i];

        // Adds nested prop
        if ( p.length > 1 ) {
          var prefix = p[0];

          for ( var j = i ; j <= props.length ; ++j ) {
            // If last element, or prefix no longer matches prop
            if ( ( j == props.length ) || ( props[j][0] != prefix ) ) {
              // Creates a new model for the inner object
              var prop = model.cls_.getAxiomByName(p[0]);
              prop.set(model, this.createModel(props.slice(i, j).map(nestedProp => nestedProp.slice(1)), 
                                          values.slice(i, j), prop.of));
              
              i = j - 1;
              break;
            }
          }
        // Adds regular prop
        } else {
          var prop = model.cls_.getAxiomByName(p[0]);
          prop.set(model, prop.of ? prop.of.create({ ordinal: v }) : v);
        }
      }

      return model;
    }
  ]
});

foam.LIB({
  name: 'foam.lib.csv',

  constants: {
    Standard: foam.lib.csv.Outputter.create(),
  },

  methods: [
    function toCSV(o) {
      return foam.lib.csv.Standard.toCSV(o);
    },

    function fromCSV(cls, csvString, sink) {
      return foam.lib.csv.Standard.fromCSV(cls, csvString, sink);
    }
  ]
});

/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.lib.csv',
  name: 'CSVParser',
  
  requires: [
    'foam.parse.ImperativeGrammar'
  ],

  properties: [
    {
      class: 'String',
      name: 'delimiter'
    },
    {
      class: 'String',
      name: 'nestedObjectSeperator'
    },
    {
      name: 'stringParser',
      factory: function() {
        var X = this.X;
        var self = this;
        
        return this.ImperativeGrammar.create({ 
          symbols: function(alt, anyChar, literal, literalIC, not, notChars, optional,
          plus, range, repeat, repeat0, seq, seq1, str, sym) {
            return {

              START: seq1(1, sym('ws'), repeat(sym('field'), literal(self.delimiter)), sym('ws')),

              field: alt(sym('quotedText'), sym('unquotedText'), ''),

              unquotedText: repeat(not(literal(self.delimiter), anyChar()), '', 1),

              quotedText: seq1(1, '"', repeat(alt(sym('escapedQuote'), not('"', anyChar()))), '"'),

              escapedQuote: '""',

              white: alt(' ', '\t', '\r', '\n'),

              // 0 or more whitespace characters.
              ws: repeat0(sym('white'))
            }
          }
        }).addActions({
          unquotedText: function(a) {
            return { node: 'unquotedText', value: a.join('') };
          },

          quotedText: function(a) {
            return { node: 'quotedText', value: a.join('') };
          },

          escapedQuote: function() { return '"'; }
        });
      }
    },
    {
      name: 'headerParser',
      factory: function() {
        var X = this.X;
        var self = this;
        
        return this.ImperativeGrammar.create({ 
          symbols: function(alt, anyChar, literal, literalIC, not, notChars, optional,
          plus, range, repeat, repeat0, seq, seq1, str, sym) {
            return {

              START: seq1(1, sym('ws'), repeat(sym('field'), literal(self.nestedObjectSeperator)), sym('ws')),

              field: alt(sym('text'), ''),

              text: repeat(alt(sym('escapedSeperator'), not(self.nestedObjectSeperator, anyChar())), '', 1),

              escapedSeperator: literal(self.nestedObjectSeperator + self.nestedObjectSeperator),

              white: alt(' ', '\t', '\r', '\n'),

              // 0 or more whitespace characters.
              ws: repeat0(sym('white'))
            }
          }
        }).addActions({
          text: function(a) {
            return { node: 'text', value: self.recoverHeaderTitle(a.join('')) };
          },

          escapedQuote: function() { return '"'; }
        });
      }
    }
  ],

  methods: [
    function parseString(str, delimiter) {
      this.delimiter = delimiter;
      return this.stringParser.parseString(str);
    },
    
    function parseHeader(str, nestedObjectSeperator) {
      this.nestedObjectSeperator = nestedObjectSeperator;
      return this.headerParser.parseString(str);
    },

    function recoverHeaderTitle(t) {
      // Recovers header title by replacing the nested object seperator x 2, by itself
      return t.replace(new RegExp(this.nestedObjectSeperator + this.nestedObjectSeperator, 'g'), 
                this.nestedObjectSeperator);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Parse combinator library.

  Create complex parsers by composing simple parsers.s

  A PStream is a "Parser Stream", the input format accepted by
  FOAM parsers.

  PStreams have the following interface:
    get int     pos   - The character position in the input stream.

    get Char    head  - The first character in the stream.

    get PStream tail  - A PStream for the next position in the input steam.

    get Object  value - 'Value' associated with this PStream.

    PStream setValue(Object value) - Create a new PStream at the same position
        but with a new 'value'. The value is used to hold the result of a
        (sub-)parse.

  PStreams are immutable, which greatly simplifies backtracking.

  A parser has the following interface:
    PStream parse(PStream stream);

  It takes as input a PStream, and returns either a PStream
  advanced to the point after all input consumed by the parser,
  or undefined if the parse failed. The value generated by the parser
  is stored in the .value property of the returned PStream.
 */
foam.CLASS({
  package: 'foam.parse',
  name: 'StringPS',

  properties: [
    {
      name: 'str',
      class: 'Simple'
    },
    {
      name: 'pos',
      class: 'Simple'
    },
    {
      name: 'head',
      getter: function() {
        return this.str[0][this.pos];
      }
    },
    {
      name: 'tail',
      getter: function() {
        if ( ! this.instance_.tail ) {
          var ps = this.cls_.create();
          ps.str = this.str;
          ps.pos = this.pos + 1;
          this.instance_.tail = ps;
        }
        return this.instance_.tail;
      },
      setter: function(value) {
        this.instance_.tail = value;
      }
    },
    {
      name: 'valid',
      getter: function() {
        return this.pos <= this.str[0].length;
      }
    },
    {
      name: 'value',
      setter: function(value) { this.instance_.value = value; },
      getter: function() {
        return this.instance_.value !== undefined ?
          this.instance_.value :
          this.str[0].charAt(this.pos - 1);
      }
    }
  ],

  methods: [
    function initArgs() {},

    function setValue(value) {
      // Force undefined values to null so that hasOwnProperty checks are faster.
      if ( value === undefined ) value = null;
      var ps = this.cls_.create();
      ps.str = this.str;
      ps.pos = this.pos;
      ps.tail = this.tail;
      ps.value = value;
      return ps;
    },

    function setString(s) {
      if ( ! this.pos ) this.pos = 0;
      if ( ! this.str ) this.str = [];
      this.str[0] = s;
    },

    function substring(end) {
      foam.assert(this.str === end.str &&
                  end.pos >= this.pos,
                  'Cannot make substring: end PStream is not a tail of this.');

      return this.str[0].substring(this.pos, end.pos);
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'ParserArray',
  extends: 'FObjectArray',

  properties: [
    ['of', 'foam.parse.Parser'],
    ['adapt', function(_, a) {
        if ( ! a ) return [];
        var b = new Array(a.length);
        for ( var i = 0 ; i < a.length ; i++ ) {
          b[i] = typeof a[i] === 'string' ?
              foam.parse.Literal.create({s: a[i]}) :
              a[i];
        }
        return b;
      }
    ]
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'ParserProperty',
  extends: 'Property',

  properties: [
    {
      name: 'adapt',
      value: function(_, v) {
        return typeof v === 'string' ? foam.parse.Literal.create({s: v}) : v;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'ParserDecorator',

  properties: [
    {
      name: 'p',
      class: 'foam.parse.ParserProperty',
      final: true
    }
  ],

  methods: [
    function toString() { return this.p.toString(); }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Literal',

  documentation: 'Matches a literal with the parse stream (case sensitive)',

  properties: [
    {
      name: 's',
      final: true
    },
    {
      name: 'value',
      final: true
    }
  ],

  methods: [
    function parse(ps) {
      var str = this.s;
      for ( var i = 0 ; i < str.length ; i++, ps = ps.tail ) {
        if ( str.charAt(i) !== ps.head ) {
          return undefined;
        }
      }
      return ps.setValue(this.value !== undefined ? this.value : str);
    },

    function toString() {
      return '"' + this.s + '"';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'LiteralIC',

  documentation: 'Matches a literal with the parse stream (case insensitive)',

  properties: [
    {
      name: 's',
      final: true,
      postSet: function(old, nu) {
        this.lower = nu.toLowerCase();
      }
    },
    {
      name: 'lower',
      final: true
    },
    {
      name: 'value',
      final: true
    }
  ],

  methods: [
    function parse(ps) {
      var str = this.lower;
      for ( var i = 0 ; i < str.length ; i++, ps = ps.tail ) {
        if ( ! ps.head || str.charAt(i) !== ps.head.toLowerCase() ) {
          return undefined;
        }
      }
      return ps.setValue(this.value !== undefined ? this.value : this.s);
    },

    function toString() {
      return 'ignoreCase("' + this.lower + '")';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Alternate',

  documentation: 'Attempts to match one of the parser properties to the parse stream.',

  properties: [
    {
      name: 'args',
      final: true,
      class: 'foam.parse.ParserArray'
    }
  ],

  methods: [
    function parse(ps, obj) {
      // TODO(adamvy): Should we remove the obj argument in favour of
      // passing the obj along via context or something?
      var args = this.args;
      for ( var i = 0, p ; p = args[i] ; i++ ) {
        var ret = p.parse(ps, obj);
        if ( ret ) return ret;
      }
      return undefined;
    },

    function toString() {
      var args = this.args;
      var strs = new Array(args.length);
      for ( var i = 0; i < args.length; i++ ) {
        strs[i] = args[i].toString();
      }
      return 'alt(' + strs.join(', ') + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Sequence',

  documentation: 'Parses the parser properties sequentially.',

  properties: [
    {
      name: 'args',
      final: true,
      class: 'foam.parse.ParserArray'
    }
  ],

  methods: [
    function parse(ps, obj) {
      var ret = [];
      var args = this.args;
      for ( var i = 0, p ; p = args[i] ; i++ ) {
        if ( ! ( ps = p.parse(ps, obj) ) ) return undefined;
        ret.push(ps.value);
      }
      return ps.setValue(ret);
    },

    function toString() {
      var args = this.args;
      var strs = new Array(args.length);
      for ( var i = 0; i < args.length; i++ ) {
        strs[i] = args[i].toString();
      }
      return 'seq(' + strs.join(', ') + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'String',
  extends: 'foam.parse.ParserDecorator',
  methods: [
    function parse(ps, obj) {
      ps = this.p.parse(ps, obj);
      return ps ? ps.setValue(ps.value.join('')) : undefined;
    },

    function toString() {
      return 'str(' + this.SUPER() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Substring',
  extends: 'foam.parse.ParserDecorator',
  methods: [
    function parse(ps, obj) {
      var start = ps;
      ps = this.p.parse(ps, obj);
      return ps ? ps.setValue(start.substring(ps)) : undefined;
    },

    function toString() {
      return 'str(' + this.SUPER() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Sequence0',

  documentation: `Parses the parser properties sequentially, 
    without returning value`,

  properties: [
    {
      name: 'args',
      final: true,
      class: 'foam.parse.ParserArray'
    }
  ],

  methods: [
    function parse(ps, obj) {
      var args = this.args;
      for ( var i = 0, p ; p = args[i] ; i++ ) {
        if ( ! ( ps = p.parse(ps, obj) ) ) return undefined;
      }
      return ps;
    },

    function toString() {
      var args = this.args;
      var strs = new Array(args.length);
      for ( var i = 0; i < args.length; i++ ) {
        strs[i] = args[i].toString();
      }
      return 'seq0(' + strs.join(', ') + ')';
    }
  ]
});

foam.CLASS({
  package: 'foam.parse',
  name: 'Sequence1',

  documentation: `Parses the parser properties sequentially, returning
    the n(th) property value parsed.`,

  properties: [
    {
      name: 'args',
      final: true,
      class: 'foam.parse.ParserArray'
    },
    {
      name: 'n',
      final: true
    }
  ],

  methods: [
    function parse(ps, obj) {
      var ret;
      var args = this.args;
      var n = this.n;
      for ( var i = 0, p ; p = args[i] ; i++ ) {
        if ( ! ( ps = p.parse(ps, obj) ) ) return undefined;
        if ( i === n ) ret = ps.value;
      }
      return ps.setValue(ret);
    },

    function toString() {
      var args = this.args;
      var strs = new Array(args.length);
      for ( var i = 0; i < args.length; i++ ) {
        strs[i] = args[i].toString();
      }
      return 'seq1(' + this.n + ', ' + strs.join(', ') + ')';
    }
  ]
});

foam.CLASS({
  package: 'foam.parse',
  name: 'Optional',
  extends: 'foam.parse.ParserDecorator',

  documentation: 'Refers to an optional parser property.',

  methods: [
    function parse(ps, obj) {
      return this.p.parse(ps, obj) || ps.setValue(null);
    },

    function toString() {
      return 'opt(' + this.SUPER() + ')';
    }
  ],
});


foam.CLASS({
  package: 'foam.parse',
  name: 'AnyChar',

  documentation: `Matches any char within the parse stream.
    Often used under the else clause of the 'not' parser
    property. Ex. \`not(',', anyChar())\``,

  axioms: [ foam.pattern.Singleton.create() ],

  methods: [
    function parse(ps) {
      return ps.head ? ps.tail : undefined;
    },

    function toString() { return 'anyChar()'; }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'NotChars',

  documentation: `Matches against all but the chars specified
    in the argument string.`,

  properties: [
    {
      name: 'string',
      final: true
    }
  ],

  methods: [
    function parse(ps) {
      return ps.head && this.string.indexOf(ps.head) === -1 ?
        ps.tail : undefined;
    },

    function toString() {
      var str = this.string;
      var chars = new Array(str.length);
      for ( var i = 0; i < str.length; i++ ) {
        chars[i] = str.charAt(i);
      }
      return 'notChars("' + chars.join('", "') + '")';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Chars',

  documentation: `Matches against any of the chars specified
    in the argument string.`,

  properties: [
    {
      name: 'string',
      final: true
    }
  ],

  methods: [
    function parse(ps) {
      return ps.valid && this.string.indexOf(ps.head) !== -1 ?
        ps.tail : undefined;
    },

    function toString() {
      var str = this.string;
      var chars = new Array(str.length);
      for ( var i = 0; i < str.length; i++ ) {
        chars[i] = str.charAt(i);
      }
      return 'chars("' + chars.join('", "') + '")';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Range',

  documentation: `Matches against a range of chars specified
    with from/to. Ex. \`range('0', '9')\` for digits`,

  properties: [
    {
      name: 'from',
      final: true
    },
    {
      name: 'to',
      final: true
    }
  ],

  methods: [
    function parse(ps) {
      if ( ! ps.head ) return undefined;
      return ( this.from <= ps.head && ps.head <= this.to ) ?
          ps.tail.setValue(ps.head) :
          undefined;
    },

    function toString() {
      return 'range("' + this.from + '", "' + this.to + '")';
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Repeat',
  extends: 'foam.parse.ParserDecorator',

  documentation: `Repeats matching to the parser property specified
    with an optional delimiter, and min number of matches.`,

  properties: [
    {
      class: 'foam.parse.ParserProperty',
      name: 'delimiter'
    },
    {
      class: 'Int',
      name: 'minimum'
    }
  ],

  methods: [
    function parse(ps, obj) {
      var ret = [];
      var p = this.p;
      var last;
      var delim = this.delimiter;

      while ( ps ) {
        // Checks for end of string
        if ( last && ( last.pos == ps.str[0].length ) ) {
          // Checks if previous char was delimiter, if not removes trailing empty string
          // TODO: Find a better way to handle reading past input
          if ( delim && ( ps.str[0][last.pos - 1] != delim.s ) ) ret.pop();
          return ps.setValue(ret);
        }

        last = ps;
        ps = p.parse(ps, obj);
        if ( ps ) ret.push(ps.value);
        if ( delim && ps ) {
          ps = delim.parse(ps, obj) || ps;
        }
      }

      if ( this.minimum > 0 && ret.length < this.minimum ) return undefined;
      
      return last.setValue(ret);
    },

    function toString() {
      var str = 'repeat(' + this.SUPER();
      if ( this.delimiter ) str += ', ' + this.delimiter;
      if ( this.minimum ) str += ', ' + this.minimum;
      str += ')';
      return str;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Plus',
  extends: 'foam.parse.Repeat',

  documentation: `Repeats matching to a parser property at least one time
    with an optional delimiter.`,

  properties: [
    ['minimum', 1]
  ],

  methods: [
    function toString() {
      var str = 'plus(' + this.p.toString();
      if ( this.delimiter ) str += ', ' + this.delimiter;
      str += ')';
      return str;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Repeat0',
  extends: 'foam.parse.Repeat',

  documentation: `Repeats matching to a parser property,
    without returning a value. Useful for whitespace.
    Ex. \`repeat0(sym('white'))\``,

  methods: [
    function parse(ps, obj) {
      var p = this.p;
      var last;
      var delim = this.delimiter;
      var i = 0;

      while ( ps ) {
        last = ps;
        ps = p.parse(ps, obj);
        if ( ps ) i++;
        if ( delim && ps ) {
          ps = delim.parse(ps, obj) || ps;
        }
      }

      if ( this.minimum > 0 && i < this.minimum ) return undefined;
      return last;
    },

    function toString() {
      var str = 'repeat0(' + this.p.toString();
      if ( this.delimiter ) str += ', ' + this.delimiter;
      if ( this.minimum ) str += ', ' + this.minimum;
      str += ')';
      return str;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Not',
  extends: 'foam.parse.ParserDecorator',

  documentation: `Ensures the leading char isn't the parser
    property specified. If not, attempts to parse with the
    else clause parser property. Useful for matching all but
    a particular character. Ex. \`not('"', anyChar())\``,

  properties: [
    {
      name: 'else',
      final: true,
      class: 'foam.parse.ParserProperty'
    }
  ],

  methods: [
    function parse(ps, obj) {
      return this.p.parse(ps, obj) ?
        undefined :
        (this.else ? this.else.parse(ps, obj) : ps);
    },

    function toString() {
      var str = 'not(' + this.SUPER();
      if ( this.else ) str += ', ' + this.else.toString();
      str += ')';
      return str;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'ParserWithAction',
  extends: 'foam.parse.ParserDecorator',

  properties: [
    'action'
  ],

  methods: [
    function parse(ps, obj) {
      ps = this.p.parse(ps, obj);
      return ps ?
        ps.setValue(this.action(ps.value)) :
        undefined;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Symbol',

  documentation: `Parses based on the parser property named.`,

  properties: [
    {
      name: 'name',
      final: true
    },
  ],

  methods: [
    function parse(ps, grammar) {
      var p = grammar.getSymbol(this.name);
      if ( ! p ) {
        console.error('No symbol found for', this.name);
        return undefined;
      }
      return p.parse(ps, grammar);
    },

    function toString() { return 'sym("' + this.name + '")'; }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Parsers',

  axioms: [ foam.pattern.Singleton.create() ],

  methods: [
    function seq() {
      return this.lookup('foam.parse.Sequence').create({
        args: Array.from(arguments)
      });
    },

    function repeat0(p, delim, min) {
      return this.lookup('foam.parse.Repeat0').create({
        p: p,
        minimum: min || 0,
        delimiter: delim
      });
    },

    function simpleAlt() {
      return this.lookup('foam.parse.Alternate').create({
        args: Array.from(arguments)
      });
    },

    function alt() {
      return this.lookup('foam.parse.Alternate').create({
        args: Array.from(arguments)
      });
    },

    function sym(name) {
      return this.lookup('foam.parse.Symbol').create({
        name: name
      });
    },

    function seq1(n) {
      return this.lookup('foam.parse.Sequence1').create({
        n: n,
        args: Array.from(arguments).slice(1)
      });
    },

    function seq0() {
      return this.lookup('foam.parse.Sequence0').create({
        args: Array.from(arguments)
      });
    },

    function repeat(p, delim, min) {
      return this.lookup('foam.parse.Repeat').create({
        p: p,
        minimum: min || 0,
        delimiter: delim
      });
    },

    function plus(p, delim) {
      return this.lookup('foam.parse.Plus').create({
        p: p,
        delimiter: delim
      });
    },

    function str(p) {
      return this.lookup('foam.parse.String').create({
        p: p
      });
    },

    function substring(p) {
      return this.lookup('foam.parse.Substring').create({
        p: p
      });
    },

    function range(a, b) {
      return this.lookup('foam.parse.Range').create({
        from: a,
        to: b
      });
    },

    function notChars(s) {
      return this.lookup('foam.parse.NotChars').create({
        string: s
      });
    },

    function chars(s) {
      return this.lookup('foam.parse.Chars').create({
        string: s
      });
    },

    function not(p, opt_else) {
      return this.lookup('foam.parse.Not').create({
        p: p,
        else: opt_else
      });
    },

    function optional(p) {
      return this.lookup('foam.parse.Optional').create({
        p: p
      });
    },

    function literal(s, value) {
      return this.lookup('foam.parse.Literal').create({
        s: s,
        value: value
      });
    },

    function literalIC(s, value) {
      return this.lookup('foam.parse.LiteralIC').create({
        s: s,
        value: value
      });
    },

    function anyChar() {
      return foam.parse.AnyChar.create();
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'PSymbol',

  properties: ['name', 'parser']
});


foam.CLASS({
  package: 'foam.parse',
  name: 'Grammar',

  requires: [
    'foam.parse.StringPS',
    'foam.parse.Parsers'
  ],

  properties: [
    {
      class: 'FObjectArray',
      of: 'foam.parse.PSymbol',
      name: 'symbols',
      adapt: function(_, o) {
        if ( Array.isArray(o) ) return o;

        if ( typeof o === 'function' ) {
          var args = o.toString().match(/\((.*?)\)/);
          if ( ! args ) {
            throw 'Could not parse arguments from parser factory function';
          }

          o = foam.Function.withArgs(o, this.Parsers.create(), this);
        }

        var a = [];
        for ( var key in o ) {
          a.push(foam.parse.PSymbol.create({
            name: key,
            parser: o[key]
          }));
        }
        return a;
      }
    },
    {
      name: 'symbolMap_',
      expression: function(symbols) {
        var m = {};
        for ( var i = 0 ; i < symbols.length ; i++ ) {
          if ( m[symbols[i].name] ) {
            console.error('Duplicate symbol found', symbols[i].name);
          }
          m[symbols[i].name] = symbols[i];
        }
        return m;
      }
    },
    {
      name: 'ps',
      factory: function() {
        return this.StringPS.create();
      }
    }
  ],

  methods: [
    function parseString(str, opt_name) {
      opt_name = opt_name || 'START';

      this.ps.setString(str);
      var start = this.getSymbol(opt_name);
      foam.assert(start, 'No symbol found for', opt_name);

      var result = start.parse(this.ps, this);
      return result && result.value;
    },

    function getSymbol(name) {
      return this.symbolMap_[name].parser;
    },

    function addSymbol(name, parser) {
      this.symbols.push(foam.parse.PSymbol.create({
        name: name, parser: parser
      }));
    },

    function addActions(map) {
      for ( var key in map ) {
        this.addAction(key, map[key]);
      }
      return this;
    },

    function addAction(name, action) {
      for ( var i = 0 ; i < this.symbols.length ; i++ ) {
        if ( this.symbols[i].name === name ) {
          this.symbols[i].parser = foam.parse.ParserWithAction.create({
            p: this.symbols[i].parser,
            action: action
          });
        }
      }

      // TODO(adamvy): Array property should help me here
      this.pub('propertyChange', 'symbols', this.slot('symbols'));
      return this;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'GrammarAxiom',
  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'String',
      name: 'language',
      value: 'foam.parse.Parsers'
    },
    {
      name: 'symbols'
    },
    {
      class: 'Array',
      name: 'actions'
    }
  ],
  methods: [
    function installInProto(proto) {
      var name = this.name;
      var axiom = this;
      Object.defineProperty(proto, name, {
        get: function() {
          var g = this.getPrivate_(name);

          if ( ! g ) {
            this.setPrivate_(name, g = axiom.buildGrammar(this));
          }

          return this.getPrivate_(name);
        }
      });
    },
    function buildGrammar(obj) {
      var g = obj.lookup('foam.parse.Grammar').create(null, obj);

      var symbols;

      if ( typeof this.symbols == 'function' ) {
        with(obj.lookup(this.language).create()) {
          symbols = eval('(' + this.symbols.toString() + ')()');
        }
      } else
        symbols = this.symbols;

      for ( var key in symbols ) {
        g.addSymbol(key, symbols[key]);
      }

      for ( var i = 0 ; i < this.actions.length ; i++ ) {
        g.addAction(this.actions[i].name, this.actions[i].code || this.actions[i]);
      }

      return g;
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      class: 'AxiomArray',
      name: 'grammars',
      of: 'foam.parse.GrammarAxiom'
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'ImperativeGrammar',
  extends: 'foam.parse.Grammar',
});

/*
TODO(adamvy):
  -detect non string values passed to StringPS.setString()
*/
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.parse.json',
  name: 'String',

  constants: {
    CHAR_CODE_0:       '0'.charCodeAt(0),
    CHAR_CODE_9:       '9'.charCodeAt(0),
    CHAR_CODE_A_LOWER: 'a'.charCodeAt(0),
    CHAR_CODE_F_LOWER: 'f'.charCodeAt(0),
    CHAR_CODE_A_UPPER: 'A'.charCodeAt(0),
    CHAR_CODE_F_UPPER: 'F'.charCodeAt(0)
  },

  properties: [
    {
      class: 'String',
      name: 'escape',
      value: '\\'
    },
    {
      name: 'escapeChars',
      value: {
        'n': '\u000a',
        'f': '\u000c',
        'b': '\u0008',
        'r': '\u000d',
        't': '\u0009'
      }
    }
  ],

  methods: [
    function parse(ps, obj) {
      var delim = ps.head;
      var escape = this.escape;

      if ( delim !== '"' && delim !== "'" ) return undefined;

      ps = ps.tail;

      var lastc = delim;
      var str = '';

      while ( ps.valid ) {
        var c = ps.head;
        if ( c === delim && lastc !== escape ) break;

        if ( c !== escape ) {
          str += c;
        } else {
          var next = ps.tail.head;
          if ( next === escape ) {
            // "\\" parses to "\".
            str += escape;
            ps = ps.tail;
          } else if ( ps.tail.head === 'u' ) {
            // Unicode escape sequence: "\u####".
            // Extract "###".
            var hexCharCode = ps.tail.str[0].substr(ps.pos + 2, 4);
            // Verify that each character in sequence is a hex digit.
            for ( var i = 0; i < hexCharCode.length; i++ ) {
              var hexDigitCharCode = hexCharCode.charCodeAt(i);
              if ( ! this.isHexDigitCharCode_(hexDigitCharCode) )
                throw new Error('FON string parse error at ' + ps.pos + ': ' +
                                'Invalid unicode escape sequence: \\u' +
                                hexCharCode);
            }
            // Construct hex character and add it to str.
            var charCode = parseInt(hexCharCode, 16);
            c = String.fromCharCode(charCode);
            str += c;
            // Advance to last char in "\u####" escape sequence.
            ps = ps.tail.tail.tail.tail.tail;
          } else if ( this.escapeChars[ps.tail.head] ) {
            c = this.escapeChars[ps.tail.head];
            str += c;
            ps = ps.tail;
          }
        }

        lastc = c;
        ps = ps.tail;
      }

      return ps.tail.setValue(str);
    },
    function isHexDigitCharCode_(charCode) {
      return ( ( charCode >= this.CHAR_CODE_0 &&
                 charCode <= this.CHAR_CODE_9 ) ||
               ( charCode >= this.CHAR_CODE_A_LOWER &&
                 charCode <= this.CHAR_CODE_F_LOWER ) ||
               ( charCode >= this.CHAR_CODE_A_UPPER &&
                 charCode <= this.CHAR_CODE_F_UPPER ) );
    }
  ]
});

foam.CLASS({
  package: 'foam.parse.json',
  name: 'Parsers',
  extends: 'foam.parse.Parsers',
  methods: [
    function string() {
      return foam.parse.json.String.create();
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.parsers',
  name: 'FON',
  implements: [ 'foam.json.Parser' ],
  properties: [
    {
      name: 'creationContext'
    }
  ],
  methods: [
    function parseString(str, X) {
      foam.assert(this.creationContext, 'No creation context assigned.');

      var res = this.grammar.parseString(str, 'obj');
      if ( ! res ) return null;
      return foam.json.parse(res, null, this.creationContext);
    }
  ],
  grammars: [
    {
      name: 'grammar',
      language: 'foam.parse.json.Parsers',
      symbols: function() {
        return {
          'obj': seq1(3,
                      sym('ws'),
                     '{', sym('ws'),
                     repeat(sym('keyValue'), seq0(',', sym('ws'))),
                     sym('ws'),
                     '}',
                     sym('ws')),
          'keyValue': seq(sym('key'), sym('ws'),
                          ':', sym('ws'),
                          sym('value'), sym('ws')),

          'key': alt(string(),
                     sym('identifier')),

          'ws': repeat0(chars(' \t\r\n')),

          // TODO: Support all valid characters, should consult unicode tables for things like ID_Start
          'id_start': alt(
            range('a', 'z'),
            range('A', 'Z'),
            '_',
            '$'),

          'identifier': substring(seq0(
            sym('id_start'),
            repeat0(alt(range('0', '9'), sym('id_start'))))),

          'value': alt(
            string(),
            sym('null'),
            sym('undefined'),
            sym('number'),
            sym('bool'),
            sym('array'),
            sym('obj')),

          'null': literal('null', null),
          'undefined': literal('undefined', undefined),
          'number': substring(seq0(optional('-'),
                             repeat0(range('0', '9'), null, 1),
                             optional(
                               seq0('.', repeat0(range('0', '9')))),
                             optional(
                               seq0('e', alt('-', '+'), repeat0(range('0', '9')))))),
          'bool': alt(literal('true', true),
                      literal('false', false)),

          'array': seq1(2,
                        '[', sym('ws'),
                        repeat(sym('value'), seq0(',', sym('ws'))), sym('ws'),
                       ']', sym('ws'))
        };
      },
      actions: [
        function obj(a) {
          var obj = {};
          for ( var i = 0 ; i < a.length ; i++ ) {
            obj[a[i][0]] = a[i][4];
          }
          return obj
        },
        function number(a) {
          return parseFloat(a);
        }
      ]
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.templates',
  name: 'TemplateOutput',

  documentation: 'A buffer for storing Template output.',

  properties: [
    {
      name: 'buf',
      factory: function() { return []; }
    }
  ],

  methods: [
    function output() {
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        var o = arguments[i];

        if ( typeof o === 'object' ) {
          this.buf.push(o.toString());
        } else {
          this.buf.push(o);
        }
      }
    },

    function toString() {
      return this.buf.length == 0 ? '' :
        this.buf.length == 1 ? this.buf[0] :
        this.buf.join('');
    }
  ]
});


foam.CLASS({
  package: 'foam.templates',
  name: 'TemplateUtil',

  documentation: 'Utility methods for working with Templates. Mostly just for internal use.',

  axioms: [ foam.pattern.Singleton.create() ],

  requires: [
    'foam.parse.ImperativeGrammar as Grammar'
  ],

  constants: {
    HEADER: 'var self = this, ctx = this.__context__, Y = this.__subContext__;\n' +
      'var output = opt_outputter ? opt_outputter : TOC(this);\n' +
      'var out = output.output.bind(output);\n' +
      "out('",
    FOOTER: "');\nreturn opt_outputter ? output : output.toString();\n"
  },

  properties: [
    {
      name: 'grammar',
      factory: function() {
        var g = this.Grammar.create({
          symbols: function(repeat0, simpleAlt, sym, seq1, seq, repeat, notChars, anyChar, not, optional, literal) {
            return {
              START: sym('markup'),

              markup: repeat0(simpleAlt(
                sym('comment'),
                sym('simple value'),
                sym('raw values tag'),
                sym('code tag'),
                sym('ignored newline'),
                sym('newline'),
                sym('single quote'),
                sym('text')
              )),

              'comment': seq1(1, '<!--', repeat0(not('-->', anyChar())), '-->'),

              'simple value': seq('%%', repeat(notChars(' ()-"\r\n><:;,')), optional('()')),

              'raw values tag': simpleAlt(
                seq('<%=', repeat(not('%>', anyChar())), '%>')
              ),

              'code tag': seq('<%', repeat(not('%>', anyChar())), '%>'),
              'ignored newline': simpleAlt(
                literal('\\\r\\\n'),
                literal('\\\n')
              ),
              newline: simpleAlt(
                literal('\r\n'),
                literal('\n')
              ),
              'single quote': literal("'"),
              text: anyChar()
            }
          }
        });

        var self = this;

        g.addActions({
          markup: function(v) {
            var wasSimple = self.simple;
            var ret = wasSimple ? null : self.out.join('');
            self.out = [];
            self.simple = true;
            return [wasSimple, ret];
          },
          'simple value': function(v) {
            self.push("',\n self.",
                v[1].join(''),
                v[2],
                ",\n'");
          },
          'raw values tag': function (v) {
            self.push("',\n",
                v[1].join(''),
                ",\n'");
          },
          'code tag': function (v) {
            self.push("');\n",
                v[1].join(''),
                ";out('");
          },
          'single quote': function() {
            self.push("\\'");
          },
          newline: function() {
            self.push('\\n');
          },
          text: function(v) {
            self.pushSimple(v);
          }
        });
        return g;
      }
    },
    {
      name: 'out',
      factory: function() { return []; }
    },
    {
      name: 'simple',
      value: true
    }
  ],

  methods: [
    function push() {
      this.simple = false;
      this.pushSimple.apply(this, arguments);
    },

    function pushSimple() {
      this.out.push.apply(this.out, arguments);
    },

    function compile(t, name, args) {
      var result = this.grammar.parseString(t);
      if ( ! result ) throw "Error parsing template " + name;

      var code = this.HEADER +
          ( result[0] ? t : result[1] ) +
          this.FOOTER;

      var newArgs = ['opt_outputter'].concat(args.map(function(a) { return a.name }));
      var f = eval(
        '(function() { ' +
          'var TOC = function(o) { return foam.templates.TemplateOutput.create(); };' +
          'var f = function(' + newArgs.join(',') + '){' + code + '};' +
          'return function() { '+
          'if ( arguments.length && arguments[0] && ! arguments[0].output ) return f.apply(this, [undefined].concat(Array.from(arguments)));' +
          'return f.apply(this, arguments);};})()');

      return f;
    },

    function lazyCompile(t, name, args) {
      return (function(util) {
        var delegate;
        return function() {
          if ( ! delegate ) delegate = util.compile(t, name, args)
          return delegate.apply(this, arguments);
        };
      })(this);
    }
  ]
});


foam.CLASS({
  package: 'foam.templates',
  name: 'TemplateAxiom',
  extends: 'Method',

  properties: [
    {
      name: 'template',
      class: 'String'
    },
    { name: 'code', required: false },
    'args'
  ],

  methods: [
    function installInProto(proto) {
      proto[this.name] =
          foam.templates.TemplateUtil.create().lazyCompile(
              this.template, this.name, this.args || []);
    }
  ]
});


foam.CLASS({
  package: 'foam.templates',
  name: 'TemplateExtension',
  refines: 'foam.core.Model',

  properties: [
    {
      name: 'templates',
      class: 'AxiomArray',
      of: 'foam.templates.TemplateAxiom',
      adaptArrayElement: function(o, prop) {
        return this.lookup(prop.of).create(o);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

foam.locale = foam.locale || 'en';

foam.CLASS({
  package: 'foam.i18n',
  name: 'MessageAxiom',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'String',
      name: 'description'
    },
    {
      class: 'Object',
      name: 'messageMap',
      help: 'Map of language codes to the message in that language.',
      factory: function() { return {}; }
    },
    {
      class: 'String',
      name: 'message',
      getter: function() { return this.message_ || this.messageMap[foam.locale]; },
      setter: function(m) { this.message_ = this.messageMap[foam.locale] = m; }
    },
    {
      class: 'Simple',
      name: 'message_'
    }
  ],

  methods: [
    function installInClass(cls) {
      Object.defineProperty(
        cls,
        this.name,
        {
          value: this.message,
          configurable: false
        });
    },

    function installInProto(proto) {
      this.installInClass(proto);
    }
  ]
});


foam.CLASS({
  package: 'foam.i18n',
  name: 'MessagesExtension',
  refines: 'foam.core.Model',

  properties: [
    {
      name: 'messages',
      class: 'AxiomArray',
      of: 'foam.i18n.MessageAxiom'
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Actions are high-level executable behaviours that are typically
  triggered by users and represented as buttons or menus.

  Actions are installed as methods on the class, but contain more
  meta-information than regular methods. Meta-information includes
  information needed to surface to action in a meaningful way to
  users, and includes things like the label to appear in the button
  or menu, a speech-label for i18n, help text, dynamic functions to
  enable or disable and hide or unhide the UI associated with this Action.

  Actions implement the Action Design Pattern.
*/
foam.CLASS({
  package: 'foam.core',
  name: 'Action',

  documentation: 'An Action is a method with extra GUI support.',

  properties: [
    {
      class: 'String',
      name: 'name',
      required: true
    },
    {
      class: 'String',
      name: 'label',
      expression: function(name) { return foam.String.labelize(name); }
    },
    {
      class: 'String',
      name: 'speechLabel',
      expression: function(label) { return label; }
    },
    {
      documentation: 'displayed on :hover',
      class: 'String',
      name: 'toolTip',
      expression: function(label) { return label; }
    },
    {
      name: 'icon'
    },
    {
      class: 'String',
      name: 'iconFontFamily',
      value: 'Material Icons'
    },
    {
      class: 'String',
      name: 'iconFontClass',
      value: 'material-icons'
    },
    {
      class: 'String',
      name: 'iconFontName'
    },
    {
      class: 'Array',
      name: 'keyboardShortcuts'
    },
    {
      class: 'String',
      name: 'help'
    },
    {
      class: 'Boolean',
      name: 'isDefault',
      help: 'Indicates if this is the default action.',
      value: false
    },
    {
      class: 'Function',
      name: 'isAvailable',
      label: 'Available',
      help: 'Function to determine if action is available.',
      value: null
    },
    {
      class: 'Function',
      name: 'isEnabled',
      label: 'Enabled',
      help: 'Function to determine if action is enabled.',
      value: null
    },
    {
      class: 'Function',
      name: 'code',
      required: true,
      value: null
    }
  ],

  methods: [
    function isEnabledFor(data) {
      return this.isEnabled ?
        data.slot(this.isEnabled).get() :
        true;
    },

    function createIsEnabled$(data$) {
      return foam.core.ExpressionSlot.create({
        obj$: data$,
        code: this.isEnabled
      });
    },

    function isAvailableFor(data) {
      return this.isAvailable ?
        foam.Function.withArgs(this.isAvailable, data) :
        true ;
    },

    function createIsAvailable$(data$) {
      return foam.core.ExpressionSlot.create({
        obj$: data$,
        code: this.isAvailable
      });
    },

    function maybeCall(ctx, data) {
      if ( this.isEnabledFor(data) && this.isAvailableFor(data) ) {
        this.code.call(data, ctx, this);
        data && data.pub('action', this.name, this);
        return true;
      }

      return false;
    },

    function installInClass(c) {
      c.installConstant(this.name, this);
    },

    function installInProto(proto) {
      var action = this;
      proto[this.name] = function() {
        return action.maybeCall(this.__context__, this);
      };
    }
  ]
});


/** Add Action support to Model. */
foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      of: 'Action',
      name: 'actions',
      adaptArrayElement: function(o, prop) {
        return typeof o === 'function' ?
            foam.core.Action.create({name: o.name, code: o}) :
            this.lookup(prop.of).create(o) ;
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
  package: 'foam.core',
  name: 'Reaction',

  properties: [
    {
      name: 'name',
      expression: function(target, topic, listener) {
        return 'reaction_' + target +  '$$' + topic + '$$' + listener;
      }
    },
    {
      class: 'String',
      name: 'target'
    },
    {
      class: 'StringArray',
      name: 'topic'
    },
    {
      name: 'listener'
    },
  ],

  methods: [
    function initObject(obj) {
      var listener = obj[this.listener];
      var topic = this.topic;

      if ( this.target === '' ) {
        obj.onDetach(obj.sub.apply(obj, this.topic.concat(listener)));
        return;
      }

      var path = this.target.split('.');

      var slot = obj;

      for ( var i = 0 ; i < path.length ; i++ ) {
        slot = slot.dot(path[i]);
      }

      if ( topic.length ) {
        var l = listener;
        var prevSub;
        var args = topic.concat(l);

        listener = function() {
          prevSub && prevSub.detach();
          var target = slot.get();
          if ( target && foam.core.FObject.isInstance(target) ) {
            obj.onDetach(prevSub = target.sub.apply(target, args));
          }
        };

        listener();
      }

      obj.onDetach(slot.sub(listener));
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',

  properties: [
    {
      class: 'AxiomArray',
      name: 'reactions',
      of: 'foam.core.Reaction',
      adaptArrayElement: function(e, prop) {
        return foam.Array.isInstance(e) ?
          foam.core.Reaction.create({target: e[0], topic: e[1] ? e[1].split('.') : [], listener: e[2] }) :
          e.class ? this.lookup(e.class).create(e, this) :
          this.lookup(prop.of).create(e, this);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.core',
  name: 'Serializable',

  documentation:
      'Marker interface to indicate that a CLASS is serializble or not.'
});
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
  package: 'foam.util',
  name: 'Timer',

  documentation: 'Timer object. Useful for creating animations.',

  properties: [
    {
      class: 'Int',
      name: 'interval',
      help: 'Interval of time between updating time.',
      // units: 'ms',
      value: 10
    },
    {
      class: 'Int',
      name: 'i',
      value: 0
    },
    {
      class: 'Float',
      name: 'timeWarp',
      value: 1.0
    },
    {
      class: 'Int',
      name:  'duration',
      units: 'ms',
      value: -1
    },
    {
      class: 'Float',
      name: 'percent',
      value: 0
    },
    {
      class: 'Int',
      name:  'startTime',
      value: 0
    },
    {
      class: 'Int',
      name:  'time',
      help:  'The current time in milliseconds since epoch.',
      adapt: function(_, t) { return Math.ceil(t); },
      value: 0
    },
    {
      class: 'Int',
      name:  'second',
      help:  'The second of the current minute.',
      value: 0
    },
    {
      class: 'Int',
      name:  'minute',
      help:  'The minute of the current hour.',
      value: 0
    },
    {
      class: 'Int',
      name:  'hour',
      help:  'The hour of the current day.',
      value: 0
    },
    {
      class: 'Boolean',
      name: 'isStarted',
      hidden: true
    },
    {
      class: 'Int',
      name: 'startTime_',
      hidden: true
    }
  ],

  methods: [
    function cycle(frequency, a, b) {
      /**
         cycle(frequency)             - cycle between -1 and 1 frequency times a second
         cycle(frequency, amplitude)  - cycle between -amplitude and amplitude frequency times a second
         cycle(frequency, start, end) - cycle between start and end frequency times a second
      */
      var s = Math.sin(this.time/1000*frequency*Math.PI*2);
      if ( arguments.length === 1 ) return s;
      if ( arguments.length === 2 ) return s * a;
      return a + (1 + s) * (b-a)/2;
    }
  ],

  actions: [
    {
      name:  'start',
      help:  'Start the timer.',
      isEnabled: function(isStarted) { return ! isStarted; },
      code:      function() { this.isStarted = true; this.tick(); }
    },
    {
      name:  'step',
      help:  'Step the timer.',
      code: function() {
        this.i++;
        this.time  += this.interval * this.timeWarp;
        this.second = this.time /    1000 % 60 << 0;
        this.minute = this.time /   60000 % 60 << 0;
        this.hour   = this.time / 3600000 % 24 << 0;
      }
    },
    {
      name:  'stop',
      help:  'Stop the timer.',
      isEnabled: function(isStarted) { return isStarted; },
      code:      function() { this.isStarted = false; }
    }
  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function(e) {
        if ( ! this.isStarted ) return;

        var prevTime = this.startTime_;
        this.startTime_ = Date.now();
        this.interval = Math.min(100, this.startTime_ - prevTime);
        this.step();
        this.tick();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.ENUM({
  package: 'foam.log',
  name: 'LogLevel',

  properties: [
    {
      class: 'String',
      name: 'shortName'
    },
    {
      class: 'String',
      name: 'consoleMethodName'
    }
  ],

  values: [
    {
      name: 'DEBUG',
      shortName: 'DEBG',
      label: 'Debug',
      consoleMethodName: 'debug'
    },
    {
      name: 'INFO',
      shortName: 'INFO',
      label: 'Info',
      consoleMethodName: 'info'
    },
    {
      name: 'WARN',
      shortName: 'WARN',
      label: 'Warn',
      consoleMethodName: 'warn'
    },
    {
      name: 'ERROR',
      shortName: 'ERRR',
      label: 'Error',
      consoleMethodName: 'error'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.log',
  name: 'Logger',

  methods: [
    { name: 'debug', documentation: 'Log at "debug" log level.' },
    { name: 'log',   documentation: 'Synonym for "info".'       },
    { name: 'info',  documentation: 'Log at "info" log level.'  },
    { name: 'warn',  documentation: 'Log at "warn" log level.'  },
    { name: 'error', documentation: 'Log at "error" log level.' }
  ],
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.log',
  name: 'ConsoleLogger',
  implements: [ 'foam.log.Logger' ],

  documentation: `Decorate contextual logging methods with log level (short
      name) and date string`,

  requires: [ 'foam.log.LogLevel' ],
  imports: [
    'debug as debug_',
    'log as log_',
    'info as info_',
    'warn as warn_',
    'error as error_'
  ],

  exports: [
    'debug',
    'log',
    'info',
    'warn',
    'error'
  ],

  properties: [
    {
      class: 'Function',
      name: 'debug',
      factory: function() { return this.put.bind(this, this.LogLevel.DEBUG); }
    },
    {
      class: 'Function',
      documentation: 'Synonym for "info".',
      name: 'log',
      factory: function() { return this.put.bind(this, this.LogLevel.INFO); }
    },
    {
      class: 'Function',
      name: 'info',
      factory: function() { return this.put.bind(this, this.LogLevel.INFO); }
    },
    {
      class: 'Function',
      name: 'warn',
      factory: function() { return this.put.bind(this, this.LogLevel.WARN); }
    },
    {
      class: 'Function',
      name: 'error',
      factory: function() { return this.put.bind(this, this.LogLevel.ERROR); }
    },
    {
      class: 'Function',
      name: 'getDateString',
      factory: function() {
        return function() { return (new Date()).toString(); };
      }
    }
  ],

  methods: [
    function put(logLevel) {
      var args = [ logLevel.shortName, '[' + this.getDateString() + ']' ]
          .concat(Array.from(arguments).slice(1));
      this[logLevel.consoleMethodName + '_'].apply(this, args);
    }
  ]
});
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
  package: 'foam.memento',
  name: 'MementoMgr',

  documentation: 'Provide memento undo/redo support.',

  properties: [
    {
      name: 'memento'
    },
    {
      name: 'stack',
      factory: function() { return []; }
    },
    {
      name: 'redo',
      factory: function() { return []; }
    },
    'posFeedback_',
    {
      class: 'Int',
      name: 'position',
      postSet: function(_, n) {
        if ( this.posFeedback_ ) return;

        while ( n < this.stackSize_ ) this.back();
        while ( n > this.stackSize_ ) this.forth();
      }
    },
    'stackSize_',
    'redoSize_',
    'totalSize_'
  ],

  methods: [
    function init() {
      this.memento$.sub(this.onMementoChange);
    },

    function updateSizes() {
      this.posFeedback_  = true;
      this.stackSize_    = this.stack.length;
      this.redoSize_     = this.redo.length;
      this.totalSize_    = this.stack.length + this.redo.length;
      this.position      = this.stack.length;
      this.posFeedback_  = false;
    },

    function remember(memento) {
      this.dumpState('preRemember');
      this.stack.push(memento);
      this.updateSizes();
      this.dumpState('postRemember');
    },

    function restore(memento) {
      this.dumpState('preRestore');
      this.ignore_ = true;
      this.memento = memento;
      this.ignore_ = false;
      this.dumpState('postRestore');
    },

    function dumpState(spot) {
      // Uncomment for debugging
      /*
      console.log('--- ', spot);
      console.log('stack: ', JSON.stringify(this.stack));
      console.log('redo: ', JSON.stringify(this.redo));
      */
    }
  ],

  actions: [
    {
      name:  'back',
      label: ' <-- ',
      help:  'Go to previous view',

      isEnabled: function(stackSize_) { return !! stackSize_; },
      code: function() {
        this.dumpState('preBack');
        this.redo.push(this.memento);
        this.restore(this.stack.pop());
        this.updateSizes();
        this.dumpState('postBack');
      }
    },
    {
      name:  'forth',
      label: ' --> ',
      help:  'Undo the previous back.',

      isEnabled: function(redoSize_) { return !! redoSize_; },
      code: function() {
        this.dumpState('preForth');
        this.remember(this.memento);
        this.restore(this.redo.pop());
        this.updateSizes();
        this.dumpState('postForth');
      }
    }
  ],

  listeners: [
    function onMementoChange(_,__,___,memento$) {
      if ( this.ignore_ ) return;

      // console.log('MementoMgr.onChange', oldValue, newValue);
      this.remember(memento$.oldValue);
      this.redo = [];
      this.updateSizes();
    }
  ]
});
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
  package: 'foam.u2',
  name: 'AttrSlot',
  implements: [ 'foam.core.Slot' ],

  documentation: 'A Value bound to an Element attribute. Used to bind values to DOM.',

  properties: [
    {
      name: 'element',
      required: true
    },
    'value',
    [ 'property', 'value'  ],
    [ 'event',    'change' ]
  ],

  methods: [
    function get() {
      return this.element.getAttribute(this.property);
    },

    function set(value) {
      this.element.setAttribute(this.property, value);

      // The next line is necessary to fire a change event.
      // This is necessary because DOM isn't proper MVC and
      // doesn't fire a change event when the value is explicitly set.
      this.value = value;
    },

    function sub(l) {
      // TODO: remove listener on unsubscribe. But how?
      if ( ! this.hasListeners() ) {
        var self = this;
        this.element.on(this.event, function() {
          self.value = self.get();
        });
      }
      return this.SUPER('propertyChange', 'value', l);
    },

    function toString() {
      return 'AttrSlot(' + this.event + ', ' + this.property + ')';
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.u2',
  name: 'ViewSpec',
  extends: 'foam.core.Property',

  documentation: 'Set a ViewFactory to be a string containing a class name, ' +
      'a Class object, or a factory function(args, context). ' +
      'Useful for rowViews and similar.',

  axioms: [
    {
      installInClass: function(cls) {
        cls.createView = function(spec, args, self, ctx) {
          if ( foam.u2.Element.isInstance(spec) )
            return spec.copyFrom(args);

          if ( foam.core.Slot.isInstance(spec) )
            return spec;

          if ( spec && spec.toE )
            return spec.toE(args, ctx);

          if ( foam.Function.isInstance(spec) )
            return foam.u2.ViewSpec.createView(spec.call(self, args, ctx), args, self, ctx);

          if ( foam.Object.isInstance(spec) ) {
            var ret = spec.create ?
                spec.create(args, ctx) :
                ctx.lookup(spec.class).create(spec, ctx).copyFrom(args || {});

            foam.assert(
                foam.u2.Element.isInstance(ret) || ret.toE,
                'ViewSpec result must extend foam.u2.Element or be toE()-able.');

            return ret;
          }

          if ( foam.core.FObject.isSubClass(spec) ) {
            var ret = spec.create(args, ctx);

            foam.assert(foam.u2.Element.isInstance(ret), 'ViewSpec class must extend foam.u2.Element or be toE()-able.');

            return ret;
          }

          if ( foam.String.isInstance(spec) || spec === undefined || spec === null )
            return foam.u2.Element.create({ nodeName: spec || 'div' }, ctx);

          throw 'Invalid ViewSpec, must provide an Element, Slot, toE()-able, Function, {create: function() {}}, {class: \'name\'}, Class, or String, but received: ' + spec;
        };
      }
    }
  ],

  properties: [
    /* TODO: uncomment this to fix ViewSpecs converting into Views when loading.
    [
      'fromJSON',
      function fromJSON(value, ctx, prop, json) {
        return value;
      }
    ],
    */
    [ 'adapt', function(_, spec, prop) {
      return foam.String.isInstance(spec) ? { class: spec } : spec ;
    } ]
    /*
    [ 'toJSON', function(value) {
      Output as string if 'class' is only defined value.
    } ]
    */
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*
TODO:
 - Remove use of E() and replace with create-ing axiom to add same behaviour.
 - create 'inner' element which defaults to this. add() adds to inner to make
   creating borders simple
 - start('leftPanel') should work for locating pre-existing named spaces
 - start, tag, and add() should use standard helper method
 - Fix handling of Slots that return arrays.
 - Properly handle insertBefore_ of an element that's already been inserted?
*/

foam.ENUM({
  package: 'foam.u2',
  name: 'ControllerMode',

  documentation: 'CRUD controller modes: CREATE/VIEW/EDIT.',

  values: [
    { name: 'CREATE', label: 'Create' },
    { name: 'VIEW',   label: 'View'   },
    { name: 'EDIT',   label: 'Edit'   }
  ]
});


foam.ENUM({
  package: 'foam.u2',
  name: 'Visibility',

  documentation: 'View visibility mode combines with current ControllerModel to determine DisplayMode.',

  values: [
    { name: 'RW',       label: 'Read-Write' },
    { name: 'FINAL',    label: 'Final',     documentation: 'FINAL views are editable only in CREATE ControllerMode.' },
    { name: 'DISABLED', label: 'Disabled',  documentation: 'DISABLED views are visible but not editable.' },
    { name: 'RO',       label: 'Read-Only'  },
    { name: 'HIDDEN',   label: 'Hidden'     }
  ]
});


foam.ENUM({
  package: 'foam.u2',
  name: 'DisplayMode',

  documentation: 'View display mode; how or if a view is displayed.',

  values: [
    { name: 'RW',       label: 'Read-Write' },
    { name: 'DISABLED', label: 'Disabled'   },
    { name: 'RO',       label: 'Read-Only'  },
    { name: 'HIDDEN',   label: 'Hidden'     }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'Entity',
  // TODO: Make both Entity and Element extend a common base-Model (Node?)

  documentation: 'Virtual-DOM Entity.',

  properties: [
    {
      name: 'name',
      // parser: seq(alphaChar, repeat0(wordChar)),
      // TODO(adamvy): This should be 'pattern' or 'regex', if those are ever
      // added.
      assertValue: function(nu) {
        if ( ! nu.match(/^[a-z#]\w*$/i) ) {
          throw new Error('Invalid Entity name: ' + nu);
        }
      }
    }
  ],

  methods: [
    function output(out) { out('&', this.name, ';'); },
    function toE() { return this; }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'CSS',

  documentation: 'Axiom to install CSS.',

  properties: [
    {
      class: 'String',
      name: 'code'
    },
    {
      name: 'name',
      factory: function() { return 'CSS-' + this.$UID; }
    },
    {
      name: 'installedDocuments_',
      factory: function() { return new WeakMap(); }
    }
  ],

  methods: [
    function installInClass(cls) {
      // Install myself in this Window, if not already there.
      var oldCreate = cls.create;
      var axiom     = this;

      cls.create = function(args, opt_parent) {
        // TODO: move this functionality somewhere reusable
        var X = opt_parent ?
          ( opt_parent.__subContext__ || opt_parent.__context__ || opt_parent ) :
          foam.__context__;

        // Install our own CSS, and then all parent models as well.
        if ( ! axiom.installedDocuments_.has(X.document) ) {
          X.installCSS(axiom.expandCSS(this, axiom.code));
          axiom.installedDocuments_.set(X.document, true);
        }

        // Now call through to the original create.
        return oldCreate.call(this, args, X);
      };
    },

    function expandCSS(cls, text) {
      /* Performs expansion of the ^ shorthand on the CSS. */
      // TODO(braden): Parse and validate the CSS.
      // TODO(braden): Add the automatic prefixing once we have the parser.
      var base = '.' + foam.String.cssClassize(cls.id);
      return text.replace(/\^(.)/g, function(match, next) {
        var c = next.charCodeAt(0);
        // Check if the next character is an uppercase or lowercase letter,
        // number, - or _. If so, add a - because this is a modified string.
        // If not, there's no extra -.
        if ( (65 <= c && c <= 90) || (97 <= c && c <= 122) ||
            (48 <= c && c <= 57) || c === 45 || c === 95 ) {
          return base + '-' + next;
        }

        return base + next;
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'DefaultValidator',

  documentation: 'Default Element validator.',

  axioms: [ foam.pattern.Singleton.create() ],

  methods: [
    function validateNodeName(name) {
      return true;
    },

    function validateClass(cls) {
      // TODO
    },

    function validateAttributeName(name) {
      // TODO
    },

    function validateAttributeValue(value) {
      // TODO
    },

    function validateStyleName(name) {
      // TODO
    },

    function validateStyleValue(value) {
      // TODO
    },

    function sanitizeText(text) {
      if ( ! text ) return text;
      text = text.toString();
      return text.replace(/[&<"']/g, function(m) {
        switch ( m ) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '"': return '&quot;';
          case "'": return '&#039';
        }
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'ElementState',

  documentation: 'Current lifecycle state of an Element.',

  methods: [
    function output(out) {},
    function load() {},
    function unload() {},
    function onRemove() {},
    // function detach() {},
    function onSetClass() {},
    function onFocus() {},
    function onAddListener() {},
    function onRemoveListener() {},
    function onSetStyle() {},
    function onSetAttr() {},
    function onRemoveAttr() {},
    function onAddChildren() {},
    function onInsertChildren() {},
    function onReplaceChild() {},
    function onRemoveChild() {},
    function getBoundingClientRect() {
      return {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        width: 0,
        height: 0
      };
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'UnloadedElementState',
  extends: 'foam.u2.ElementState',

  documentation: 'State of an unloaded Element.',

  methods: [
    function output(out) {
      this.state = this.OUTPUT;
      this.output_(out);
      return out;
    },
    function load() {
      this.error('Must output before loading.');
    },
    function unload() {
      this.error('Must output and load before unloading.');
    },
    function toString() { return 'UNLOADED'; }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'InitialElementState',
  extends: 'foam.u2.UnloadedElementState',

  documentation: 'Initial state of a newly created Element.',

  methods: [
    function output(out) {
      this.initE();
      return this.SUPER(out);
    },
    function toString() { return 'INITIAL'; }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'OutputElementState',
  extends: 'foam.u2.ElementState',

  documentation: 'State of Element after it has been output to DOM, but not yet loaded.',

  methods: [
    function output(out) {
      // TODO: raise a real error
      this.warn('ERROR: Duplicate output.');
      return this.UNLOADED.output.call(this, out);
    },
    function load() {
      if ( this.hasOwnProperty('elListeners') ) {
        var ls = this.elListeners;
        for ( var i = 0 ; i < ls.length ; i+=2 ) {
          this.addEventListener_(ls[i], ls[i+1]);
        }
      }

      this.visitChildren('load');
      this.state = this.LOADED;
      if ( this.focused ) this.el().focus();
      // Allows you to take the DOM element and map it back to a
      // foam.u2.Element object.  This is expensive when building
      // lots of DOM since it adds an extra DOM call per Element.
      // But you could use it to cut down on the number of listeners
      // in something like a table view by doing per table listeners
      // rather than per-row listeners and in the event finding the right
      // U2 view by walking the DOM tree and checking e_.
      // This could save more time than the work spent here adding e_ to each
      // DOM element.
      // this.el().e_ = this;
    },
    function unload() {
      this.state = this.UNLOADED;
      this.visitChildren('unload');
    },
    function error() {
      throw new Error('Mutations not allowed in OUTPUT state.');
    },
    function onSetClass(cls, enabled) { this.error(); },
    function onFocus(cls, enabled) { this.error(); },
    function onAddListener(topic, listener) { this.error(); },
    function onRemoveListener(topic, listener) { this.error(); },
    function onSetStyle(key, value) { this.error(); },
    function onSetAttr(key, value) { this.error(); },
    function onRemoveAttr(key) { this.error(); },
    function onAddChildren(c) { this.error(); },
    function onInsertChildren() { this.error(); },
    function onReplaceChild() { this.error(); },
    function onRemoveChild() { this.error(); },
    function toString() { return 'OUTPUT'; }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'LoadedElementState',
  extends: 'foam.u2.ElementState',

  documentation: 'State of an Element after it has been output to the DOM and loaded.',

  methods: [
    function output(out) {
      this.warn('Duplicate output.');
      return this.UNLOADED.output.call(this, out);
    },
    function load() { this.error('Duplicate load.'); },
    function unload() {
      if ( ! this.parentNode || this.parentNode.state === this.LOADED ) {
        var e = this.el();
        if ( e ) e.remove();
      }

      this.state = this.UNLOADED;
      this.visitChildren('unload');
    },
    function onRemove() { this.unload(); },
    function onSetClass(cls, enabled) {
      var e = this.el();
      if ( e ) {
        e.classList[enabled ? 'add' : 'remove'](cls);
      } else {
        this.warn('Missing Element: ', this.id);
      }
    },
    function onFocus() {
      this.el().focus();
    },
    function onAddListener(topic, listener) {
      this.addEventListener_(topic, listener);
    },
    function onRemoveListener(topic, listener) {
      this.addRemoveListener_(topic, listener);
    },
    function onSetStyle(key, value) {
      this.el().style[key] = value;
    },
    function onSetAttr(key, value) {
      if ( this.PSEDO_ATTRIBUTES[key] ) {
        this.el()[key] = value;
      } else {
        this.el().setAttribute(key, value === true ? '' : value);
      }
    },
    function onRemoveAttr(key) {
      if ( this.PSEDO_ATTRIBUTES[key] ) {
        this.el()[key] = '';
      } else {
        this.el().removeAttribute(key);
      }
    },
    function onAddChildren() {
      var e = this.el();
      if ( ! e ) {
        this.warn('Missing Element: ', this.id);
        return;
      }
      var out = this.createOutputStream();
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        out(arguments[i]);
      }
      e.insertAdjacentHTML('beforeend', out);
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        arguments[i].load && arguments[i].load();
      }
    },
    function onInsertChildren(children, reference, where) {
      var e = this.el();
      if ( ! e ) {
        this.warn('Missing Element: ', this.id);
        return;
      }
      var out = this.createOutputStream();
      for ( var i = 0 ; i < children.length ; i++ ) {
        out(children[i]);
      }

      reference.el().insertAdjacentHTML(where, out);

      // EXPERIMENTAL:
      // TODO(kgr): This causes some elements to get stuck in OUTPUT state
      // forever. It can be resurrected if that problem is fixed.
      // Load (mostly adding listeners) on the next frame
      // to allow the HTML to be shown more quickly.
      // this.__context__.window.setTimeout(function() {
      for ( var i = 0 ; i < children.length ; i++ ) {
        children[i].load && children[i].load();
      }
      // }, 33);
    },
    function onReplaceChild(oldE, newE) {
      var e = this.el();
      if ( ! e ) {
        this.warn('Missing Element: ', this.id);
        return;
      }
      var out = this.createOutputStream();
      out(newE);
      oldE.el().outerHTML = out.toString();
      newE.load && newE.load();
    },
    function onRemoveChild(child, index) {
      if ( typeof child === 'string' ) {
        this.el().childNodes[index].remove();
      } else {
        child.remove();
      }
    },
    function getBoundingClientRect() {
      return this.el().getBoundingClientRect();
    },
    function toString() { return 'LOADED'; }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'RenderSink',
  properties: [
    {
      class: 'Function',
      name: 'addRow'
    },
    {
      class: 'Function',
      name: 'cleanup'
    },
    'dao',
    {
      class: 'Int',
      name: 'batch'
    }
  ],
  methods: [
    function put(obj, s) {
      this.reset();
    },
    function remove(obj, s) {
      this.reset();
    },
    function reset() {
      this.paint();
    }
  ],
  listeners: [
    {
      name: 'paint',
      isMerged: 100,
      code: function() {
        var batch = ++this.batch;
        var self = this;
        this.dao.select().then(function(a) {
          // Check if this is a stale render
          if ( self.batch !== batch ) return;

          var objs = a.array;
          self.cleanup();
          for ( var i = 0 ; i < objs.length ; i++ ) {
            self.addRow(objs[i]);
          }
        });
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'Element',

  documentation: 'Virtual-DOM Element. Root model for all U2 UI components.',

  requires: [
    'foam.u2.AttrSlot',
    'foam.u2.DefaultValidator',
    'foam.u2.Entity',
    'foam.u2.ViewSpec'
  ],

  imports: [
    'document',
    'elementValidator',
    'framed',
    'getElementById'
  ],

  topics: [
    'onload',
    'onunload'
  ],

  constants: {
    // Psedo-attributes don't work consistently with setAttribute()
    // so need to be set on the real DOM element directly.
    PSEDO_ATTRIBUTES: {
      value: true,
      checked: true
    },

    DEFAULT_VALIDATOR: foam.u2.DefaultValidator.create(),

    // State of an Element after it has been output (to a String) but before it is loaded.
    // This should be only a brief transitory state, as the Element should be loaded
    // almost immediately after being output. It is an error to try and mutate the Element
    // while in the OUTPUT state.
    OUTPUT: foam.u2.OutputElementState.create(),

    // State of an Element after it has been loaded.
    // A Loaded Element should be visible in the DOM.
    LOADED: foam.u2.LoadedElementState.create(),

    // State of an Element after it has been removed from the DOM.
    // An unloaded Element can be readded to the DOM.
    UNLOADED: foam.u2.UnloadedElementState.create(),

    // Initial state of an Element before it has been added to the DOM.
    INITIAL: foam.u2.InitialElementState.create(),

    // ???: Add DESTROYED State?

    // TODO: Don't allow these as they lead to ambiguous markup.
    OPTIONAL_CLOSE_TAGS: {
      BODY: true,
      COLGROUP: true,
      DD: true,
      DT: true,
      HEAD: true,
      HTML: true,
      LI: true,
      OPTION: true,
      P: true,
      TBODY: true,
      TD: true,
      TFOOT: true,
      TH: true,
      THEAD: true,
      TR: true
    },

    // Element nodeName's that are self-closing.
    // Used to generate valid HTML output.
    // Used by ElementParser for valid HTML parsing.
    ILLEGAL_CLOSE_TAGS: {
      AREA: true,
      BASE: true,
      BASEFONT: true,
      BR: true,
      COL: true,
      FRAME: true,
      HR: true,
      IMG: true,
      INPUT: true,
      ISINDEX: true,
      LINK: true,
      META: true,
      PARAM: true
    },

    __ID__: [ 0 ],

    NEXT_ID: function() {
      return 'v' + this.__ID__[ 0 ]++;
    },

    // Keys which respond to keydown but not keypress
    KEYPRESS_CODES: { 8: true, 13: true, 33: true, 34: true, 37: true, 38: true, 39: true, 40: true },

    NAMED_CODES: {
      '13': 'enter',
      '37': 'left',
      '38': 'up',
      '39': 'right',
      '40': 'down'
    }
  },

  axioms: [
    foam.u2.CSS.create({
      // We hide Elements by adding this style rather than setting
      // 'display: none' directly because then when we re-show the
      // Element we don't need to remember it's desired 'display' value.
      code: '.foam-u2-Element-hidden { display: none !important; }'
    })
  ],

  properties: [
    {
      name: 'id',
      transient: true,
      factory: function() { return this.NEXT_ID(); }
    },
    {
      name: 'state',
      class: 'Proxy',
      of: 'foam.u2.ElementState',
      transient: true,
      topics: [],
      delegates: foam.u2.ElementState.getOwnAxiomsByClass(foam.core.Method).
          map(function(m) { return m.name; }),
      factory: function() { return this.INITIAL; },
      postSet: function(oldState, state) {
        if ( state === this.LOADED ) {
          this.pub('onload');
        } else if ( state === this.UNLOADED ) {
          this.pub('onunload');
        }
      }
    },
    {
      name: 'content',
      preSet: function(o, n) {
        // Prevent setting to 'this', which wouldn't change the behaviour.
        return n === this ? null : n ;
      }
    },
    {
      name: 'parentNode',
      transient: true
    },
    {
      class: 'Boolean',
      name: 'shown',
      value: true,
      postSet: function(o, n) {
        if ( o === n ) return;
        if ( n ) {
          this.removeClass('foam-u2-Element-hidden');
        } else {
          this.addClass('foam-u2-Element-hidden');
        }
      }
    },
    {
      class: 'Proxy',
      of: 'foam.u2.DefaultValidator',
      name: 'validator',
      topics: [],
      factory: function() {
        return this.elementValidator$ ? this.elementValidator : this.DEFAULT_VALIDATOR;
      }
    },
    {
      name: 'nodeName',
      adapt: function(_, v) {
        // Convert to uppercase so that checks against OPTIONAL_CLOSE_TAGS
        // and ILLEGAL_CLOSE_TAGS work.
        return foam.String.toUpperCase(v);
      },
      value: 'DIV'
    },
    {
      name: 'attributeMap',
      // documentation: 'Same information as "attributes", but in map form for faster lookup',
      transient: true,
      factory: function() { return {}; }
    },
    {
      name: 'attributes',
      // documentation: 'Array of {name: ..., value: ...} attributes.',
      factory: function() { return []; },
      postSet: function(_, attrs) {
        this.attributeMap = {};
        for ( var i = 0 ; i < attrs.length ; i++ ) {
          this.attributeMap[attrs[i].name] = attrs[i];
        }
      }
    },
    {
      name: 'classes',
      // documentation: 'CSS classes assigned to this Element. Stored as a map of true values.',
      factory: function() { return {}; }
    },
    {
      name: 'css',
      // documentation: 'Styles added to this Element.',
      factory: function() { return {}; }
    },
    {
      name: 'childNodes',
      // documentation: 'Children of this Element.',
      factory: function() { return []; }
    },
    {
      name: 'elListeners',
      // documentation: 'DOM listeners of this Element. Stored as topic then listener.',
      factory: function() { return []; }
    },
    {
      name: 'children',
      // documentation: 'Virtual property of non-String childNodes.',
      transient: true,
      getter: function() {
        return this.childNodes.filter(function(c) {
          return typeof c !== 'string';
        });
      }
    },
    {
      class: 'Boolean',
      name: 'focused'
    },
    {
      name: 'outerHTML',
      transient: true,
      hidden: true,
      getter: function() {
        return this.output(this.createOutputStream()).toString();
      }
    },
    {
      name: 'innerHTML',
      transient: true,
      hidden: true,
      getter: function() {
        return this.outputInnerHTML(this.createOutputStream()).toString();
      }
    },
    {
      name: 'scrollHeight',
    },
    {
      name: 'clickTarget_'
    },
    {
      name: '__subSubContext__',
      factory: function() { return this.__subContext__; }
    },
    'keyMap_'
  ],

  methods: [
    function init() {
      this.onDetach(this.visitChildren.bind(this, 'detach'));
    },

    function initE() {
      this.initKeyboardShortcuts();
      /*
        Template method for adding addtion element initialization
        just before Element is output().
      */
    },

    function observeScrollHeight() {
      // TODO: This should be handled by an onsub event when someone subscribes to
      // scroll height changes.
      var self = this;
      var observer = new MutationObserver(function(mutations) {
        self.scrollHeight = self.el().scrollHeight;
      });
      var config = { attributes: true, childList: true, characterData: true };

      this.onload.sub(function(s) {
        observer.observe(self.el(), config);
      });
      this.onunload.sub(function(s) {
        observer.disconnect()
      });
      return this;
    },

    function evtToCharCode(evt) {
      /* Maps an event keycode to a string */
      var s = '';
      if ( evt.altKey   ) s += 'alt-';
      if ( evt.ctrlKey  ) s += 'ctrl-';
      if ( evt.shiftKey && evt.type === 'keydown' ) s += 'shift-';
      if ( evt.metaKey  ) s += 'meta-';
      s += evt.type === 'keydown' ?
          this.NAMED_CODES[evt.which] || String.fromCharCode(evt.which) :
          String.fromCharCode(evt.charCode);
      return s;
    },

    function initKeyMap_(keyMap, cls) {
      var count = 0;

      var as = cls.getAxiomsByClass(foam.core.Action);

      for ( var i = 0 ; i < as.length ; i++ ) {
        var a = as[i];

        for ( var j = 0 ; a.keyboardShortcuts && j < a.keyboardShortcuts.length ; j++, count++ ) {
          var key = a.keyboardShortcuts[j];

          // First, lookup named codes, then convert numbers to char codes,
          // otherwise, assume we have a single character string treated as
          // a character to be recognized.
          if ( this.NAMED_CODES[key] ) {
            key = this.NAMED_CODES[key];
          } else if ( typeof key === 'number' ) {
            key = String.fromCharCode(key);
          }

          keyMap[key] = a.maybeCall.bind(a, this.__subContext__, this);
          /*
          keyMap[key] = opt_value ?
            function() { a.maybeCall(this.__subContext__, opt_value.get()); } :
            a.maybeCall.bind(action, self.X, self) ;
          */
        }
      }

      return count;
    },

    function initKeyboardShortcuts() {
      /* Initializes keyboard shortcuts. */
      var keyMap = {}
      var count = this.initKeyMap_(keyMap, this.cls_);

      //      if ( this.of ) count += this.initKeyMap_(keyMap, this.of);

      if ( count ) {
        this.keyMap_ = keyMap;
        var target = this.parentNode || this;

        // Ensure that target is focusable, and therefore will capture keydown
        // and keypress events.
        target.setAttribute('tabindex', target.tabIndex || 1);

        target.on('keydown',  this.onKeyboardShortcut);
        target.on('keypress', this.onKeyboardShortcut);
      }
    },

    function el() {
      /* Return this Element's real DOM element, if loaded. */
      return this.getElementById(this.id);
    },

    function findChildForEvent(e) {
      var src  = e.srcElement;
      var el   = this.el();
      var cMap = {};
      var cs   = this.children;

      if ( ! el ) return;

      for ( var i = 0 ; i < cs.length ; i++ ) {
        var c = cs[i];
        cMap[c.id] = c;
      }

      while ( src !== el ) {
        var c = cMap[src.id];
        if ( c ) return c;
        src = src.parentElement;
      }
    },

    function E(opt_nodeName) {
      return this.__subSubContext__.E(opt_nodeName);
    },

    // function XXXE(opt_nodeName /* | DIV */) {
    //   /* Create a new Element */
    //   var Y = this.__subContext__;
    //
    //   // ???: Is this needed / a good idea?
    //   if ( this.data && ! Y.data ) Y = Y.createSubContext({ data: this.data });
    //
    //   // Some names have sub-Models registered for them.
    //   // Example 'input'
    //   var e = Y.elementForName(opt_nodeName);
    //
    //   if ( ! e ) {
    //     e = foam.u2.Element.create(null, Y);
    //     if ( opt_nodeName ) e.nodeName = opt_nodeName;
    //   }
    //
    //   return e;
    // },

    function attrSlot(opt_name, opt_event) {
      /* Convenience method for creating an AttrSlot's. */
      var args = { element: this };

      if ( opt_name  ) args.property = opt_name;
      if ( opt_event ) args.event    = opt_event;

      return this.AttrSlot.create(args);
    },

    function myCls(opt_extra) {
      console.warn('Deprecated use of Element.myCls(). Use myClass() instead.');
      return this.myClass(opt_extra);
    },

    function myClass(opt_extra) {
      var f = this.cls_.myClass_;

      if ( ! f ) {
        var base = foam.String.cssClassize(this.cls_.id).split(/ +/);

        f = this.cls_.myClass_ = foam.Function.memoize1(function(e) {
          return base.map(function(c) { return c + (e ? '-' + e : ''); }).join(' ');
        });
      }

      return f(opt_extra);
    },

    function visitChildren(methodName) {
      /*
        Call the named method on all children.
        Typically used to transition state of all children at once.
        Ex.: this.visitChildren('load');
      */
      var cs = this.childNodes;
      for ( var i = 0 ; i < cs.length ; i++ ) {
        var c = cs[i];
        c[methodName] && c[methodName].call(c);
      }
    },


    //
    // Focus
    //

    function focus() {
      this.focused = true;
      this.onFocus();
      return this;
    },

    function blur() {
      this.focused = false;
      return this;
    },


    //
    // Visibility
    //
    // Fluent methods for setting 'shown' property.

    function show(opt_shown) {
      if ( opt_shown === undefined ) {
        this.shown = true;
      } else if ( foam.core.Slot.isInstance(opt_shown) ) {
        this.shown$.follow(opt_shown);
      } else {
        this.shown = !! opt_shown;
      }

      return this;
    },

    function hide(opt_hidden) {
      return this.show(
          opt_hidden === undefined              ? false :
          foam.core.Slot.isInstance(opt_hidden) ? opt_hidden.map(function(s) { return ! s; }) :
          ! opt_hidden);
    },


    //
    // DOM Compatibility
    //
    // Methods with the same interface as the real DOM.

    function setAttribute(name, value) {
      /*
        Set an Element attribute or property.

        If this model has a property named 'name' which has 'attribute: true',
        then the property will be updated with value.
        Otherwise, the DOM attribute will be set.

        Value can be either a string, a Value, or an Object.
        If Value is undefined, null or false, the attribute will be removed.
      */

      // TODO: type checking

      // handle slot binding, ex.: data$: ...,
      // Remove if we add a props() method
      if ( name.endsWith('$') ) {
        this[name] = value;
        return;
      }

      var prop = this.cls_.getAxiomByName(name);

      if ( prop &&
           foam.core.Property.isInstance(prop) &&
           prop.attribute )
      {
        if ( typeof value === 'string' ) {
          // TODO: remove check when all properties have fromString()
          this[name] = prop.fromString ? prop.fromString(value) : value;
        } else if ( foam.core.Slot.isInstance(value) ) {
          this.slot(name).follow(value);
        } else {
          this[name] = value;
        }
      } else {
        if ( value === undefined || value === null || value === false ) {
          this.removeAttribute(name);
          return;
        }

        if ( foam.core.Slot.isInstance(value) ) {
          this.slotAttr_(name, value);
        } else {
          foam.assert(
              typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || foam.Date.isInstance(value),
              'Attribute value must be a primitive type.');

          var attr = this.getAttributeNode(name);

          if ( attr ) {
            attr.value = value;
          } else {
            attr = { name: name, value: value };
            this.attributes.push(attr);
            this.attributeMap[name] = attr;
          }

          this.onSetAttr(name, value);
        }
      }
    },

    function removeAttribute(name) {
      /* Remove attribute named 'name'. */
      for ( var i = 0 ; i < this.attributes.length ; i++ ) {
        if ( this.attributes[i].name === name ) {
          this.attributes.splice(i, 1);
          delete this.attributeMap[name];
          this.onRemoveAttr(name);
          return;
        }
      }
    },

    function getAttributeNode(name) {
      /*
        Get {name: ..., value: ...} attributeNode associated
        with 'name', if exists.
      */
      return this.attributeMap[name];
    },

    function getAttribute(name) {
      // TODO: add support for other dynamic attributes also
      // TODO: don't lookup in real DOM if listener present
      if ( this.PSEDO_ATTRIBUTES[name] && this.el() ) {
        var value = this.el()[name];
        var attr  = this.getAttributeNode(name);

        if ( attr ) {
          attr[name] = value;
        } else {
          attr = { name: name, value: value };
          this.attributes.push(attr);
          this.attributeMap[name] = attr;
        }

        return value;
      }

      /*
        Get value associated with attribute 'name',
        or undefined if attribute not set.
      */
      var attr = this.getAttributeNode(name);
      return attr && attr.value;
    },

    function appendChild(c) {
      // TODO: finish implementation
      this.childNodes.push(c);
    },

    function removeChild(c) {
      /* Remove a Child node (String or Element). */
      var cs = this.childNodes;
      for ( var i = 0 ; i < cs.length ; ++i ) {
        if ( cs[i] === c ) {
          cs.splice(i, 1);
          this.state.onRemoveChild.call(this, c, i);
          return;
        }
      }
    },

    function replaceChild(newE, oldE) {
      /* Replace current child oldE with newE. */
      var cs = this.childNodes;
      for ( var i = 0 ; i < cs.length ; ++i ) {
        if ( cs[i] === oldE ) {
          cs[i] = newE;
          newE.parentNode = this;
          this.state.onReplaceChild.call(this, oldE, newE);
          oldE.unload && oldE.unload();
          return;
        }
      }
    },

    function insertBefore(child, reference) {
      /* Insert a single child before the reference element. */
      return this.insertAt_(child, reference, true);
    },

    function insertAfter(child, reference) {
      /* Insert a single child after the reference element. */
      return this.insertAt_(child, reference, false);
    },

    function remove() {
      /*
        Remove this Element from its parent Element.
        Will transition to UNLOADED state.
      */
      this.onRemove();

      if ( this.parentNode ) {
        var cs = this.parentNode.childNodes;
        for ( var i = 0 ; i < cs.length ; i++ ) {
          if ( cs[i] === this ) {
            cs.splice(i, 1);
            return;
          }
        }
        this.parentNode = undefined;
      }
    },

    function addEventListener(topic, listener) {
      /* Add DOM listener. */
      this.elListeners.push(topic, listener);
      this.onAddListener(topic, listener);
    },

    function removeEventListener(topic, listener) {
      /* Remove DOM listener. */
      var ls = this.elListeners;
      for ( var i = 0 ; i < ls.length ; i+=2 ) {
        var t = ls[i], l = ls[i+1];
        if ( t === topic && l === listener ) {
          ls.splice(i, 2);
          this.onRemoveListener(topic, listener);
          return;
        }
      }
    },


    //
    // Fluent Methods
    //
    // Methods which return 'this' so they can be chained.

    function setNodeName(name) {
      this.nodeName = name;
      return this;
    },

    function setID(id) {
      /*
        Explicitly set Element's id.
        Normally id's are automatically assigned.
        Setting specific ID's hinders composability.
      */
      this.id = id;
      return this;
    },

    function entity(name) {
      /* Create and add a named entity. Ex. .entity('gt') */
      this.add(this.Entity.create({ name: name }));
      return this;
    },

    function nbsp() {
      return this.entity('nbsp');
    },

    function cssClass(cls) {
      return this.addClass(cls);
    },

    function addClass(cls) { /* Slot | String */
      /* Add a CSS cls to this Element. */
      var self = this;
      if ( foam.core.Slot.isInstance(cls) ) {
        var lastValue = null;
        var l = function() {
          var v = cls.get();
          self.addClass_(lastValue, v);
          lastValue = v;
        };
        cls.sub(l);
        l();
      } else if ( typeof cls === 'string' ) {
        this.addClass_(null, cls);
      } else {
        this.error('cssClass type error. Must be Slot or String.');
      }

      return this;
    },

    function enableCls(cls, enabled, opt_negate) {
      console.warn('Deprecated use of Element.enableCls(). Use enableClass() instead.');
      return this.enableClass(cls, enabled, opt_negate);
    },

    function enableClass(cls, enabled, opt_negate) {
      /* Enable/disable a CSS class based on a boolean-ish dynamic value. */
      function negate(a, b) { return b ? ! a : a; }

      // TODO: add type checking
      if ( foam.core.Slot.isInstance(enabled) ) {
        var self = this;
        var value = enabled;
        var l = function() { self.enableClass(cls, value.get(), opt_negate); };
        value.sub(l);
        l();
      } else {
        enabled = negate(enabled, opt_negate);
        var parts = cls.split(' ');
        for ( var i = 0 ; i < parts.length ; i++ ) {
          this.classes[parts[i]] = enabled;
          this.onSetClass(parts[i], enabled);
        }
      }
      return this;
    },

    function removeCls(cls) {
      console.warn('Deprecated use of Element.removeCls(). Use removeClass() instead.');
      return this.removeClass(cls);
    },

    function removeClass(cls) {
      /* Remove specified CSS class. */
      if ( cls ) {
        delete this.classes[cls];
        this.onSetClass(cls, false);
      }
      return this;
    },

    function on(topic, listener) {
      /* Shorter fluent version of addEventListener. Prefered method. */
      this.addEventListener(topic, listener);
      return this;
    },

    function attr(key, value) {
      this.setAttribute(key, value);
      return this;
    },

    function attrs(map) {
      /* Set multiple attributes at once. */
      for ( var key in map ) this.setAttribute(key, map[key]);
      return this;
    },

    function style(map) {
      /*
        Set CSS styles.
        Map values can be Objects or dynamic Values.
      */
      for ( var key in map ) {
        var value = map[key];
        if ( foam.core.Slot.isInstance(value) ) {
          this.slotStyle_(key, value);
        } else {
          this.style_(key, value);
        }
        // TODO: add type checking for this
      }

      return this;
    },

    function tag(spec, args, slot) {
      /* Create a new Element and add it as a child. Return this. */
      var c = this.createChild_(spec, args);
      this.add(c);
      if ( slot ) slot.set(c);
      return this;
    },

    function br() {
      return this.tag('br');
    },

    function startContext(map) {
      var m = {};
      Object.assign(m, map);
      m.__oldAddContext__ = this.__subSubContext__;
      this.__subSubContext__ = this.__subSubContext__.createSubContext(m);
      return this;
    },

    function endContext() {
      this.__subSubContext__ = this.__subSubContext__.__oldAddContext__;
      return this;
    },

    function createChild_(spec, args) {
      return foam.u2.ViewSpec.createView(spec, args, this, this.__subSubContext__);
    },

    function start(spec, args, slot) {
      /* Create a new Element and add it as a child. Return the child. */
      var c = this.createChild_(spec, args);
      this.add(c);
      if ( slot ) slot.set(c);
      return c;
    },

    function end() {
      /* Return this Element's parent. Used to terminate a start(). */
      return this.parentNode;
    },

    function add() {
      if ( this.content ) {
        this.content.add_(arguments, this);
      } else {
        this.add_(arguments, this);
      }
      return this;
    },

    function toE() {
      return this;
    },

    function add_(cs, parentNode) {
      /* Add Children to this Element. */
      var es = [];
      var Y = this.__subSubContext__;

      for ( var i = 0 ; i < cs.length ; i++ ) {
        var c = cs[i];

        // Remove null values
        if ( c === undefined || c === null ) {
          // nop
        } else if ( Array.isArray(c) ) {
          for ( var j = 0 ; j < c.length ; j++ ) {
            var v = c[j];
            es.push(v.toE ? v.toE(null, Y) : v);
          }
        } else if ( c.toE ) {
          var e = c.toE(null, Y);
          if ( foam.core.Slot.isInstance(e) ) {
            e = this.slotE_(e);
          }
          es.push(e);
        } else if ( typeof c === 'function' ) {
          throw new Error('Unsupported');
        } else if ( foam.core.Slot.isInstance(c) ) {
          var v = this.slotE_(c);
          if ( Array.isArray(v) ) {
            for ( var j = 0 ; j < v.length ; j++ ) {
              var u = v[j];
              es.push(u.toE ? u.toE(null, Y) : u);
            }
          } else {
            es.push(v.toE ? v.toE(null, Y) : v);
          }
        } else {
          es.push(c);
        }
      }

      if ( es.length ) {
        for ( var i = 0 ; i < es.length ; i++ ) {
          if ( foam.u2.Element.isInstance(es[i]) ) {
            es[i].parentNode = parentNode;
          } else if ( es[i].cls_ && es[i].cls_.id === 'foam.u2.Entity' ) {
            // NOP
          } else {
            es[i] = this.sanitizeText(es[i]);
          }
        }

        this.childNodes.push.apply(this.childNodes, es);
        this.onAddChildren.apply(this, es);
      }

      return this;
    },

    function addBefore(reference) { /*, vargs */
      /* Add a variable number of children before the reference element. */
      var children = [];
      for ( var i = 1 ; i < arguments.length ; i++ ) {
        children.push(arguments[i]);
      }
      return this.insertAt_(children, reference, true);
    },

    function removeAllChildren() {
      /* Remove all of this Element's children. */
      var cs = this.childNodes;
      while ( cs.length ) {
        this.removeChild(cs[0]);
      }
      return this;
    },

    function setChildren(slot) {
      /**
         slot -- a Slot of an array of children which set this element's
         contents, replacing old children
      **/
      var l = function() {
        this.removeAllChildren();
        this.add.apply(this, slot.get());
      }.bind(this);

      slot.sub(l);
      l();

      return this;
    },

    function repeat(s, e, f) {
      // TODO: support descending
      for ( var i = s ; i <= e ; i++ ) {
        f.call(this, i);
      }
      return this;
    },

    function daoSlot(dao, sink) {
      var slot = foam.dao.DAOSlot.create({
        dao: dao,
        sink: sink
      });

      this.onDetach(slot);

      return slot;
    },

    function select(dao, f, update) {
      var es   = {};
      var self = this;

      var listener = foam.u2.RenderSink.create({
        dao: dao,
        addRow: function(o) {
          if ( update ) o = o.clone();

          self.startContext({data: o});

          var e = f.call(self, o);

          if ( update ) {
            o.propertyChange.sub(function(_,__,prop,slot) {
              dao.put(o.clone());
            });
          }

          self.endContext();

          if ( es[o.id] ) {
            self.replaceChild(es[o.id], e);
          } else {
            self.add(e);
          }
          es[o.id] = e;
        },
        cleanup: function() {
          for ( var key in es ) {
            es[key].remove();
          }

          es = {};
        }
      })

      this.onDetach(dao.listen(listener));
      listener.paint();

      return this;
    },

    function call(f, args) {
      f.apply(this, args);

      return this;
    },

    function forEach(a, f) {
      for ( var i = 0 ; i < a.length ; i++ ) {
        f.call(this, a[i], i);
      }

      return this;
    },

    //
    // Output Methods
    //

    function outputInnerHTML(out) {
      var cs = this.childNodes;
      for ( var i = 0 ; i < cs.length ; i++ ) {
        out(cs[i]);
      }
      return out;
    },

    function createOutputStream() {
      /*
        Create an OutputStream.
        Suitable for providing to the output() method for
        serializing an Element hierarchy.
        Call toString() on the OutputStream to get output.
      */
      var self = this;
      var buf = [];
      var Element = foam.u2.Element;
      var Entity  = self.Entity;
      var f = function templateOut(/* arguments */) {
        for ( var i = 0 ; i < arguments.length ; i++ ) {
          var o = arguments[i];
          if ( o === null || o === undefined ) {
            // NOP
          } else if ( typeof o === 'string' ) {
            buf.push(o);
          } else if ( typeof o === 'number' ) {
            buf.push(o);
          } else if ( Element.isInstance(o) || Entity.isInstance(o) ) {
            o.output(f);
          } else if ( o === null || o === undefined ) {
            buf.push(o);
          }
        }
      };

      f.toString = function() {
        if ( buf.length === 0 ) return '';
        if ( buf.length > 1 ) return buf.join('');
        return buf[0];
      };

      return f;
    },

    function write() {
      /* Write Element to document. */
      this.document.body.insertAdjacentHTML('beforeend', this.outerHTML);
      this.load();
      return this;
    },

    function toString() {
      return this.cls_.id + '(nodeName=' + this.nodeName + ', state=' + this.state + ')';
      /* Converts Element to HTML String without transitioning state. */
      /*
        TODO: put this somewhere useful for debugging
      var s = this.createOutputStream();
      this.output_(s);
      return s.toString();
      */
    },


    //
    // Internal (DO NOT USE)
    //

    // (Element[], Element, Boolean)
    function insertAt_(children, reference, before) {
      var i = this.childNodes.indexOf(reference);

      if ( i === -1 ) {
        this.warn("Reference node isn't a child of this.");
        return this;
      }

      if ( ! Array.isArray(children) ) children = [ children ];

      var Y = this.__subSubContext__;
      children = children.map(function(e) {
        e = e.toE ? e.toE(null, Y) : e;
        e.parentNode = this;
        return e;
      }.bind(this));

      var index = before ? i : (i + 1);
      this.childNodes.splice.apply(this.childNodes,
          [ index, 0 ].concat(children));

      this.state.onInsertChildren.call(
        this,
        children,
        reference,
        before ? 'beforebegin' : 'afterend');

      return this;
    },

    function addClass_(oldClass, newClass) {
      /* Replace oldClass with newClass. Called by cls(). */
      if ( oldClass === newClass ) return;
      this.removeClass(oldClass);
      if ( newClass ) {
        this.classes[newClass] = true;
        this.onSetClass(newClass, true);
      }
    },

    function slotAttr_(key, value) {
      /* Set an attribute based off of a dynamic Value. */
      var self = this;
      var l = function() { self.setAttribute(key, value.get()); };
      value.sub(l);
      l();
    },

    function slotStyle_(key, v) {
      /* Set a CSS style based off of a dynamic Value. */
      var self = this;
      var l = function(value) { self.style_(key, v.get()); };
      v.sub(l);
      l();
    },

    function style_(key, value) {
      /* Set a CSS style based off of a literal value. */
      this.css[key] = value;
      this.onSetStyle(key, value);
      return this;
    },

    // TODO: add same context capturing behviour to other slotXXX_() methods.
    function slotE_(slot) {
      /*
        Return an Element or an Array of Elements which are
        returned from the supplied dynamic Slot.
        The Element(s) are replaced when the Slot changes.
      */
      var self = this;
      var ctx  = this.__subSubContext__;

      function nextE() {
        // Run Slot in same subSubContext that it was created in.
        var oldCtx = self.__subSubContext__;
        self.__subSubContext__ = ctx;
        var e = slot.get();

        // Convert e or e[0] into a SPAN if needed,
        // So that it can be located later.
        if ( e === undefined || e === null || e === '' ) {
          e = self.E('SPAN');
        } else if ( Array.isArray(e) ) {
          if ( e.length ) {
            if ( typeof e[0] === 'string' ) {
              e[0] = self.E('SPAN').add(e[0]);
            }
          } else {
            e = self.E('SPAN');
          }
        } else if ( ! foam.u2.Element.isInstance(e) ) {
          e = self.E('SPAN').add(e);
        }

        self.__subSubContext__ = oldCtx;

        return e;
      }

      var e = nextE();
      var l = function() {
        if ( self.state !== self.LOADED ) {
          s && s.detach();
          return;
        }
        var first = Array.isArray(e) ? e[0] : e;
        var tmp = self.E();
        self.insertBefore(tmp, first);
        if ( Array.isArray(e) ) {
          for ( var i = 0 ; i < e.length ; i++ ) { e[i].remove(); e[i].detach(); }
        } else {
          if ( e.state === e.LOADED ) { e.remove(); e.detach(); }
        }
        var e2 = nextE();
        self.insertBefore(e2, tmp);
        tmp.remove();
        e = e2;
      };

      var s = slot.sub(this.framed(l));
      this.onDetach(s);

      return e;
    },

    function addEventListener_(topic, listener) {
      var el = this.el();
      el && el.addEventListener(topic, listener, false);
    },

    function removeEventListener_(topic, listener) {
      this.el() && this.el().removeEventListener(topic, listener);
    },

    function output_(out) {
      /** Output the element without transitioning to the OUTPUT state. **/
      out('<', this.nodeName);
      if ( this.id !== null ) out(' id="', this.id, '"');

      var first = true;
      if ( this.hasOwnProperty('classes') ) {
        var cs = this.classes;
        for ( var key in cs ) {
          if ( ! cs[key] ) continue;
          if ( first ) {
            out(' class="');
            first = false;
          } else {
            out(' ');
          }
          out(key);
        }
        if ( ! first ) out('"');
      }

      if ( this.hasOwnProperty('css') ) {
        first = true;
        var cs = this.css;
        for ( var key in cs ) {
          var value = cs[key];

          if ( first ) {
            out(' style="');
            first = false;
          }
          out(key, ':', value, ';');
        }
        if ( ! first ) out('"');
      }

      if ( this.hasOwnProperty('attributes') ) {
        var as = this.attributes;
        for ( var i = 0 ; i < as.length ; i++ ) {
          var attr  = as[i];
          var name  = attr.name;
          var value = attr.value;

          out(' ', name);
          if ( value !== false ) out('="', value, '"');
        }
      }

      if ( ! this.ILLEGAL_CLOSE_TAGS[this.nodeName] ) {
        var hasChildren = this.hasOwnProperty('childNodes') && this.childNodes.length;
        if ( hasChildren || ! this.OPTIONAL_CLOSE_TAGS[this.nodeName] ) {
          out('>');
          if ( hasChildren ) this.outputInnerHTML(out);
          out('</', this.nodeName);
        }
      }

      out('>');
    }
  ],

  listeners: [
    {
      name: 'onKeyboardShortcut',
      documentation: function() {/*
          Automatic mapping of keyboard events to $$DOC{ref:'Action'} trigger.
          To handle keyboard shortcuts, create and attach $$DOC{ref:'Action',usePlural:true}
          to your $$DOC{ref:'foam.ui.View'}.
      */},
      code: function(evt) {
        if ( evt.type === 'keydown' && ! this.KEYPRESS_CODES[evt.which] ) return;
        var action = this.keyMap_[this.evtToCharCode(evt)];
        if ( action ) {
          action();
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'U2Context',

  documentation: 'Context which includes U2 functionality.',

  exports: [
    'E',
    'registerElement',
    'elementForName'
  ],

  properties: [
    {
      name: 'elementMap',
      documentation: 'Map of registered Elements.',
      factory: function() { return {}; }
    }
  ],

  methods: [
    {
      class: 'foam.core.ContextMethod',
      name: 'E',
      code: function E(ctx, opt_nodeName) {
        var nodeName = (opt_nodeName || 'div').toUpperCase();

        return (
          ctx.elementForName(nodeName) || foam.u2.Element).
          create({nodeName: nodeName}, ctx);
      }
    },

    function registerElement(elClass, opt_elName) {
      /* Register a View class against an abstract node name. */
      var key = opt_elName || elClass.name;
      this.elementMap[key.toUpperCase()] = elClass;
    },

    function elementForName(nodeName) {
      /* Find an Element Class for the specified node name. */
      return this.elementMap[nodeName];
    }
  ]
});

foam.__context__ = foam.u2.U2Context.create().__subContext__;


foam.CLASS({
  refines: 'foam.core.FObject',
  methods: [
    function toE(args, X) {
      return foam.u2.ViewSpec.createView(
        { class: 'foam.u2.DetailView', showActions: true, data: this },
        args, this, X);
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Slot',
  methods: [
    function toE() { return this; }
  ]
});


foam.CLASS({
  refines: 'foam.core.ExpressionSlot',
  methods: [
    function toE() { return this; }
  ]
});


foam.CLASS({
  refines: 'foam.core.Property',

  requires: [
    'foam.u2.TextField'
  ],

  properties: [
    {
      // If true, this property is treated as a psedo-U2 attribute.
      name: 'attribute',
      value: false
    },
    {
      class: 'foam.u2.ViewSpec',
      name: 'view',
      value: { class: 'foam.u2.TextField' }
    },
    {
      class: 'Enum',
      of: 'foam.u2.Visibility',
      name: 'visibility',
      value: foam.u2.Visibility.RW
    }
  ],

  methods: [
    function toE(args, X) {
      var e = foam.u2.ViewSpec.createView(this.view, args, this, X);

      e.fromProperty && e.fromProperty(this);

      if ( X.data$ && ! ( args && ( args.data || args.data$ ) ) ) {
        e.data$ = X.data$.dot(this.name);
      }

      // e could be a Slot, so check if addClass exists
      e.addClass && e.addClass('property-' + this.name);

      return e;
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.String',
  properties: [
    {
      class: 'Int',
      name: 'displayWidth',
      expression: function(width) { return width; }
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.StringArray',
  properties: [
    [ 'view', { class: 'foam.u2.view.StringArrayView' } ]
  ]
});

foam.CLASS({
  refines: 'foam.core.Date',
  requires: [ 'foam.u2.DateView' ],
  properties: [
    [ 'view', { class: 'foam.u2.DateView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.DateTime',
  requires: [ 'foam.u2.DateTimeView' ],
  properties: [
    [ 'view', { class: 'foam.u2.DateTimeView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Float',
  requires: [ 'foam.u2.FloatView' ],
  properties: [
    [ 'view', { class: 'foam.u2.FloatView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Int',
  requires: [ 'foam.u2.IntView' ],
  properties: [
    [ 'view', { class: 'foam.u2.IntView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Currency',
  requires: [ 'foam.u2.CurrencyView' ],
  properties: [
    [ 'view', { class: 'foam.u2.CurrencyView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Boolean',
  requires: [ 'foam.u2.CheckBox' ],
  properties: [
    [ 'view', { class: 'foam.u2.CheckBox' } ],
  ]
});


foam.CLASS({
  refines: 'foam.core.Color',
  properties: [
    {
      name: 'view',
      value: {
        class: 'foam.u2.view.DualView',
        viewa: 'foam.u2.TextField',
        viewb: { class: 'foam.u2.view.ColorPicker', onKey: true }
      }
    }
  ]
});

foam.CLASS({
  refines: 'foam.core.FObjectProperty',
  properties: [
    {
      name: 'view',
      value: { class: 'foam.u2.DetailView' },
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.Class',
  properties: [
    [ 'view', { class: 'foam.u2.ClassView' } ]
  ]
});


foam.CLASS({
  refines: 'foam.core.Reference',
  properties: [
    {
      name: 'view',
      value: {
        class: 'foam.u2.view.ReferenceView'
      }
    }
  ]
})


foam.CLASS({
  refines: 'foam.core.Enum',
  properties: [
    [ 'view',          { class: 'foam.u2.EnumView' } ],
    [ 'tableCellView', function(obj) { return this.get(obj).label; } ]
  ]
})


foam.CLASS({
  package: 'foam.u2',
  name: 'ControllerViewTrait',

  documentation: 'Trait for adding a ControllerMode controllerMode Property.',

  exports: [ 'controllerMode' ],

  properties: [
    {
      class: 'Enum',
      of: 'foam.u2.ControllerMode',
      name: 'controllerMode'
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'View',
  extends: 'foam.u2.Element',

  documentation: 'A View is an Element used to display data.',

  exports: [ 'data' ],

  properties: [
    {
      class: 'Enum',
      of: 'foam.u2.ControllerMode',
      name: 'controllerMode',
      factory: function() { return this.__context__.controllerMode || foam.u2.ControllerMode.CREATE; }
    },
    {
      name: 'data',
      attribute: true
    },
    {
      class: 'Enum',
      of: 'foam.u2.Visibility',
      name: 'visibility',
      postSet: function() { this.updateMode_(this.mode); },
      attribute: true,
      value: foam.u2.Visibility.RW
    },
    {
      class: 'Enum',
      of: 'foam.u2.DisplayMode',
      name: 'mode',
      attribute: true,
      postSet: function(_, mode) { this.updateMode_(mode); },
      expression: function(visibility, controllerMode) {
        if ( visibility === foam.u2.Visibility.RO ) {
          return foam.u2.DisplayMode.RO;
        }

        if ( visibility === foam.u2.Visibility.FINAL &&
             controllerMode !== foam.u2.ControllerMode.CREATE ) {
          return foam.u2.DisplayMode.RO;
        }

        return controllerMode === foam.u2.ControllerMode.VIEW ?
          foam.u2.DisplayMode.RO :
          foam.u2.DisplayMode.RW ;
      },
      attribute: true
    }/*,
    {
      type: 'Boolean',
      name: 'showValidation',
      documentation: 'Set to false if you want to ignore any ' +
          '$$DOC{ref:"Property.validate"} calls. On by default.',
      defaultValue: true
    },
    {
      type: 'String',
      name: 'validationError_',
      documentation: 'The actual error message. Null or the empty string ' +
          'when there is no error.',
    }
    */
  ],

  methods: [
    function initE() {
      this.SUPER();
      this.updateMode_(this.mode);
    },

    function updateMode_() {
      // Template method, to be implemented in sub-models
    },

    function fromProperty(p) {
      this.visibility = p.visibility;
    }
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'Controller',
  extends: 'foam.u2.Element',

  documentation: 'A Controller is an Element which exports itself as "data".',

  exports: [ 'as data' ]
});


foam.CLASS({
  refines: 'foam.core.Action',

  requires: [
    'foam.u2.ActionView'
  ],

  methods: [
    function toE(args, X) {
      var view = foam.u2.ViewSpec.createView(
        { class: 'foam.u2.ActionView', action: this }, args, this, X);

      if ( X.data$ && ! ( args && ( args.data || args.data$ ) ) ) {
        view.data$ = X.data$;
      }

      return view;
    }
  ]
});

// TODO: make a tableProperties property on AbstractClass

foam.CLASS({
  package: 'foam.u2',
  name: 'TableColumns',

  documentation: 'Axiom for storing Table Columns information in Class. Unlike most Axioms, doesn\'t modify the Class, but is just used to store information.',

  properties: [
    [ 'name', 'tableColumns' ],
    'columns'
  ]
});


foam.CLASS({
  package: 'foam.u2',
  name: 'SearchColumns',

  documentation: 'Axiom for storing Table Search Columns information in Class. Unlike most Axioms, doesn\'t modify the Class, but is just used to store information.',

  properties: [
    [ 'name', 'searchColumns' ],
    'columns'
  ]
});


foam.CLASS({
  refines: 'foam.core.Model',
  properties: [
    {
      // TODO: remove when all code ported
      name: 'tableProperties',
      setter: function(_, ps) {
        console.warn("Deprecated use of tableProperties. Use 'tableColumns' instead.");
        this.tableColumns = ps;
      }
    },
    {
      name: 'tableColumns',
      postSet: function(_, cs) {
        this.axioms_.push(foam.u2.TableColumns.create({columns: cs}));
      }
    },
    {
      name: 'searchColumns',
      postSet: function(_, cs) {
        this.axioms_.push(foam.u2.SearchColumns.create({columns: cs}));
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.u2',
  name: 'RowFormatter',

  documentation: 'Base class for markup-generating row formatters.',

  methods: [
    function format(data) {}
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.version',
  name: 'VersionTrait',

  properties: [
    {
      class: 'Int',
      name: 'version_',
      value: -1
    },
    {
      class: 'Boolean',
      name: 'deleted_'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.version',
  name: 'VersionedClass',

  axioms: [
    foam.pattern.Multiton.create({ property: 'of' })
  ],

  requires: [
    'foam.core.Model',
  ],

  properties: [
    {
      class: 'Class',
      name: 'of',
      required: true
    },
    {
      class: 'String',
      name: 'package',
      factory: function() { return this.of.package; }
    },
    {
      class: 'String',
      name: 'name',
      factory: function() { return `Versioned${this.of.name}`; }
    },
    {
      class: 'String',
      name: 'id',
      factory: function() { return `${this.package}.${this.name}`; }
    },
    {
      class: 'FObjectProperty',
      of: 'Model',
      name: 'versionedModel',
      factory: function() {
        return this.Model.create({
          package: this.package,
          name: this.name,
          extends: this.of.id,
          implements: [ 'foam.version.VersionTrait' ]
        });
      }
    },
    {
      name: 'versionedCls',
      factory: function() {
        return this.buildClass_();
      }
    }
  ],

  methods: [
    function init() {
      this.validate();
      this.SUPER();
    },

    function buildClass_() {
      this.versionedModel.validate();
      var cls = this.versionedModel.buildClass();
      cls.validate();
      this.__subContext__.register(cls);
      foam.package.registerClass(cls);

      return this.versionedModel.buildClass();
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.version',
  name: 'VersionedClassFactory',

  requires: [
    'foam.version.VersionTrait',
    'foam.version.VersionedClass'
  ],

  methods: [
    function get(cls) {
      return this.VersionTrait.isSubClass(cls) ? cls :
          this.VersionedClass.create({ of: cls }).versionedCls;
    }
  ]
});

foam.CLASS({
  package: 'foam.version',
  name: 'VersionedClassFactorySingleton',
  extends: 'foam.version.VersionedClassFactory',

  axioms: [ foam.pattern.Singleton.create() ],
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.dao',
  name: 'Sink',

  documentation: 'Interface for receiving information updates. Primarily used as the target for DAO.select() calls.',

  methods: [
    {
      name: 'put',
      returns: '',
      args: [
        'obj',
        'sub'
      ],
      code: function() {}
    },
    {
      name: 'remove',
      returns: '',
      args: [
        'obj',
        'sub'
      ],
      code: function() {}
    },
    {
      name: 'eof',
      returns: '',
      args: [],
      code: function() {}
    },
    {
      name: 'reset',
      returns: '',
      args: [ 'sub' ],
      code: function() {}
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'ProxySink',
  implements: [ 'foam.dao.Sink' ],

  documentation: 'Proxy for Sink interface.',

  properties: [
    {
      class: 'Proxy',
      of: 'foam.dao.Sink',
      name: 'delegate',
      factory: function() { return foam.dao.ArraySink.create(); }
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'AbstractSink',
  implements: [ 'foam.dao.Sink' ],

  documentation: 'Abstract base class for implementing Sink interface.',

  methods: [
    {
      name: 'put',
      code: function() {}
    },
    {
      name: 'remove',
      code: function() {}
    },
    {
      name: 'eof',
      code: function() {}
    },
    {
      name: 'reset',
      code: function() {}
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'PipeSink',
  extends: 'foam.dao.ProxySink',
  properties: [
    'dao'
  ],
  methods: [
    function reset(sub) {
      this.SUPER(sub);
      this.dao.select(this.delegate);
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'ResetListener',
  extends: 'foam.dao.ProxySink',
  documentation: 'Turns all sink events into a reset event.',
  methods: [
    function put(_, sub) {
      this.reset(sub);
    },
    function remove(_, sub) {
      this.reset(sub);
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'DAOSlot',
  implements: ['foam.core.Slot'],
  extends: 'foam.dao.ResetListener',
  properties: [
    {
      name: 'dao',
      postSet: function() {
        this.start_();
      }
    },
    {
      name: 'sink',
      postSet: function(_, s) {
        this.value = s;
        this.start_();
      }
    },
    {
      name: 'value'
    },
    {
      name: 'subscription',
      postSet: function(old, nu) {
        old && old.detach();
        this.onDetach(nu);
      }
    },
    {
      class: 'Int',
      name: 'batch',
      value: 0
    }
  ],
  methods: [
    function sub(l) {
      return arguments.length === 1 ?
        this.SUPER('propertyChange', 'value', l) :
        this.SUPER.apply(this, arguments);
    },

    function get() { return this.value; },

    function set() {},

    function start_() {
      // Don't start till both sink and dao are set.
      if ( ! this.dao || ! this.sink ) return;

      this.subscription = this.dao.listen(this);
      this.update();
    },

    function reset() {
      this.update();
    }
  ],
  listeners: [
    {
      name: 'update',
      isMerged: 100,
      code: function() {
        var batch = ++this.batch;
        var self = this;
        this.dao.select(this.sink.clone()).then(function(s) {
          if ( self.batch !== batch ) return;

          self.value = s;
        });
      }
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'QuickSink',

  extends: 'foam.dao.AbstractSink',

  properties: [
    {
      class: 'Function',
      name: 'putFn'
    },
    {
      class: 'Function',
      name: 'removeFn'
    },
    {
      class: 'Function',
      name: 'eofFn'
    },
    {
      class: 'Function',
      name: 'resetFn'
    }
  ],

  methods: [
    function put() {
      return this.putFn && this.putFn.apply(this, arguments);
    },

    function remove() {
      return this.removeFn && this.removeFn.apply(this, arguments);
    },

    function eof() {
      return this.eofFn && this.eofFn.apply(this, arguments);
    },

    function reset() {
      return this.resetFn && this.resetFn.apply(this, arguments);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'AnonymousSink',
  implements: [ 'foam.dao.Sink' ],

  properties: [ 'sink' ],

  methods: [
    function put(obj, sub) {
      var s = this.sink;
      s && s.put && s.put(obj, sub);
    },
    function remove(obj, sub) {
      var s = this.sink;
      s && s.remove && s.remove(obj, sub);
    },

    function eof() {
      var s = this.sink;
      s && s.eof && s.eof();
    },
    function reset(sub) {
      var s = this.sink;
      s && s.reset && s.reset(sub);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'PredicatedSink',
  extends: 'foam.dao.ProxySink',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.mlang.predicate.Predicate',
      name: 'predicate'
    }
  ],

  methods: [
    {
      name: 'put',
      code: function put(obj, sub) {
        if ( this.predicate.f(obj) ) this.delegate.put(obj, sub);
      }
    },
    {
      name: 'remove',
      code: function remove(obj, sub) {
        if ( this.predicate.f(obj) ) this.delegate.remove(obj, sub);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'LimitedSink',
  extends: 'foam.dao.ProxySink',

  properties: [
    {
      class: 'Long',
      name: 'limit'
    },
    {
      name: 'count',
      class: 'Int',
      value: 0
    }
  ],

  methods: [
    {
      name: 'put',
      code: function put(obj, sub) {
        if ( this.count++ >= this.limit ) {
          sub && sub.detach();
        } else {
          this.delegate.put(obj, sub);
        }
      }
    },
    {
      name: 'remove',
      code: function remove(obj, sub) {
        if ( this.count++ >= this.limit ) {
          sub && sub.detach();
        } else {
          this.delegate.remove(obj, sub);
        }
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'SkipSink',
  extends: 'foam.dao.ProxySink',

  properties: [
    {
      class: 'Long',
      name: 'skip'
    },
    {
      name: 'count',
      class: 'Int',
      value: 0
    }
  ],

  methods: [
    {
      name: 'put',
      code: function put(obj, sub) {
        if ( this.count < this.skip ) {
          this.count++;
          return;
        }

        this.delegate.put(obj, sub);
      }
    },
    {
      name: 'remove',
      code: function remove(obj, sub) {
        this.reset(sub);
      }
    },
    {
      name: 'reset',
      code: function(sub) {
        this.count = 0;
        this.delegate.reset(sub);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'OrderedSink',
  extends: 'foam.dao.ProxySink',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.mlang.order.Comparator',
      name: 'comparator'
    },
    {
      class: 'List',
      name: 'array',
      factory: function() { return []; }
    }
  ],

  methods: [
    {
      name: 'put',
      code: function put(obj, sub) {
        this.array.push(obj);
      }
    },
    {
      name: 'eof',
      code: function eof() {
        var comparator = this.comparator;
        this.array.sort(function(o1, o2) {
          return comparator.compare(o1, o2);
        });

        var sub = foam.core.FObject.create();
        var detached = false;
        sub.onDetach(function() { detached = true; });
        for ( var i = 0 ; i < this.array.length ; i++ ) {
          this.delegate.put(this.array[i], sub);
          if ( detached ) break;
        }
      }
    },

    function remove(obj, sub) {
      // TODO
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'DedupSink',
  extends: 'foam.dao.ProxySink',

  properties: [
    {
      /** @private */
      name: 'results_',
      hidden: true,
      factory: function() { return {}; }
    }
  ],

  methods: [
    {
      /** If the object to be put() has already been seen by this sink,
        ignore it */
      name: 'put',
      code: function put(obj, sub) {
        if ( ! this.results_[obj.id] ) {
          this.results_[obj.id] = true;
          return this.delegate.put(obj, sub);
        }
      }
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'DescribeSink',
  documentation: 'Calls .describe() on every object.  Useful for debugging to quickly see what items are in a DAO.',
  implements: [ 'foam.dao.Sink' ],
  methods: [
    function put(o) {
      o.describe();
    },
    function remove() {},
    function eof() {},
    function reset() {}
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'FnSink',
  documentation: 'Converts all sink events to call to a singular function.' +
    '  Useful for subscribing a listener method to a DAO',
  properties: [
    'fn'
  ],
  methods: [
    function put(obj, s) {
      this.fn('put', obj, s);
    },
    function remove(obj, s) {
      this.fn('remove', obj, s);
    },
    function eof() {
      this.fn('eof');
    },
    function reset(s) {
      this.fn('reset', s);
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'FramedSink',
  extends: 'foam.dao.ProxySink',
  documentation: 'A proxy that waits until the next frame to flush the calls to the delegate.',
  properties: [
    { class: 'Array', name: 'calls' },
  ],
  methods: [
    {
      name: 'put',
      code: function(obj, s) {
        this.calls.push(['put', [obj, s]]);
        this.flushCalls();
      }
    },
    {
      name: 'remove',
      code: function(obj, s) {
        this.calls.push(['remove', [obj, s]]);
        this.flushCalls();
      }
    },
    {
      name: 'eof',
      code: function() {
        this.calls.push(['eof', []]);
        this.flushCalls();
      }
    },
    {
      name: 'reset',
      code: function(s) {
        this.calls = [['reset', [s]]];
        this.flushCalls();
      }
    }
  ],
  listeners: [
    {
      name: 'flushCalls',
      isMerged: 100,
      code: function() {
        var calls = this.calls;
        this.calls = [];
        for (var i = 0, o; o = calls[i]; i++) {
          this.delegate[o[0]].apply(this.delegate, o[1]);
        }
      }
    },
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'DAOSink',
  implements: ['foam.dao.Sink'],
  properties: [
    { class: 'foam.dao.DAOProperty', name: 'dao' },
  ],
  methods: [
    {
      name: 'put',
      code: function(o) {
        this.dao.put(o);
      }
    },
    {
      name: 'remove',
      code: function(o) {
        this.dao.remove(o);
      }
    },
    {
      name: 'eof',
      code: function() {},
    },
    {
      name: 'reset',
      code: function() {
        this.dao.removeAll();
      }
    }
  ],
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.dao',
  name: 'DAO',

  documentation: 'DAO Interface',

  methods: [
    {
      name: 'put',
      returns: 'Promise',
      args: [ 'obj' ]
    },
    {
      name: 'put_',
      returns: 'Promise',
      args: [ 'x', 'obj' ]
    },
    {
      name: 'remove',
      returns: 'Promise',
      args: [ 'obj' ]
    },
    {
      name: 'remove_',
      returns: 'Promise',
      args: [ 'x', 'obj' ]
    },
    {
      name: 'find',
      returns: 'Promise',
      args: [ 'id' ]
    },
    {
      name: 'find_',
      returns: 'Promise',
      args: [ 'x', 'id' ]
    },
    {
      name: 'select',
      returns: 'Promise',
      args: [ 'sink' ]
    },
    {
      name: 'select_',
      returns: 'Promise',
      args: [ 'x', 'sink', 'skip', 'limit', 'order', 'predicate' ]
    },
    {
      name: 'removeAll',
      returns: '',
      args: [ ]
    },
    {
      name: 'removeAll_',
      returns: '',
      args: [ 'x', 'skip', 'limit', 'order', 'predicate' ]
    },
    {
      name: 'listen',
      returns: '',
      args: [ 'sink', 'predicate' ]
    },
    {
      name: 'listen_',
      returns: '',
      args: [ 'x', 'sink', 'predicate' ]
    },
    {
      name: 'pipe', // TODO: return a promise? don't put pipe and listen here?
      returns: '',
      args: [ 'sink' ]
    },
    {
      name: 'pipe_', // TODO: return a promise? don't put pipe and listen here?
      returns: '',
      args: [ 'x', 'sink', 'predicate' ]
    },
    {
      name: 'where',
      returns: 'foam.dao.DAO',
      args: [ 'predicate' ]
    },
    {
      name: 'orderBy',
      returns: 'foam.dao.DAO',
      args: [ 'comparator' ]
    },
    {
      name: 'skip',
      returns: 'foam.dao.DAO',
      args: [ 'count' ]
    },
    {
      name: 'limit',
      returns: 'foam.dao.DAO',
      args: [ 'count' ]
    },
    {
      name: 'inX',
      returns: 'foam.dao.DAO',
      args: [ 'x' ]
    },
    {
      name: 'cmd',
      returns: 'obj',
      args: [ 'obj' ]
    },
    {
      name: 'cmd_',
      returns: 'obj',
      args: [ 'x', 'obj' ]
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ProxyDAO',
  extends: 'foam.dao.AbstractDAO',

  requires: [
    'foam.dao.ProxyListener'
  ],

  documentation: 'Proxy implementation for the DAO interface.',

  properties: [
    {
      class: 'Proxy',
      of: 'foam.dao.DAO',
      name: 'delegate',
      forwards: [ 'put_', 'remove_', 'find_', 'select_', 'removeAll_', 'cmd_' ],
      topics: [ 'on' ], // TODO: Remove this when all users of it are updated.
      factory: function() { return foam.dao.NullDAO.create() },
      postSet: function(old, nu) {
        if ( old ) this.on.reset.pub();
      }
    },
    {
      name: 'of',
      factory: function() {
        return this.delegate.of;
      }
    }
  ],

  methods: [
    {
      name: 'getOf',
      javaReturns: 'foam.core.ClassInfo',
      javaCode: 'if ( of_ == null && getDelegate() != null ) return getDelegate().getOf(); return of_;'
    },

    function listen_(x, sink, predicate) {
      var listener = this.ProxyListener.create({
        delegate: sink,
        args: [ predicate ]
      });

      listener.onDetach(listener.dao$.follow(this.delegate$));

      return listener;
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'ProxyListener',

  implements: ['foam.dao.Sink'],

  properties: [
    'args',
    'delegate',
    {
      name: 'innerSub',
      postSet: function(_, s) {
        if (s) this.onDetach(s);
      }
    },
    {
      name: 'dao',
      postSet: function(old, nu) {
        this.innerSub && this.innerSub.detach();
        this.innerSub = nu && nu.listen.apply(nu, [this].concat(this.args));
        if ( old ) this.reset();
      }
    }
  ],

  methods: [
    function put(obj, s) {
      this.delegate.put(obj, this);
    },

    function remove(obj, s) {
      this.delegate.remove(obj, this);
    },

    function reset(s) {
      this.delegate.reset(this);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'ArraySink',
  extends: 'foam.dao.AbstractSink',

  constants: {
    // Dual to outputJSON method.
    //
    // TODO(markdittmer): Turn into static method: "parseJSON" once
    // https://github.com/foam-framework/foam2/issues/613 is fixed.
    PARSE_JSON: function(json, opt_cls, opt_ctx) {
      var cls = json.of || opt_cls;
      var array = json.array;
      if ( ! array ) return foam.dao.ArraySink.create({ of: cls }, opt_ctx);
      if ( foam.typeOf(cls) === foam.String )
        cls = ( opt_ctx || foam ).lookup(cls);

      return foam.dao.ArraySink.create({
        of: cls,
        array: foam.json.parse(array, cls, opt_ctx)
      }, opt_ctx);
    }
  },

  properties: [
    {
      class: 'List',
      name: 'array',
      adapt: function(old, nu) {
        if ( ! this.of ) return nu;
        var cls = this.of;
        for ( var i = 0; i < nu.length; i++ ) {
          if ( ! cls.isInstance(nu[i]) )
            nu[i] = cls.create(nu[i], this.__subContext__);
        }
        return nu;
      },
      factory: function() { return []; },
      javaFactory: `return new java.util.ArrayList();`
    },
    {
      class: 'Class',
      name: 'of',
      value: null
    },
    {
      name: 'a',
      transient: true,
      getter: function() {
        this.warn('Use of deprecated ArraySink.a');
        return this.array;
      }
    }
  ],

  methods: [
    {
      name: 'put',
      code: function put(o, sub) {
        var cls = this.of;
        if ( ! cls ) {
          this.array.push(o);
          return;
        }
        if ( cls.isInstance(o) )
          this.array.push(o);
        else
          this.array.push(cls.create(o, this.__subContext__));
      },
      javaCode: `getArray().add(obj);`
    },
    function outputJSON(outputter) {
      outputter.start('{');
      var outputClassName = outputter.outputClassNames;
      if ( outputClassName ) {
        outputter.nl().indent().out(
            outputter.maybeEscapeKey('class'), ':', outputter.postColonStr, '"',
            this.cls_.id, '"');
      }

      var array = this.array;
      var outputComma = outputClassName;
      if ( this.of ) {
        outputter.outputProperty(this, this.OF, outputComma);
        outputComma = true;
      }
      if ( array.length > 0 ) {
        if ( outputComma ) outputter.out(',');
        outputter.nl().indent().outputPropertyName(this.ARRAY).
            out(':', outputter.postColonStr).output(array, this.of);
      }
      outputter.nl().end('}');
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'PromisedDAO',
  extends: 'foam.dao.AbstractDAO',

  properties: [
    {
      class: 'Promised',
      of: 'foam.dao.DAO',
      methods: [ 'put_', 'remove_', 'find_', 'select_', 'removeAll_', 'listen_', 'cmd_' ],
      name: 'promise'
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'LocalStorageDAO',
  extends: 'foam.dao.ArrayDAO',

  properties: [
    {
      name:  'name',
      label: 'Store Name',
      class:  'foam.core.String'
    }
  ],

  methods: [
    function init() {
      var objs = localStorage.getItem(this.name);
      if ( objs ) this.array = foam.json.parseString(objs, this);

      this.on.put.sub(this.updated);
      this.on.remove.sub(this.updated);

      // TODO: base on an indexed DAO
    }
  ],

  listeners: [
    {
      name: 'updated',
      isMerged: true,
      mergeDelay: 100,
      code: function() {
        localStorage.setItem(this.name, foam.json.stringify(this.array));
      }
    }
  ]
});


foam.LIB({
  name: 'foam.String',
  methods: [
    {
      name: 'daoize',
      code: foam.Function.memoize1(function(str) {
        // Turns SomeClassName into someClassNameDAO,
        // of package.ClassName into package.ClassNameDAO
        return str.substring(0, 1).toLowerCase() + str.substring(1) + 'DAO';
      })
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'InvalidArgumentException',
  extends: 'foam.dao.ExternalException',

  properties: [
    {
      class: 'String',
      name: 'message'
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.dao',
  name: 'DAODecorator',

  methods: [
    {
      name: 'write',
      returns: 'Promise',
      javaReturns: 'foam.core.FObject',
      args: [
        {
          name: 'context'
        },
        {
          name: 'dao'
        },
        {
          name: 'obj',
          javaType: 'foam.core.FObject'
        },
        {
          name: 'existing',
          javaType: 'foam.core.FObject'
        }
      ]
    },
    {
      name: 'read',
      returns: 'Promise',
      javaReturns: 'foam.core.FObject',
      args: [
        {
          name: 'context'
        },
        {
          name: 'dao'
        },
        {
          name: 'obj',
          javaType: 'foam.core.FObject'
        }
      ]
    },
    {
      name: 'remove',
      returns: 'Promise',
      javaReturns: 'foam.core.FObject',
      args: [
        {
          name: 'context'
        },
        {
          name: 'dao'
        },
        {
          name: 'obj',
          javaType: 'foam.core.FObject'
        }
      ]
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'AbstractDAODecorator',
  implements: ['foam.dao.DAODecorator'],

  methods: [
    function write(X, dao, obj, existing) {
      return Promise.resolve(obj);
    },
    function read(X, dao, obj) {
      return Promise.resolve(obj);
    },
    function remove(X, dao, obj) {
      return Promise.resolve(obj);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'CompoundDAODecorator',

  implements: ['foam.dao.DAODecorator'],

  properties: [
    {
      class: 'Array',
      name: 'decorators'
    }
  ],

  methods: [
    function write(X, dao, obj, existing) {
      var i = 0;
      var d = this.decorators;

      return Promise.resolve(obj).then(function a(obj) {
        return d[i] ? d[i++].write(X, dao, obj, existing).then(a) : obj;
      });
    },

    function read(X, dao, obj) {
      var i = 0;
      var d = this.decorators;

      return Promise.resolve(obj).then(function a(obj) {
        return d[i] ? d[i++].read(X, dao, obj).then(a) : obj;
      });
    },

    function remove(X, dao, obj) {
      var i = 0;
      var d = this.decorators;

      return Promise.resolve(obj).then(function a(obj) {
        return d[i] ? d[i++].remove(X, dao, obj).then(a) : obj;
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'DecoratedDAO',
  extends: 'foam.dao.ProxyDAO',

  requires: [
    'foam.mlang.sink.Count',
    'foam.mlang.sink.GroupBy'
  ],

  properties: [
    {
//      class: 'FObjectProperty',
//      of: 'foam.dao.DAODecorator',
      name: 'decorator'
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'dao',
      factory: function() { return this.delegate; }
    }
  ],

  methods: [
    {
      name: 'put_',
      code: function(x, obj) {
        // TODO: obj.id can generate garbase, would be
        // slightly faster if DAO.find() could take an object
        // as well.
        var self = this;
        return ( ( ! obj.id ) ? Promise.resolve(null) : this.dao.find_(x, obj.id) ).then(function(existing) {
          return self.decorator.write(x, self.dao, obj, existing);
        }).then(function(obj) {
          return self.delegate.put_(x, obj);
        });
      }
    },

    {
      name: 'remove_',
      code: function(x, obj) {
        var self = this;
        return this.decorator.remove(x, self.dao, self.obj).then(function(obj) {
          if ( obj ) return self.delegate.remove_(x, obj);
          return Promise.resolve();
        });
      }
    },

    {
      name: 'find_',
      code: function(x, id) {
        var self = this;
        return this.delegate.find_(x, id).then(function(obj) {
          return self.decorator.read(x, self.dao, obj);
        });
      }
    },

    /*
    TODO: works, but is expensive, so shouldn't be used if decorator.read isn't set
    function select_(x, sink, skip, limit, order, predicate) {
      if ( ! sink ) sink = foam.dao.ArraySink.create();
      // No need to decorate if we're just counting.
      if ( this.Count.isInstance(sink) ) {
        return this.delegate.select_(x, sink, skip, limit, order, predicate);
      }

      // TODO: This is too simplistic, fix
      if ( this.GroupBy.isInstance(sink) ) {
        return this.delegate.select_(x, sink, skip, limit, order, predicate);
      }

      var self = this;

      return new Promise(function(resolve, reject) {
        var ps = [];

        self.delegate.select({
          put: function(o) {
            var p = self.decorator.read(x, self.dao, o);
            p.then(function(o) { sink.put(o); })
            ps.push(p);
          },
          eof: function() {
          }
        }, skip, limit, order, predicate).then(function() {
          Promise.all(ps).then(function() {
            resolve(sink);
          });
        })
      });
    }
    */

    // TODO: Select/removeAll support.  How do we do select
    // without breaking MDAO optimizations?
    // {
    //   name: 'select',
    //   code: function() {
    //   }
    // },
    // {
    //   name: 'removeAll',
    //   code: function() {
    //   }
    // }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'AbstractDAO',
  implements: [ 'foam.dao.DAO' ],

  documentation: 'Abstract base class for implementing DAOs.',

  requires: [
    'foam.dao.ExternalException',
    'foam.dao.FilteredDAO',
    'foam.dao.InternalException',
    'foam.dao.LimitedDAO',
    'foam.dao.LimitedListener',
    'foam.dao.LimitedSink',
    'foam.dao.ObjectNotFoundException',
    'foam.dao.OrderedDAO',
    'foam.dao.OrderedListener',
    'foam.dao.OrderedSink',
    'foam.dao.PipeSink',
    'foam.dao.PredicatedListener',
    'foam.dao.PredicatedSink',
    'foam.dao.ProxyDAO',
    'foam.dao.ResetListener',
    'foam.dao.SkipDAO',
    'foam.dao.SkipListener',
    'foam.dao.SkipSink'
  ],

  topics: [
    {
      name: 'on',
      topics: [
        'put',
        'remove',
        'reset'
      ]
    }
  ],

  properties: [
    {
      /**
        Set to the name or class instance of the type of object the DAO
        will store.
      */
      class: 'Class',
      javaType: 'foam.core.ClassInfo',
      name: 'of'
    }
  ],

  methods: [
    {
      /**
        Returns a filtered DAO that only returns objects which match the
        given predicate.
      */
      name: 'inX',
      code: function(x) {
        return this.ProxyDAO.create({delegate: this}, x);
      }
    },

    {
      /**
        Returns a filtered DAO that only returns objects which match the
        given predicate.
      */
      name: 'where',
      code: function where(p) {
        return this.FilteredDAO.create({
          delegate: this,
          predicate: p
        });
      }
    },

    {
      /**
        Returns a filtered DAO that orders select() by the given
        ordering.
      */
      name: 'orderBy',
      code: function orderBy() {
        return this.OrderedDAO.create({
          delegate: this,
          comparator: foam.compare.toCompare(Array.from(arguments))
        });
      }
    },

    {
      /**
        Returns a filtered DAO that skips the given number of items
        on a select()
      */
      name: 'skip',
      code: function skip(/* Number */ s) {
        return this.SkipDAO.create({
          delegate: this,
          skip_: s
        });
      }
    },

    {
      /**
        Returns a filtered DAO that stops producing items after the
        given count on a select().
      */
      name: 'limit',
      code: function limit(/* Number */ l) {
        return this.LimitedDAO.create({
          delegate: this,
          limit_: l
        });
      }
    },

    function put(obj) {
      return this.put_(this.__context__, obj);
    },

    /**
      Selects the contents of this DAO into a sink, then listens to keep
      the sink up to date. Returns a promise that resolves with the subscription.
      TODO: This will probably miss events that happen during the select but before the
      listen call.  We should check if this is the case and fix it if so.
    */
    function pipe(sink) {//, skip, limit, order, predicate) {
      this.pipe_(this.__context__, sink, undefined);
    },

    function pipe_(x, sink, predicate) {
      var dao = this;

      var sink = this.PipeSink.create({
        delegate: sink,
        dao: this
      });

      var sub = this.listen(sink); //, skip, limit, order, predicate);
      sink.reset();

      return sub;
    },

    function listen(sink) {
      if ( ! foam.core.FObject.isInstance(sink) ) {
        sink = foam.dao.AnonymousSink.create({ sink: sink });
      }

      return this.listen_(this.__context__, sink, undefined);
    },

    /**
      Keeps the given sink up to date with changes to this DAO.
    */
    function listen_(x, sink, predicate) {
      var mySink = this.decorateListener_(sink, predicate);

      var sub = foam.core.FObject.create();

      sub.onDetach(this.on.sub(function(s, on, e, obj) {
        switch(e) {
          case 'put':
            mySink.put(obj, sub);
            break;
          case 'remove':
            mySink.remove(obj, sub);
            break;
          case 'reset':
            mySink.reset(sub);
            break;
        }
      }));

      return sub;
    },

    function decorateListener_(sink, predicate) {
      if ( predicate ) {
        return this.ResetListener.create({ delegate: sink });
      }

      return sink;
    },

    /**
      Used by DAO implementations to apply filters to a sink, often in a
      select() or removeAll() implementation.
      @private
    */
    function decorateSink_(sink, skip, limit, order, predicate) {
      if ( limit != undefined ) {
        sink = this.LimitedSink.create({
          limit: limit,
          delegate: sink
        });
      }

      if ( skip != undefined ) {
        sink = this.SkipSink.create({
          skip: skip,
          delegate: sink
        });
      }

      if ( order != undefined ) {
        sink = this.OrderedSink.create({
          comparator: order,
          delegate: sink
        });
      }

      if ( predicate != undefined ) {
        sink = this.PredicatedSink.create({
          predicate: predicate.partialEval ?
            predicate.partialEval() :
            predicate,
          delegate: sink
        });
      }

      return sink;
    },

    function remove(obj) {
      return this.remove_(this.__context__, obj);
    },

    function removeAll() {
      return this.removeAll_(this.__context__, undefined, undefined, undefined, undefined);
    },

    function compareTo(other) {
      if ( ! other ) return 1;
      return this === other ? 0 : foam.util.compare(this.$UID, other.$UID);
    },

    function select(sink) {
      return this.select_(this.__context__, sink, undefined, undefined, undefined, undefined);
    },

    function find(id) {
      return this.find_(this.__context__, id);
    },

    function cmd_(x, obj) {
      return undefined;
    },

    function cmd(obj) {
      return this.cmd_(this.__context__, obj);
    },

    // Placeholder functions to that selecting from DAO to DAO works.
    /** @private */
    function eof() {},

    /** @private */
    function reset() {}
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Exception',
  properties: [
    'message'
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'InternalException',
  extends: 'Exception'
});


foam.CLASS({
  package: 'foam.dao',
  name: 'ExternalException',
  extends: 'Exception'
})


foam.CLASS({
  package: 'foam.dao',
  name: 'FilteredDAO',
  extends: 'foam.dao.AbstractDAO',

  requires: [
    'foam.mlang.predicate.And'
  ],

  properties: [
    {
      name: 'predicate',
      required: true
    },
    {
      name: 'of',
      factory: function() {
        return this.delegate.of;
      }
    },
    {
      class: 'Proxy',
      of: 'foam.dao.DAO',
      name: 'delegate',
      topics: [ 'on' ], // TODO: Remove this when all users of it are updated.
      forwards: [ 'put_', 'remove_', 'find_', 'select_', 'removeAll_', 'cmd_' ]
    }
  ],

  methods: [
    function find_(x, key) {
      var predicate = this.predicate;
      return this.delegate.find_(x, key).then(function(o) {
        return predicate.f(o) ? o : null;
      });
    },

    function select_(x, sink, skip, limit, order, predicate) {
      return this.delegate.select_(
        x, sink, skip, limit, order,
        predicate ?
          this.And.create({ args: [this.predicate, predicate] }) :
          this.predicate);
    },

    function removeAll_(x, skip, limit, order, predicate) {
      return this.delegate.removeAll_(
        x, skip, limit, order,
        predicate ?
          this.And.create({ args: [this.predicate, predicate] }) :
          this.predicate);
    },

    function listen_(x, sink, predicate) {
      return this.delegate.listen_(
        x, sink,
        predicate ?
          this.And.create({ args: [this.predicate, predicate] }) :
          this.predicate);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'OrderedDAO',
  extends: 'foam.dao.ProxyDAO',

  properties: [
    {
      name: 'comparator'
    }
  ],

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
      return this.delegate.select_(x, sink, skip, limit, order || this.comparator, predicate);
    },
    function removeAll_(x, skip, limit, order, predicate) {
      return this.delegate.removeAll_(x, skip, limit, order || this.comparator, predicate);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'SkipDAO',
  extends: 'foam.dao.ProxyDAO',

  properties: [
    {
      name: 'skip_'
    }
  ],

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
      return this.delegate.select_(x, sink, this.skip_, limit, order, predicate);
    },
    function removeAll_(x, skip, limit, order, predicate) {
      return this.delegate.removeAll_(x, this.skip_, limit, order, predicate);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao',
  name: 'LimitedDAO',
  extends: 'foam.dao.ProxyDAO',

  properties: [
    {
      name: 'limit_'
    }
  ],

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
      return this.delegate.select_(
        x, sink, skip,
        limit !== undefined ? Math.min(this.limit_, limit) : this.limit_,
        order, predicate);
    },

    function removeAll_(x, skip, limit, order, predicate) {
      return this.delegate.removeAll_(
        x, skip,
        limit !== undefined ? Math.min(this.limit_, limit) : this.limit_,
        order, predicate);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'DAOProperty',
  extends: 'Property',

  documentation: 'Property for storing a reference to a DAO.',

  requires: [ 'foam.dao.ProxyDAO' ],

  properties: [
    {
      name: 'view',
      value: {class: 'foam.comics.InlineBrowserView'},
    }
  ],

  methods: [
    function installInProto(proto) {
      this.SUPER(proto);

      var name = this.name;
      var prop = this;

      Object.defineProperty(proto, name + '$proxy', {
        get: function daoProxyGetter() {
          var proxy = prop.ProxyDAO.create({delegate: this[name]});
          this[name + '$proxy'] = proxy;

          this.sub('propertyChange', name, function(_, __, ___, s) {
            proxy.delegate = s.get();
          });

          return proxy;
        },
        configurable: true
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

 foam.INTERFACE({
   package: 'foam.mlang.order',
   name: 'Comparator',

   documentation: 'Interface for comparing two values: -1: o1 < o2, 0: o1 == o2, 1: o1 > o2.',

   methods: [
     {
       name: 'compare',
       args: [
         'o1',
         'o2'
       ]
     },
     {
       name: 'toIndex',
       args: [
         'tail'
       ]
     },
     {
       // TODO: why is this here?
       /** Returns remaning ordering without this first one, which may be the
         only one. */
       name: 'orderTail'
     },
     {
       // TODO: why is this here?
       /** The property, if any, sorted by this ordering. */
       name: 'orderPrimaryProperty'
     },
     {
       // TODO: why is this here?
       /** Returns 1 or -1 for ascending/descending */
       name: 'orderDirection'
     }
   ]
 });
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// TODO(braden): Port the partialEval() code over here.

foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Count',
  extends: 'foam.dao.AbstractSink',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Sink which counts number of objects put().',

  properties: [
    {
      class: 'Long',
      name: 'value'
    }
  ],

  methods: [
    function put() { this.value++; },
    function remove() { this.value--; },
    function reset() { this.value = 0; },
    function toString() { return 'COUNT()'; }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'NullSink',
  extends: 'foam.dao.AbstractSink',
  implements: ['foam.core.Serializable'],

  documentation: 'Null Pattern (do-nothing) Sink.',

  axioms: [
    foam.pattern.Singleton.create()
  ]
});


foam.INTERFACE({
  package: 'foam.mlang',
  name: 'F',

  documentation: 'F interface: f(obj) -> val.',

  methods: [
    {
      name: 'f',
      args: [
        'obj'
      ]
    }
  ]
});

// Investigate: If we use "extends: 'foam.mlang.F'" it generates the content properly for both F and Expr.
// But we have the Constant that extends the AbstractExpr that implements Expr and in this case, the f method
// (that comes from the F) interface is "losing" its type and returning void instead of returning the same defined
// on the interface as it should.
foam.INTERFACE({
  package: 'foam.mlang',
  name: 'Expr',
  implements: ['foam.mlang.F'],

  documentation: 'Expr interface extends F interface: partialEval -> Expr.',

  methods: [
    {
      name: 'partialEval'
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'ExprProperty',
  extends: 'FObjectProperty',

  documentation: 'Property for Expr values.',

  properties: [
    {
      name: 'adapt',
      value: function(_, o, p) { return p.adaptValue(o); }
    }
  ],

  methods: [
    function adaptValue(o) {
      if ( o === null )                           return foam.mlang.Constant.create({ value: null });
      if ( ! o.f && typeof o === 'function' )     return foam.mlang.predicate.Func.create({ fn: o });
      if ( typeof o !== 'object' )                return foam.mlang.Constant.create({ value: o });
      if ( o instanceof Date )                    return foam.mlang.Constant.create({ value: o });
      if ( Array.isArray(o) )                     return foam.mlang.Constant.create({ value: o });
      if ( foam.core.AbstractEnum.isInstance(o) ) return foam.mlang.Constant.create({ value: o });
      if ( foam.core.FObject.isInstance(o) )      return o;

      console.error('Invalid expression value: ', o);
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'SinkProperty',
  extends: 'FObjectProperty',

  documentation: 'Property for Sink values.'
});


foam.INTERFACE({
  package: 'foam.mlang.predicate',
  name: 'Predicate',

  documentation: 'Predicate interface: f(obj) -> boolean.',

  methods: [
    {
      name: 'f',
      args: [
        'obj'
      ]
    },
    {
      name: 'partialEval'
    },
    {
      name: 'toIndex',
      args: [
        'tail'
      ]
    },
    {
      name: 'toDisjunctiveNormalForm'
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'PredicateProperty',
  extends: 'FObjectProperty',

  documentation: 'Property for Predicate values.',

  properties: [
    ['of', 'foam.mlang.predicate.Predicate'],
    {
      name: 'adapt',
      value: function(_, o) {
        if ( ! o.f && typeof o === "function" ) return foam.mlang.predicate.Func.create({ fn: o });
        return o;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'PredicateArray',
  extends: 'FObjectArray',

  documentation: 'Property for storing arrays of Predicates.',

  properties: [
    {
      name: 'of',
      value: 'foam.mlang.predicate.Predicate'
    },
    {
      name: 'adaptArrayElement',
      // TODO?: Make into a multi-method?
      value: function(o) {
        if ( o === null ) return foam.mlang.Constant.create({ value: o });
        if ( ! o.f && typeof o === "function" ) return foam.mlang.predicate.Func.create({ fn: o });
        if ( typeof o !== "object" ) return foam.mlang.Constant.create({ value: o });
        if ( Array.isArray(o) ) return foam.mlang.Constant.create({ value: o });
        if ( o === true ) return foam.mlang.predicate.True.create();
        if ( o === false ) return foam.mlang.predicate.False.create();
        if ( foam.core.FObject.isInstance(o) ) return o;
        console.error('Invalid expression value: ', o);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'AbstractPredicate',
  abstract: true,
  implements: [ 'foam.mlang.predicate.Predicate' ],

  documentation: 'Abstract Predicate base-class.',

  methods: [
    function toIndex() { },

    function toDisjunctiveNormalForm() { return this; },

    function partialEval() { return this; },

    function reduceAnd(other) {
      return foam.util.equals(this, other) ? this : null;
    },

    function reduceOr(other) {
      return foam.util.equals(this, other) ? this : null;
    },

    function toString() { return this.cls_.name; }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'AbstractExpr',
  abstract: true,
  implements: [ 'foam.mlang.Expr' ],

  documentation: 'Abstract Expr base-class.',

  methods: [
    function partialEval() { return this; }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'True',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Expression which always returns true.',

  axioms: [ foam.pattern.Singleton.create() ],

  methods: [
    function f() { return true; }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'False',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  implements: ['foam.core.Serializable'],

  documentation: 'Expression which always returns false.',

  axioms: [ foam.pattern.Singleton.create() ],

  methods: [
    function f() { return false; }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Unary',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  abstract: true,

  documentation: 'Abstract Unary (single-argument) Predicate base-class.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    }
  ],

  methods: [
    function toIndex(tail) {
      return this.arg1 && this.arg1.toIndex(tail);
    },

    function toString() {
      return foam.String.constantize(this.cls_.name) +
          '(' + this.arg1.toString() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Binary',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  abstract: true,

  documentation: 'Abstract Binary (two-argument) Predicate base-class.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    },
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg2',
      adapt: function(old, nu, prop) {
        var value = prop.adaptValue(nu);
        var arg1 = this.arg1;
        if ( foam.mlang.Constant.isInstance(value) && arg1 && arg1.adapt )
          value.value = this.arg1.adapt.call(null, old, value.value, arg1);

        return value;
      }
    }
  ],

  methods: [
    function toIndex(tail) {
      return this.arg1 && this.arg1.toIndex(tail);
    },

    function toString() {
      return foam.String.constantize(this.cls_.name) + '(' +
          this.arg1.toString() + ', ' +
          this.arg2.toString() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Nary',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  abstract: true,

  documentation: 'Abstract n-ary (many-argument) Predicate base-class.',

  properties: [
    {
      class: 'foam.mlang.predicate.PredicateArray',
      name: 'args'
    }
  ],

  methods: [
    function toString() {
      var s = foam.String.constantize(this.cls_.name) + '(';
      for ( var i = 0 ; i < this.args.length ; i++ ) {
        var a = this.args[i];
        s += a.toString();
        if ( i < this.args.length - 1 ) s += ', ';
      }
      return s + ')';
    },
    function reduce_(args, shortCircuit, methodName) {
      for ( var i = 0; i < args.length - 1; i++ ) {
        for ( var j = i + 1; j < args.length; j++ ) {
          if ( args[i][methodName] ) {
            var newArg = args[i][methodName](args[j]);
            if ( newArg ) {
              if ( newArg === shortCircuit ) return shortCircuit;
              args[i] = newArg;
              args.splice(j, 1);
            }
          }
        }
      }
      return args;
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Or',
  extends: 'foam.mlang.predicate.Nary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Logical Or n-ary Predicate.',

  requires: [
    'foam.mlang.predicate.False',
    'foam.mlang.predicate.True'
  ],

  methods: [
    {
      name: 'f',
      code: function f(o) {
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          if ( this.args[i].f(o) ) return true;
        }
        return false;
      }
    },

    function partialEval() {
      var newArgs = [];
      var updated = false;

      var TRUE  = this.True.create();
      var FALSE = this.False.create();

      for ( var i = 0 ; i < this.args.length ; i++ ) {
        var a    = this.args[i];
        var newA = this.args[i].partialEval();

        if ( newA === TRUE ) return TRUE;

        if ( this.cls_.isInstance(newA) ) {
          // In-line nested OR clauses
          for ( var j = 0 ; j < newA.args.length ; j++ ) {
            newArgs.push(newA.args[j]);
          }
          updated = true;
        }
        else {
          if ( newA !== FALSE ) {
            newArgs.push(newA);
          }
          if ( a !== newA ) updated = true;
        }
      }

      this.reduce_(newArgs, FALSE, 'reduceAnd');

      if ( newArgs.length === 0 ) return FALSE;
      if ( newArgs.length === 1 ) return newArgs[0];

      return updated ? this.cls_.create({ args: newArgs }) : this;
    },

    function toIndex(tail) { },

    function toDisjunctiveNormalForm() {
      // TODO: memoization around this process?
      // DNF our args, note if anything changes
      var oldArgs = this.args;
      var newArgs = [];
      var changed = false;
      for (var i = 0; i < oldArgs.length; i++ ) {
        var a = oldArgs[i].toDisjunctiveNormalForm();
        if ( a !== oldArgs[i] ) changed = true;
        newArgs[i] = a;
      }

      // partialEval will take care of nested ORs
      var self = this;
      if ( changed ) {
        self = this.clone();
        self.args = newArgs;
        self = self.partialEval();
      }

      return self;
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'And',
  extends: 'foam.mlang.predicate.Nary',
  implements: ['foam.core.Serializable'],

  documentation: 'Logical And n-ary Predicate.',

  requires: [
    'foam.mlang.predicate.Or'
  ],

  methods: [
    {
      name: 'f',
      code: function(o) {
        for ( var i = 0 ; i < this.args.length ; i++ ) {
          if ( ! this.args[i].f(o) ) return false;
        }
        return true;
      }
    },

    function partialEval() {
      var newArgs = [];
      var updated = false;

      var FALSE = foam.mlang.predicate.False.create();
      var TRUE = foam.mlang.predicate.True.create();

      for ( var i = 0; i < this.args.length; i++ ) {
        var a    = this.args[i];
        var newA = this.args[i].partialEval();

        if ( newA === FALSE ) return FALSE;

        if ( this.cls_.isInstance(newA) ) {
          // In-line nested AND clauses
          for ( var j = 0 ; j < newA.args.length ; j++ ) {
            newArgs.push(newA.args[j]);
          }
          updated = true;
        }
        else {
          if ( newA === TRUE ) {
            updated = true;
          } else {
            newArgs.push(newA);
            if ( a !== newA ) updated = true;
          }
        }
      }

      this.reduce_(newArgs, TRUE, 'reduceOr');

      if ( newArgs.length === 0 ) return TRUE;
      if ( newArgs.length === 1 ) return newArgs[0];

      return updated ? this.cls_.create({ args: newArgs }) : this;
    },

    function toIndex(tail, depth) {
      /** Builds the ideal index for this predicate. The indexes will be chained
          in order of index uniqueness (put the most indexable first):
          This prevents dropping to scan mode too early, and restricts
          the remaning set more quickly.
           i.e. EQ, IN,... CONTAINS, ... LT, GT...
        @param depth {number} The maximum number of sub-indexes to chain.
      */
      depth = depth || 99;

      if ( depth === 1 ) {
        // generate indexes, find costs, use the fastest
        var bestCost = Number.MAX_VALUE;
        var bestIndex;
        var args = this.args;
        for (var i = 0; i < args.length; i++ ) {
          var arg = args[i];
          var idx = arg.toIndex(tail);
          if ( ! idx ) continue;

          var idxCost = Math.floor(idx.estimate(
             1000, undefined, undefined, undefined, undefined, arg));

          if ( bestCost > idxCost ) {
            bestIndex = idx;
            bestCost = idxCost;
          }
        }
        return bestIndex;

      } else {
        // generate indexes, sort by estimate, chain as requested
        var sortedArgs = Object.create(null);
        var costs = [];
        var args = this.args;
        var dupes = {}; // avoid duplicate indexes
        for (var i = 0; i < args.length; i++ ) {
          var arg = args[i];
          var idx = arg.toIndex(tail);
          if ( ! idx ) continue;

          // duplicate check
          var idxString = idx.toString();
          if ( dupes[idxString] ) continue;
          dupes[idxString] = true;

          var idxCost = Math.floor(idx.estimate(
             1000, undefined, undefined, undefined, undefined, arg));
          // make unique with a some extra digits
          var costKey = idxCost + i / 1000.0;
          sortedArgs[costKey] = arg;
          costs.push(costKey);
        }
        costs = costs.sort(foam.Number.compare);

        // Sort, build list up starting at the end (most expensive
        //   will end up deepest in the index)
        var tailRet = tail;
        var chainDepth = Math.min(costs.length - 1, depth - 1);
        for ( var i = chainDepth; i >= 0; i-- ) {
          var arg = sortedArgs[costs[i]];
          //assert(arg is a predicate)
          tailRet = arg.toIndex(tailRet);
        }

        return tailRet;
      }
    },

    function toDisjunctiveNormalForm() {
      // for each nested OR, multiply:
      // AND(a,b,OR(c,d),OR(e,f)) -> OR(abce,abcf,abde,abdf)

      var andArgs = [];
      var orArgs  = [];
      var oldArgs = this.args;
      for (var i = 0; i < oldArgs.length; i++ ) {
        var a = oldArgs[i].toDisjunctiveNormalForm();
        if ( this.Or.isInstance(a) ) {
          orArgs.push(a);
        } else {
          andArgs.push(a);
        }
      }

      if ( orArgs.length > 0 ) {
        var newAndGroups = [];
        // Generate every combination of the arguments of the OR clauses
        // orArgsOffsets[g] represents the array index we are lookig at
        // in orArgs[g].args[offset]
        var orArgsOffsets = new Array(orArgs.length).fill(0);
        var active = true;
        var idx = orArgsOffsets.length - 1;
        orArgsOffsets[idx] = -1; // compensate for intial ++orArgsOffsets[idx]
        while ( active ) {
          while ( ++orArgsOffsets[idx] >= orArgs[idx].args.length ) {
            // reset array index count, carry the one
            if ( idx === 0 ) { active = false; break; }
            orArgsOffsets[idx] = 0;
            idx--;
          }
          idx = orArgsOffsets.length - 1;
          if ( ! active ) break;

          // for the last group iterated, read back up the indexes
          // to get the result set
          var newAndArgs = [];
          for ( var j = orArgsOffsets.length - 1; j >= 0; j-- ) {
            newAndArgs.push(orArgs[j].args[orArgsOffsets[j]]);
          }
          newAndArgs = newAndArgs.concat(andArgs);

          newAndGroups.push(
            this.cls_.create({ args: newAndArgs })
          );
        }
        return this.Or.create({ args: newAndGroups }).partialEval();
      } else {
        // no OR args, no DNF transform needed
        return this;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Contains',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Predicate returns true iff second arg found in first array argument.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        var s1 = this.arg1.f(o);
        return s1 ? s1.indexOf(this.arg2.f(o)) !== -1 : false;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'ContainsIC',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Predicate returns true iff second arg found in first array argument, ignoring case.',

  methods: [
    function f(o) {
      var s1 = this.arg1.f(o);
      var s2 = this.arg2.f(o);
      if ( typeof s1 !== 'string' || typeof s2 !== 'string' ) return false;
      // TODO(braden): This is faster if we use a regex with the ignore-case
      // option. That requires regex escaping arg2, though.
      // TODO: port faster version from FOAM1
      var uc1 = s1.toUpperCase();
      var uc2 = s2.toUpperCase();
      return uc1.indexOf(uc2) !== -1;
    },
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'StartsWith',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Predicate returns true iff arg1 starts with arg2 or if arg1 is an array, if an element starts with arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        var arg1 = this.arg1.f(o);
        var arg2 = this.arg2.f(o);

        if ( Array.isArray(arg1) ) {
          return arg1.some(function(arg) {
            return arg.startsWith(arg2);
          });
        }

        return arg1.startsWith(arg2);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'StartsWithIC',
  extends: 'foam.mlang.predicate.Binary',
  implements: ['foam.core.Serializable'],

  documentation: 'Predicate returns true iff arg1 starts with arg2 or if arg1 is an array, if an element starts with arg2, ignoring case.',

  methods: [
    {
      name: 'f',
      code: function f(o) {
        var arg1 = this.arg1.f(o);
        var arg2 = this.arg2.f(o);

        if ( Array.isArray(arg1) ) {
          return arg1.some(function(arg) {
            return foam.String.startsWithIC(arg, arg2);
          });
        }

        return foam.String.startsWithIC(arg1, arg2);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'ArrayBinary',
  extends: 'foam.mlang.predicate.Binary',

  documentation: 'Binary predicate that accepts an array in "arg2".',

  properties: [
    {
      name: 'arg2',
      postSet: function() {
        this.valueSet_ = null;
      },
      adapt: function(old, nu, prop) {
        var value = prop.adaptValue(nu);
        var arg1 = this.arg1;
        if ( foam.mlang.Constant.isInstance(value) && arg1 && arg1.adapt ) {
          var arrayValue = value.value;
          for ( var i = 0; i < arrayValue.length; i++ ) {
            arrayValue[i] = arg1.adapt.call(null, old && old[i], arrayValue[i], arg1);
          }
        }

        return value;
      }
    },
    {
      // TODO: simpler to make an expression
      name: 'valueSet_'
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'In',
  extends: 'foam.mlang.predicate.ArrayBinary',
  implements: [
    'foam.core.Serializable',
    { path: 'foam.mlang.Expressions', java: false }
  ],

  documentation: 'Predicate returns true iff arg1 is a substring of arg2, or if arg2 is an array, arg1 is an element of arg2.',

  requires: [ 'foam.mlang.Constant' ],

  properties: [
    {
      name: 'arg1',
      postSet: function(old, nu) {
        // this is slightly slower when an expression on upperCase_
        this.upperCase_ = nu && foam.core.Enum.isInstance(nu);
      }
    },
    {
      name: 'upperCase_',
    }
  ],

  methods: [
    function f(o) {
      var lhs = this.arg1.f(o);
      var rhs = this.arg2.f(o);

      // If arg2 is a constant array, we use valueSet for it.
      if ( this.Constant.isInstance(this.arg2) ) {
        if ( ! this.valueSet_ ) {
          var set = {};
          for ( var i = 0 ; i < rhs.length ; i++ ) {
            var s = rhs[i];
            if ( this.upperCase_ ) s = s.toUpperCase();
            set[s] = true;
          }
          this.valueSet_ = set;
        }

        return !! this.valueSet_[lhs];
      }

      return rhs ? rhs.indexOf(lhs) !== -1 : false;
    },
    function partialEval() {
      if ( ! this.Constant.isInstance(this.arg2) ) return this;

      return this.arg2.value.length === 0 ? this.FALSE : this;
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'InIC',
  extends: 'foam.mlang.predicate.ArrayBinary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Predicate returns true iff arg1 is a substring of arg2, or if arg2 is an array, is an element of arg2, case insensitive.',

  methods: [
    function f(o) {
      var lhs = this.arg1.f(o);
      var rhs = this.arg2.f(o);

      if ( lhs.toUpperCase ) lhs = lhs.toUpperCase();

      // If arg2 is a constant array, we use valueSet for it.
      if ( foam.mlang.Constant.isInstance(this.arg2) ) {
        if ( ! this.valueSet_ ) {
          var set = {};
          for ( var i = 0 ; i < rhs.length ; i++ ) {
            set[rhs[i].toUpperCase()] = true;
          }
          this.valueSet_ = set;
        }

        return !! this.valueSet_[lhs];
      } else {
        if ( ! rhs ) return false;
        return rhs.toUpperCase().indexOf(lhs) !== -1;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'Constant',
  extends: 'foam.mlang.AbstractExpr',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'An Expression which always returns the same constant value.',

  properties: [
    {
      class: 'Object',
      name: 'value'
    }
  ],

  methods: [
    function f() { return this.value; },

    function toString_(x) {
      return typeof x === 'number' ? '' + x :
        typeof x === 'string' ? '"' + x + '"' :
        Array.isArray(x) ? '[' + x.map(this.toString_.bind(this)).join(', ') + ']' :
        x.toString ? x.toString() :
        x;
    },

    function toString() { return this.toString_(this.value); },

    // TODO(adamvy): Re-enable when we can parse this in java more correctly.
    function xxoutputJSON(os) {
      os.output(this.value);
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Func',
  extends: 'foam.mlang.predicate.AbstractPredicate',

  documentation: 'A function to Predicate adapter.',

  // TODO: rename FunctionPredicate

  properties: [
    {
      /** The function to apply to objects passed to this expression */
      name: 'fn'
    }
  ],

  methods: [
    function f(o) { return this.fn(o); },
    function toString() {
      return 'FUNC(' + fn.toString() + ')';
    }
  ]
});


/** Binary expression for equality of two arguments. */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Eq',
  extends: 'foam.mlang.predicate.Binary',

  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 EQUALS arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        var v1 = this.arg1.f(o);
        var v2 = this.arg2.f(o);

        // First check is so that EQ(Class.PROPERTY, null | undefined) works.
        return ( v1 === undefined && v2 === null ) || foam.util.equals(v1, v2);
      }
    },

    function reduceAnd(other) {
      var myArg1           = this.arg1;
      var myArg2           = this.arg2;
      var otherArg1        = other.arg1;
      var otherArg2        = other.arg2;
      var isConst          = foam.mlang.Constant.isInstance.bind(foam.mlang.Constant);
      var myArg1IsConst    = isConst(myArg1);
      var myArg2IsConst    = isConst(myArg2);
      var otherArg1IsConst = isConst(otherArg1);
      var otherArg2IsConst = isConst(otherArg2);

      // Require one const, one non-const in this and other.
      if ( myArg1IsConst === myArg2IsConst || otherArg1IsConst === otherArg2IsConst )
        return this.SUPER(other);

      // Require same expr.
      var myExpr    = myArg1IsConst ? myArg2 : myArg1;
      var otherExpr = otherArg1IsConst ? otherArg2 : otherArg1;
      var equals    = foam.util.equals;

      if ( ! equals(myExpr, otherExpr) ) return this.SUPER(other);

      // Reduce to FALSE when consts are not equal.
      var myConst    = myArg1IsConst    ? myArg1    : myArg2;
      var otherConst = otherArg1IsConst ? otherArg1 : otherArg2;

      return equals(myConst, otherConst) ? this.SUPER(other) : this.FALSE;
    }
  ]
});


/** Binary expression for inequality of two arguments. */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Neq',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 does NOT EQUAL arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        return ! foam.util.equals(this.arg1.f(o), this.arg2.f(o));
      }
    }
  ]
});


/** Binary expression for "strictly less than". */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Lt',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 is LESS THAN arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        return foam.util.compare(this.arg1.f(o), this.arg2.f(o)) < 0;
      }
    }
  ]
});


/** Binary expression for "less than or equal to". */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Lte',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 is LESS THAN or EQUAL to arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        return foam.util.compare(this.arg1.f(o), this.arg2.f(o)) <= 0;
      }
    }
  ]
});


/** Binary expression for "strictly greater than". */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Gt',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 is GREATER THAN arg2.',

  methods: [
    {
      name: 'f',
      code: function(o) {
        return foam.util.compare(this.arg1.f(o), this.arg2.f(o)) > 0;
      }
    }
  ]
});


/** Binary expression for "greater than or equal to". */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Gte',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Binary Predicate returns true iff arg1 is GREATER THAN or EQUAL to arg2.',


  methods: [
    {
      name: 'f',
      code: function(o) {
        return foam.util.compare(this.arg1.f(o), this.arg2.f(o)) >= 0;
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Has',
  extends: 'foam.mlang.predicate.Unary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Unary Predicate that returns true iff the given property has a value other than null, undefined, \'\', or [].',

  methods: [
    function f(obj) {
      var value = this.arg1.f(obj);

      return ! (
        value === undefined ||
        value === null      ||
        value === ''        ||
        (Array.isArray(value) && value.length === 0) );
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Not',
  extends: 'foam.mlang.predicate.AbstractPredicate',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Unary Predicate which negates the value of its argument.',

  properties: [
    {
      class: 'foam.mlang.predicate.PredicateProperty',
      name: 'arg1'
    }
  ],

  methods: [
    function f(obj) { return ! this.arg1.f(obj); },

    function toString() {
      return foam.String.constantize(this.cls_.name) +
          '(' + this.arg1.toString() + ')';
    },

    /*
      TODO: this isn't ported to FOAM2 yet.
    function partialEval() {
      return this;
      var newArg = this.arg1.partialEval();

      if ( newArg === TRUE ) return FALSE;
      if ( newArg === FALSE ) return TRUE;
      if ( NotExpr.isInstance(newArg) ) return newArg.arg1;
      if ( EqExpr.isInstance(newArg)  ) return NeqExpr.create(newArg);
      if ( NeqExpr.isInstance(newArg) ) return EqExpr.create(newArg);
      if ( LtExpr.isInstance(newArg)  ) return GteExpr.create(newArg);
      if ( GtExpr.isInstance(newArg)  ) return LteExpr.create(newArg);
      if ( LteExpr.isInstance(newArg) ) return GtExpr.create(newArg);
      if ( GteExpr.isInstance(newArg) ) return LtExpr.create(newArg);

      return this.arg1 === newArg ? this : NOT(newArg);
    }*/
  ]
});


foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Keyword',
  extends: 'foam.mlang.predicate.Unary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Unary Predicate for generic keyword search (searching all String properties for argument substring).',

  requires: [
    'foam.core.String'
  ],

  methods: [
    function f(obj) {
      var arg = this.arg1.f(obj);
      if ( ! arg || typeof arg !== 'string' ) return false;

      arg = arg.toLowerCase();

      var props = obj.cls_.getAxiomsByClass(this.String);
      for ( var i = 0; i < props.length; i++ ) {
        var s = props[i].f(obj);
        if ( ! s || typeof s !== 'string' ) continue;
        if ( s.toLowerCase().indexOf(arg) >= 0 ) return true;
      }

      return false;
    }
  ]
});


/** Map sink transforms each put with a given mapping expression. */
foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Map',
  extends: 'foam.dao.ProxySink',

  implements: [
    'foam.core.Serializable'
  ],

  documentation: 'Sink Decorator which applies a map function to put() values before passing to delegate.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    }
  ],

  methods: [
    function f(o) { return this.arg1.f(o); },

    function put(o, sub) { this.delegate.put(this.f(o), sub); },

    function toString() {
      return 'MAP(' + this.arg1.toString() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.expr',
  name: 'Mul',

  implements: [
    'foam.mlang.predicate.Binary',
    'foam.core.Serializable'
  ],

  documentation: 'Multiplication Binary Expression.',

  methods: [
    function f(o) { return this.arg1.f(o) * this.arg2.f(o); }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'GroupBy',
  extends: 'foam.dao.AbstractSink',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Sink which behaves like the SQL group-by command.',

  // TODO: it makes no sense to name the arguments arg1 and arg2
  // because this isn't an expression, so they should be more meaningful
  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    },
    {
      class: 'foam.mlang.SinkProperty',
      name: 'arg2'
    },
    {
      name: 'groups',
      factory: function() { return {}; }
    },
    {
      class: 'StringArray',
      name: 'groupKeys',
      factory: function() { return []; }
    },
    {
      class: 'Boolean',
      name: 'processArrayValuesIndividually',
      documentation: 'If true, each value of an array will be entered into a separate group.',
      factory: function() {
        // TODO: it would be good if it could also detect RelationshipJunction.sourceId/targetId
        return ! foam.core.MultiPartID.isInstance(this.arg1);
      }
    }
  ],

  methods: [
    function sortedKeys(opt_comparator) {
      this.groupKeys.sort(opt_comparator || this.arg1.comparePropertyValues);
      return this.groupKeys;
    },

    function putInGroup_(sub, key, obj) {
      var group = this.groups.hasOwnProperty(key) && this.groups[key];
      if ( ! group ) {
        group = this.arg2.clone();
        this.groups[key] = group;
        this.groupKeys.push(key);
      }
      group.put(obj, sub);
    },

    function put(obj, sub) {
      var key = this.arg1.f(obj);
      if ( this.processArrayValuesIndividually && Array.isArray(key) ) {
        if ( key.length ) {
          for ( var i = 0; i < key.length; i++ ) {
            this.putInGroup_(sub, key[i], obj);
          }
        } else {
          // Perhaps this should be a key value of null, not '', since '' might
          // actually be a valid key.
          this.putInGroup_(sub, '', obj);
        }
      } else {
        this.putInGroup_(sub, key, obj);
      }
    },

    function eof() { },

    function clone() {
      // Don't use the default clone because we don't want to copy 'groups'.
      return this.cls_.create({ arg1: this.arg1, arg2: this.arg2 });
    },

    function toString() {
      return this.groups.toString();
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Unique',
  extends: 'foam.dao.ProxySink',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Sink decorator which only put()\'s a single obj for each unique expression value.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'expr'
    },
    {
      name: 'values',
      factory: function() { return {}; }
    }
  ],

  methods: [
    function putInGroup_(key, obj) {
      var group = this.groups.hasOwnProperty(key) && this.groups[key];
      if ( ! group ) {
        group = this.arg2.clone();
        this.groups[key] = group;
        this.groupKeys.push(key);
      }
      group.put(obj);
    },

    function put(sub, obj) {
      var value = this.expr.f(obj);
      if ( Array.isArray(value) ) {
        throw 'Unique doesn\'t Array values.';
      } else {
        if ( ! this.values.hasOwnProperty(value) ) {
          this.values[value] = obj;
          this.delegate.put(obj);
        }
      }
    },

    function eof() { },

    function clone() {
      // Don't use the default clone because we don't want to copy 'uniqueValues'.
      return this.cls_.create({ expr: this.expr, delegate: this.delegate });
    },

    function toString() {
      return this.uniqueValues.toString();
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Explain',
  extends: 'foam.dao.ProxySink',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'Pseudo-Sink which outputs a human-readable description of an MDAO\'s execution plan for evaluating it.',

  properties: [
    {
      class: 'String',
      name:  'plan',
      help:  'Execution Plan'
    }
  ],

  methods: [
    function toString() { return this.plan; },
  ]
});


foam.CLASS({
  refines: 'foam.core.Property',

  implements: [ 'foam.mlang.order.Comparator' ],

  methods: [
    {
      name: 'orderTail',
      code: function() { return; }
    },
    {
      name: 'orderPrimaryProperty',
      code: function() { return this; }
    },
    {
      name: 'orderDirection',
      code: function() { return 1; }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.order',
  name: 'Desc',

  implements: [
    'foam.mlang.order.Comparator',
    'foam.core.Serializable'
  ],

  documentation: 'Comparator Decorator which reverses direction of comparison. Short for "descending".',

  properties: [
    {
      class: 'FObjectProperty',
      name: 'arg1',
      of: 'foam.mlang.order.Comparator',
      adapt: function(_, c) { return foam.compare.toCompare(c); }
    }
  ],

  methods: [
    function compare(o1, o2) {
      return -1 * this.arg1.compare(o1, o2);
    },
    function toString() { return 'DESC(' + this.arg1.toString() + ')'; },
    function toIndex(tail) { return this.arg1 && this.arg1.toIndex(tail); },
    function orderTail() { return; },
    function orderPrimaryProperty() { return this.arg1; },
    function orderDirection() { return -1 * this.arg1.orderDirection(); }
  ]
});


foam.CLASS({
  package: 'foam.mlang.order',
  name: 'ThenBy',

  implements: [
    'foam.mlang.order.Comparator',
    'foam.core.Serializable'
  ],

  documentation: 'Binary Comparator, which sorts for first Comparator, then second.',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.mlang.order.Comparator',
      adapt: function(_, a) {
        // TODO(adamvy): We should fix FObjectProperty's default adapt when the
        // of parameter is an interface rather than a class.
        return a;
      },
      name: 'arg1'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.mlang.order.Comparator',
      adapt: function(_, a) {
        // TODO(adamvy): We should fix FObjectProperty's default adapt when the
        // of parameter is an interface rather than a class.
        return a;
      },
      name: 'arg2'
    },
    {
      name: 'compare',
      transient: true,
      documentation: 'Is a property so that it can be bound to "this" so that it works with Array.sort().',
      factory: function() { return this.compare_.bind(this); }
    }
  ],

  methods: [
    function compare_(o1, o2) {
      // an equals of arg1.compare is falsy, which will then hit arg2
      return this.arg1.compare(o1, o2) || this.arg2.compare(o1, o2);
    },

    function toString() {
      return 'THEN_BY(' + this.arg1.toString() + ', ' +
        this.arg2.toString() + ')';
    },

    function toIndex(tail) {
      return this.arg1 && this.arg2 && this.arg1.toIndex(this.arg2.toIndex(tail));
    },

    function orderTail() { return this.arg2; },

    function orderPrimaryProperty() { return this.arg1.orderPrimaryProperty(); },

    function orderDirection() { return this.arg1.orderDirection(); }
  ]
});


foam.CLASS({
  package: 'foam.mlang.order',
  name: 'CustomComparator',
  implements: [ 'foam.mlang.order.Comparator' ],

  // TODO: rename FunctionComparator

  documentation: 'A function to Comparator adapter.',

  properties: [
    {
      class: 'Function',
      name: 'compareFn'
    }
  ],

  methods: [
    {
      name: 'compare',
      code: function(o1, o2) {
        return this.compareFn(o1, o2);
      }
    },
    {
      name: 'toString',
      code: function() {
        return 'CUSTOM_COMPARE(' + this.compareFn.toString() + ')';
      }
    },
    {
      name: 'orderTail',
      code: function() { return undefined; }
    },
    {
      /** TODO: allow user to set this to match the given function */
      name: 'orderPrimaryProperty',
      code: function() { return undefined; }
    },
    {
      name: 'orderDirection',
      code: function() { return 1; }
    }
  ]
});


foam.LIB({
  name: 'foam.compare',

  methods: [
    function desc(c) {
      return foam.mlang.order.Desc.create({ arg1: c });
    },

    function toCompare(c) {
      return foam.Array.isInstance(c) ? foam.compare.compound(c) :
        foam.Function.isInstance(c)   ? foam.mlang.order.CustomComparator.create({ compareFn: c }) :
        c ;
    },

    function compound(args) {
      /* Create a compound comparator from an array of comparators. */
      var cs = args.map(foam.compare.toCompare);

      if ( cs.length === 0 ) return;
      if ( cs.length === 1 ) return cs[0];

      var ThenBy = foam.mlang.order.ThenBy;
      var ret, tail;

      ret = tail = ThenBy.create({arg1: cs[0], arg2: cs[1]});

      for ( var i = 2 ; i < cs.length ; i++ ) {
        tail = tail.arg2 = ThenBy.create({arg1: tail.arg2, arg2: cs[i]});
      }

      return ret;
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'AbstractUnarySink',
  extends: 'foam.dao.AbstractSink',

  implements: [
    'foam.core.Serializable'
  ],

  documentation: 'An Abstract Sink baseclass which takes only one argument.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    }
  ],

  methods: [
    function toString() {
      return foam.String.constantize(this.cls_.name) +
          '(' + this.arg1.toString() + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Max',
  extends: 'foam.mlang.sink.AbstractUnarySink',

  documentation: 'A Sink which remembers the maximum value put().',

  properties: [
    {
      class: 'Double',
      name: 'value'
    }
  ],

  methods: [
    function put(obj, sub) {
      if ( ! this.hasOwnProperty('value') || foam.util.compare(this.value, this.arg1.f(obj)) < 0 ) {
        this.value = this.arg1.f(obj);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Min',
  extends: 'foam.mlang.sink.AbstractUnarySink',

  documentation: 'A Sink which remembers the minimum value put().',

  properties: [
    {
      class: 'Object',
      name: 'value'
    }
  ],

  methods: [
    function put(obj, s) {
      if ( ! this.hasOwnProperty('value') || foam.util.compare(this.value, this.arg1.f(obj) ) > 0) {
        this.value = this.arg1.f(obj);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Sum',
  extends: 'foam.mlang.sink.AbstractUnarySink',

  documentation: 'A Sink which sums put() values.',

  properties: [
    {
      class: 'foam.mlang.ExprProperty',
      name: 'arg1'
    },
    {
      class: 'Double',
      name: 'value',
      value: 0
    }
  ],

  methods: [
    function put(obj, sub) { this.value += this.arg1.f(obj); }
  ]
});


foam.CLASS({
  package: 'foam.mlang.expr',
  name: 'Dot',
  extends: 'foam.mlang.predicate.Binary',
  implements: [ 'foam.core.Serializable' ],

  documentation: 'A Binary Predicate which applies arg2.f() to arg1.f().',

  methods: [
    function f(o) {
      return this.arg2.f(this.arg1.f(o));
    },

    function comparePropertyValues(o1, o2) {
      /**
         Compare property values using arg2's property value comparator.
         Used by GroupBy
      **/
      return this.arg2.comparePropertyValues(o1, o2);
    }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'Expressions',

  documentation: 'Convenience mix-in for requiring all mlangs.',

  requires: [
    'foam.mlang.Constant',
    'foam.mlang.expr.Dot',
    'foam.mlang.expr.Mul',
    'foam.mlang.order.Desc',
    'foam.mlang.order.ThenBy',
    'foam.mlang.predicate.And',
    'foam.mlang.predicate.Contains',
    'foam.mlang.predicate.ContainsIC',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.False',
    'foam.mlang.predicate.Func',
    'foam.mlang.predicate.Gt',
    'foam.mlang.predicate.Gte',
    'foam.mlang.predicate.Has',
    'foam.mlang.predicate.In',
    'foam.mlang.predicate.Keyword',
    'foam.mlang.predicate.Lt',
    'foam.mlang.predicate.Lte',
    'foam.mlang.predicate.Neq',
    'foam.mlang.predicate.Not',
    'foam.mlang.predicate.Or',
    'foam.mlang.predicate.StartsWith',
    'foam.mlang.predicate.StartsWithIC',
    'foam.mlang.predicate.True',
    'foam.mlang.sink.Count',
    'foam.mlang.sink.Explain',
    'foam.mlang.sink.GroupBy',
    'foam.mlang.sink.Map',
    'foam.mlang.sink.Max',
    'foam.mlang.sink.Min',
    'foam.mlang.sink.Sum',
    'foam.mlang.sink.Unique'
  ],

  constants: {
    FALSE: foam.mlang.predicate.False.create(),
    TRUE: foam.mlang.predicate.True.create()
  },

  methods: [
    function _nary_(name, args) {
      return this[name].create({ args: Array.from(args) });
    },

    function _unary_(name, arg) {
      return this[name].create({ arg1: arg });
    },

    function _binary_(name, arg1, arg2) {
      return this[name].create({ arg1: arg1, arg2: arg2 });
    },

    function OR() { return this._nary_("Or", arguments); },
    function AND() { return this._nary_("And", arguments); },
    function CONTAINS(a, b) { return this._binary_("Contains", a, b); },
    function CONTAINS_IC(a, b) { return this._binary_("ContainsIC", a, b); },
    function EQ(a, b) { return this._binary_("Eq", a, b); },
    function NEQ(a, b) { return this._binary_("Neq", a, b); },
    function IN(a, b) { return this._binary_("In", a, b); },
    function LT(a, b) { return this._binary_("Lt", a, b); },
    function GT(a, b) { return this._binary_("Gt", a, b); },
    function LTE(a, b) { return this._binary_("Lte", a, b); },
    function GTE(a, b) { return this._binary_("Gte", a, b); },
    function HAS(a) { return this._unary_("Has", a); },
    function NOT(a) { return this._unary_("Not", a); },
    function KEYWORD(a) { return this._unary_("Keyword", a); },
    function STARTS_WITH(a, b) { return this._binary_("StartsWith", a, b); },
    function STARTS_WITH_IC(a, b) { return this._binary_("StartsWithIC", a, b); },
    function FUNC(fn) { return this.Func.create({ fn: fn }); },
    function DOT(a, b) { return this._binary_("Dot", a, b); },
    function MUL(a, b) { return this._binary_("Mul", a, b); },

    function UNIQUE(expr, sink) { return this.Unique.create({ expr: expr, delegate: sink }); },
    function GROUP_BY(expr, sinkProto) { return this.GroupBy.create({ arg1: expr, arg2: sinkProto }); },
    function MAP(expr, sink) { return this.Map.create({ arg1: expr, delegate: sink }); },
    function EXPLAIN(sink) { return this.Explain.create({ delegate: sink }); },
    function COUNT() { return this.Count.create(); },
    function MAX(arg1) { return this.Max.create({ arg1: arg1 }); },
    function MIN(arg1) { return this.Min.create({ arg1: arg1 }); },
    function SUM(arg1) { return this.Sum.create({ arg1: arg1 }); },

    function DESC(a) { return this._unary_("Desc", a); },
    function THEN_BY(a, b) { return this._binary_("ThenBy", a, b); }
  ]
});


foam.CLASS({
  package: 'foam.mlang',
  name: 'ExpressionsSingleton',
  extends: 'foam.mlang.Expressions',

  documentation: 'A convenience object which provides access to all mlangs.',
  // TODO: why is this needed?

  axioms: [
    foam.pattern.Singleton.create()
  ]
});

// TODO(braden): We removed Expr.pipe(). That may still be useful to bring back,
// probably with a different name. It doesn't mean the same as DAO.pipe().
// remove eof()
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.mlang',
  name: 'LabeledValue',

  documentation: 'A basic model for any id-label-value triple. This is ' +
      'useful when you need essentially a DAO of strings, and need to wrap ' +
      'those strings into a modeled object.',

  properties: [
    {
      name: 'id',
      expression: function(label) { return label; }
    },
    {
      class: 'String',
      name: 'label',
      required: true
    },
    {
      name: 'value'
    }
  ]
});
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
  package: 'foam.dao.index',
  name: 'Plan',

  properties: [
    {
      name: 'cost',
      value: 0
    }
  ],

  methods: [
    function execute(promise, state, sink, skip, limit, order, predicate) {},
    function toString() { return this.cls_.name+"(cost="+this.cost+")"; }
  ]
});


/** Plan indicating that there are no matching records. **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'NotFoundPlan',
  extends: 'foam.dao.index.Plan',

  axioms: [ foam.pattern.Singleton.create() ],

  properties: [
    { name: 'cost', value: 0 }
  ],

  methods: [
    function toString() { return 'no-match(cost=0)'; }
  ]
});


/** Plan indicating that an index has no plan for executing a query. **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'NoPlan',
  extends: 'foam.dao.index.Plan',

  axioms: [ foam.pattern.Singleton.create() ],

  properties: [
    { name: 'cost', value: Number.MAX_VALUE }
  ],

  methods: [
    function toString() { return 'no-plan'; }
  ]
});


/** Convenience wrapper for indexes that want to create a closure'd function
    for each plan instance */
foam.CLASS({
  package: 'foam.dao.index',
  name: 'CustomPlan',
  extends: 'foam.dao.index.Plan',

  properties: [
    {
      class: 'Function',
      name: 'customExecute'
    },
    {
      class: 'Function',
      name: 'customToString'
    }
  ],

  methods: [
    function execute(promise, state, sink, skip, limit, order, predicate) {
      this.customExecute.call(
          this,
          promise,
          state,
          sink,
          skip,
          limit,
          order,
          predicate);
    },

    function toString() {
      return this.customToString.call(this);
    }
  ]
});


foam.CLASS({
  package: 'foam.dao.index',
  name: 'CountPlan',
  extends: 'foam.dao.index.Plan',

  properties: [
    {
      class: 'Int',
      name: 'count'
    }
  ],

  methods: [
    function execute(promise, sink /*, skip, limit, order, predicate*/) {
      sink.value += this.count;
    },

    function toString() {
      return 'short-circuit-count(' + this.count + ')';
    }
  ]
});


foam.CLASS({
  package: 'foam.dao.index',
  name: 'AltPlan',
  extends: 'foam.dao.index.Plan',

  properties: [
    {
      name: 'subPlans',
      factory: function() { return []; },
      postSet: function(o, nu) {
        this.cost = 1;
        for ( var i = 0; i < nu.length; ++i ) {
          this.cost += nu[i].cost;
        }
      }
    },
    'prop'
  ],

  methods: [
    function execute(promise, sink, skip, limit, order, predicate) {
      var sp = this.subPlans;
      for ( var i = 0 ; i < sp.length ; ++i) {
        sp[i].execute(promise, sink, skip, limit, order, predicate);
      }
    },

    function toString() {
      return ( ! this.subPlans || this.subPlans.length <= 1 ) ?
        'IN(key=' + ( this.prop && this.prop.name ) + ', cost=' + this.cost + ', ' +
          ', size=' + ( this.subPlans ? this.subPlans.length : 0 ) + ')' :
        'lookup(key=' + this.prop && this.prop.name + ', cost=' + this.cost + ', ' +
          this.subPlans[0].toString();
    }
  ]
});



/**
  Merges results from multiple sub-plans and deduplicates, sorts, and
  filters the results.

  TODO: account for result sorting in cost?
*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'MergePlan',
  extends: 'foam.dao.index.AltPlan',

  requires: [
    'foam.dao.DedupSink',
    'foam.dao.LimitedSink',
    'foam.dao.SkipSink',
    'foam.dao.OrderedSink',
    'foam.dao.FlowControl'
  ],

  properties: [
    {
      class: 'Class',
      name: 'of'
    },
    'predicates',
  ],

  methods: [
    /**
      Executes sub-plans, limiting results from each, then merges results,
      removes duplicates, sorts, skips, and limits.
    */
    function execute(promise, sink, skip, limit, order, predicate) {
      if ( order ) return this.executeOrdered(promise, sink, skip, limit, order, predicate);
      return this.executeFallback(promise, sink, skip, limit, order, predicate);
    },

    function executeOrdered(promise, sink, skip, limit, order, predicate) {
      /**
       * Executes a merge where ordering is specified, therefore
       * results from the subPlans are also sorted, and can be merged
       * efficiently.
       */
      foam.assert(order && order.compare, "Order.compare() must be supplied in MergePlan.executeOrdered()");
      foam.assert(( ! this.predicates ) || ( this.predicates.size == this.subPlans.size ), "MergePlan.predicates, when specified, must match the number of subplans." );

      // quick linked list
      var NodeProto = { next: null, data: null };

      var head = Object.create(NodeProto);
      // TODO: track list size, cut off if above skip+limit

      var sp = this.subPlans;
      var predicates = this.predicates;
      var subLimit = ( limit ? limit + ( skip ? skip : 0 ) : undefined );
      var promises = []; // track any async subplans
      var dedupCompare = ( this.of ) ? this.of.ID.compare.bind(this.of.ID) : foam.util.compare;
      var compare = order.compare.bind(order);

      // Each plan inserts into the list
      for ( var i = 0 ; i < sp.length ; ++i) {
        var insertPlanSink;
        (function() { // capture new insertAfter for each sink
          // set new insert position to head.
          // Only bump insertAfter forward when the next item is smaller,
          //   since we need to scan all equal items every time a new item
          //   comes in.
          // If the next item is larger, we insert before it
          //   and leave the insertion point where it is, so the next
          //   item can check if it is equal to the just-inserted item.
          var insertAfter = head;
          insertPlanSink = foam.dao.QuickSink.create({
            putFn: function(o) {
              function insert() {
                var nu = Object.create(NodeProto);
                nu.next = insertAfter.next;
                nu.data = o;
                insertAfter.next = nu;
              }

              // Skip past items that are less than our new item
              while ( insertAfter.next &&
                      compare(o, insertAfter.next.data) > 0 ) {
                 insertAfter = insertAfter.next;
              }

              if ( ! insertAfter.next ) {
                // end of list case, no equal items, so just append
                insert();
                return;
              } else if ( compare(o, insertAfter.next.data) === 0 ) {
                // equal items case, check for dupes
                // scan through any items that are equal, dupe check each
                var dupeAfter = insertAfter;
                while ( dupeAfter.next &&
                        compare(o, dupeAfter.next.data) === 0 ) {
                  if ( dedupCompare(o, dupeAfter.next.data) === 0 ) {
                    // duplicate found, ignore the new item
                    return;
                  }
                  dupeAfter = dupeAfter.next;
                }
                // No dupes found, so insert at position dupeAfter
                // dupeAfter.next is either end-of-list or a larger item
                var nu = Object.create(NodeProto);
                nu.next = dupeAfter.next;
                nu.data = o;
                dupeAfter.next = nu;
                dupeAfter = null;
                return;
              } else { // comp < 0
                 // existing-is-greater-than-new case, insert before it
                 insert();
              }
            }
          });
        })();
        // restart the promise chain, if a promise is added we collect it
        var nuPromiseRef = [];
        sp[i].execute(
          nuPromiseRef,
          insertPlanSink,
          undefined,
          subLimit,
          order,
          predicates ? predicates[i] : predicate // array mode (one per subplan) or repeated use of single predicate
        );
        if ( nuPromiseRef[0] ) promises.push(nuPromiseRef[0]);
      }

      // result reading may by async, so define it but don't call it yet
      var resultSink = this.decorateSink_(sink, skip, limit);

      var sub = foam.core.FObject.create();
      var detached = false;
      sub.onDetach(function() { detached = true; });

      function scanResults() {
        // The list starting at head now contains the results plus possible
        //  overflow of skip+limit
        var node = head.next;
        while ( node && ! detached ) {
          resultSink.put(node.data, sub);
          node = node.next;
        }
      }

      // if there is an async index in the above, wait for it to finish
      //   before reading out the results.
      if ( promises.length ) {
        var thisPromise = Promise.all(promises).then(scanResults);
        // if an index above us is also async, chain ourself on
        promise[0] = promise[0] ? promise[0].then(function() {
          return thisPromise;
        }) : thisPromise;
      } else {
        // In the syncrhonous case we don't have to wait on our subplans,
        //  and can ignore promise[0] as someone else is responsible for
        //  waiting on it if present.
        scanResults();
      }
    },

    function executeFallback(promise, sink, skip, limit, order, predicate) {
       /**
        * Executes a merge where ordering is unknown, therefore no
        * sorting is done and deduplication must be done separately.
        */
       var resultSink = this.DedupSink.create({
         delegate: this.decorateSink_(sink, skip, limit)
       });

       foam.assert(( ! this.predicates ) || ( this.predicates.size == this.subPlans.size ), "MergePlan.predicates, when specified, must match the number of subplans." );

       var sp = this.subPlans;
       var predicates = this.predicates;
       var subLimit = ( limit ? limit + ( skip ? skip : 0 ) : undefined );

       for ( var i = 0 ; i < sp.length ; ++i) {
         sp[i].execute(
           promise,
           resultSink,
           undefined,
           subLimit,
           order,
           predicates ? predicates[i] : predicate // array mode (one per subplan) or repeated use of single predicate
         );
       }
       // Since this execute doesn't collect results into a temporary
       // storage list, we don't need to worry about the promises. Any
       // async subplans will add their promise on, and when they are
       // resolved their results will have already put() straight into
       // the resultSink. Only the MDAO calling the first execute() needs
       // to respect the referenced promise chain.
    },

    function decorateSink_(sink, skip, limit) {
      /**
       * TODO: Share with AbstractDAO? We never need to use predicate or order
       * @private
       */
      if ( limit != undefined ) {
        sink = this.LimitedSink.create({
          limit: limit,
          delegate: sink
        });
      }
      if ( skip != undefined ) {
        sink = this.SkipSink.create({
          skip: skip,
          delegate: sink
        });
      }

      return sink;
    },

  ]
});
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
  The Index interface for an ordering, fast lookup, single value,
  index multiplexer, or any other MDAO select() assistance class.

  Each Index subclass also defines an IndexNode class. Index defines
  the structure of the index, including estimate() to gauge its
  probable performance for a query, while IndexNode implements the
  data nodes that hold the indexed items and plan and execute
  queries. For any particular operational Index, there may be
  many IndexNode instances:

<pre>
                 1---------> TreeIndex(id)
  MDAO: AltIndex 2---------> TreeIndex(propA) ---> TreeIndex(id) -------------> ValueIndex
        | 1x AltIndexNode    | 1x TreeIndexNode    | 14x TreeIndexNodes         | (DAO size)x ValueIndexNodes
           (2 alt subindexes)     (14 nodes)             (each has 0-5 nodes)
</pre>
  The base AltIndex has two complete subindexes (each holds the entire DAO).
  The TreeIndex on property A has created one TreeIndexNode, holding one tree of 14 nodes.
  Each tree node contains a tail instance of the next level down, thus
  the TreeIndex on id has created 14 TreeIndexNodes. Each of those contains some number
  of tree nodes, each holding one tail instance of the ValueIndex at the end of the chain.

*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'Index',

  properties: [
    {
      /**
       * The class type of the data nodes this index creates with
       * createNode(). By default it will be the Index class' name
       * with Node appended:
       * <p><code>MyIndex => MyIndexNode</code>
       */
      class: 'Class',
      name: 'nodeClass',
      factory: function() {
        return this.cls_.id + 'Node';
      }
    }
  ],

  methods: [
    function estimate(size, sink, skip, limit, order, predicate) {
      /** Estimates the performance of this index given the number of items
        it will hold and the planned parameters. */
      return size * size; // n^2 is a good worst-case estimate by default
    },

    function toPrettyString(indent) {
      /** Output a minimal, human readable, indented (2 spaces per level)
        description of the index structure */
    },

    function createNode(args) {
      args = args || {};
      args.index = this;
      return this.nodeClass.create(args, this);
    }
  ]
});


/**
  The IndexNode interface represents a piece of the index that actually
  holds data. A tree will create an index-node for each tree-node, so one
  Index will manage many IndexNode instances, each operating on part of
  the data in the DAO.

  For creation speed, do not require or import anything in a node class.
  Use the 'index' property to access requires and imports on the
  Index that created the node instance.
*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'IndexNode',

  properties: [
    {
      class: 'Simple',
      name: 'index'
    }
  ],

  methods: [
    /** Adds or updates the given value in the index */
    function put(obj) {},

    /** Removes the given value from the index */
    function remove(obj) {},

    /** @return a Plan to execute a select with the given parameters */
    function plan(sink, skip, limit, order, predicate, root) {},

    /** @return the tail index instance for the given key. */
    function get(key) {},

    /** @return the integer size of this index. */
    function size() {},

    /** Selects matching items from the index and puts them into sink.
        cache allows indexes to store query state that is discarded once
        the select() is complete.
      <p>Note: order checking has replaced selectReverse().  */
    function select(sink, skip, limit, order, predicate, cache) { },

    /** Efficiently (if possible) loads the contents of the given DAO into the index */
    function bulkLoad(dao) {}
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao.index',
  name: 'ProxyIndex',
  extends: 'foam.dao.index.Index',

  properties: [
    {
      name: 'delegate',
      required: true,
    }
  ],
  methods: [
    function estimate(size, sink, skip, limit, order, predicate) {
      return this.delegate.estimate(size, sink, skip, limit, order, predicate);
    },

    function toPrettyString(indent) {
      return this.delegate.toPrettyString(indent);
    },

    function toString() {
      return '[' + this.cls_.name + ': ' + this.delegate.toString() + ']'
    }
  ]
});

foam.CLASS({
  package: 'foam.dao.index',
  name: 'ProxyIndexNode',
  extends: 'foam.dao.index.IndexNode',

  properties: [
    {
      class: 'Simple',
      name: 'delegate',
    },
  ],

  methods: [
    function init() {
      this.delegate = this.delegate || this.index.delegate.createNode();
    },

    function put(o) { return this.delegate.put(o); },

    function remove(o) { return this.delegate.remove(o); },

    function plan(sink, skip, limit, order, predicate, root) {
      return this.delegate.plan(sink, skip, limit, order, predicate, root);
    },

    function get(key) { return this.delegate.get(key); },

    function size() { return this.delegate.size(); },

    function select(sink, skip, limit, order, predicate, cache) {
      return this.delegate.select(sink, skip, limit, order, predicate, cache);
    },

    function bulkLoad(dao) { return this.delegate.bulkLoad(dao); },

  ]
});

/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  Provides for hetergenious indexes, where not all potential delegates
  of this AltIndex actually get populated for each instance. Each instance
  always populates an ID index, so it can serve queries even if no
  delegate indexes are explicitly added.

  Index: Alt[ID, TreeA, TreeB]
  IndexNodes: [id, a,b], [id, a], [id, b], [id, a], [id]
*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'AltIndex',
  extends: 'foam.dao.index.Index',

  requires: [
    'foam.dao.index.NoPlan',
    'foam.mlang.sink.NullSink',
  ],

  constants: {
    /** Maximum cost for a plan which is good enough to not bother looking at the rest. */
    GOOD_ENOUGH_PLAN: 10 // put to 10 or more when not testing
  },

  properties: [
    {
      /** delegate factories */
      name: 'delegates',
      factory: function() { return []; }
    },
    {
      /** factory quick lookup */
      name: 'delegateMap_',
      factory: function() { return {}; }
    },
  ],

  methods: [

    /** Returns smallest estimate from the delegates */
    function estimate(size, sink, skip, limit, order, predicate) {
      var cost = Number.MAX_VALUE;
      for ( var i = 0; i < this.delegates.length; i++ ) {
        cost = Math.min(
          cost,
          this.delegates[i].estimate(
            size, sink, skip, limit, order, predicate)
        );
      }
      return cost;
    },

    function toPrettyString(indent) {
      var ret = "";
      for ( var i = 0; i < this.delegates.length; i++ ) {
          ret += this.delegates[i].toPrettyString(indent + 1);
      }
      return ret;
    },

    function toString() {
      return 'Alt([' + (this.delegates.join(',')) + '])';
    },
  ]
});

foam.CLASS({
  package: 'foam.dao.index',
  name: 'AltIndexNode',
  extends: 'foam.dao.index.IndexNode',

  properties: [
    {
      /** the delegate instances for each Alt instance */
      class: 'Simple',
      name: 'delegates'
    },
  ],

  methods: [
    function init() {
      this.delegates = this.delegates || [ this.index.delegates[0].createNode() ];
    },

    function addIndex(index) {
      // check for existing factory
      var dfmap = this.index.delegateMap_;
      var indexKey = index.toString();
      if ( ! dfmap[indexKey] ) {
        this.index.delegates.push(index);
        dfmap[indexKey] = index;
      } else {
        // ensure all tails are using the same factory instance
        index = dfmap[indexKey];
      }

      var newSubInst = index.createNode();
      var wrapped = foam.dao.DAOSink.create({ dao: newSubInst });
      this.delegates[0].plan(wrapped).execute([], wrapped);
      this.delegates.push(newSubInst);
    },

    function bulkLoad(a) {
      for ( var i = 0 ; i < this.delegates.length ; i++ ) {
        this.delegates[i].bulkLoad(a);
      }
    },

    function get(key) {
      return this.delegates[0].get(key);
    },

    function pickDelegate(order, cache) {
      // NOTE: this assumes one of the delegates is capable of ordering
      //  properly for a scan. We should not be asked for a select unless
      //  a previous estimate indicated one of our options was sorted properly.
      // NOTE: unbuilt portions of the index will be built immediately
      //  if picked for ordering.
      var delegates = this.delegates;
      if ( ! order ) return delegates[0];

      var c = cache[this];
      // if no cached index estimates, generate estimates
      // for each factory for this ordering
      if ( ! c ) {
        var nullSink = this.index.NullSink.create();
        var dfs = this.index.delegates;
        var bestEst = Number.MAX_VALUE;
        // Pick the best factory for the ordering, cache it
        for ( var i = 0; i < dfs.length; i++ ) {
          var est = dfs[i].estimate(1000, nullSink, undefined, undefined, order);
          if ( est < bestEst ) {
            c = dfs[i];
            bestEst = est;
          }
        }
        cache[this] = c;
      }

      // check if we have a delegate instance for the best factory
      for ( var i = 0; i < delegates.length; i++ ) {
        // if we do, it's the best one
        if ( delegates[i].index === c ) return delegates[i];
      }

      // we didn't have the right delegate generated, so add and populate it
      // as per addIndex, but we skip checking the factory as we know it's stored
      var newSubInst = c.createNode();
      var wrapped = foam.dao.DAOSink.create({ dao: newSubInst });
      this.delegates[0].plan(wrapped).execute([], wrapped);
      this.delegates.push(newSubInst);

      return newSubInst;
    },


    function select(sink, skip, limit, order, predicate, cache) {
      // find and cache the correct subindex to use
      this.pickDelegate(order, cache)
        .select(sink, skip, limit, order, predicate, cache);
    },

    function put(newValue) {
      for ( var i = 0 ; i < this.delegates.length ; i++ ) {
        this.delegates[i].put(newValue);
      }
    },

    function remove(obj) {
      for ( var i = 0 ; i < this.delegates.length ; i++ ) {
        this.delegates[i].remove(obj);
      }
    },

    function plan(sink, skip, limit, order, predicate, root) {
      var bestPlan;
      for ( var i = 0 ; i < this.delegates.length ; i++ ) {
        var p = this.delegates[i].plan(sink, skip, limit, order, predicate, root);
        if ( p.cost <= this.index.GOOD_ENOUGH_PLAN ) {
          bestPlan = p;
          break;
        }
        if ( ! bestPlan || p.cost < bestPlan.cost ) {
          bestPlan = p;
        }
      }
      if ( ! bestPlan ) {
        return this.index.NoPlan.create();
      }
      return bestPlan;
    },

    function size() { return this.delegates[0].size(); },

    function toString() {
      return 'Alt([' + (this.index.delegates.join(',')) + this.size() + '])';
    },
  ]
});
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
  An Index which holds only a single value. This class also functions as its
  own execution Plan, since it only has to return the single value.
**/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'ValueIndex',
  extends: 'foam.dao.index.Index',

  methods: [
    function estimate(size, sink, skip, limit, order, predicate) {
      return 1;
    },

    function toPrettyString(indent) {
      return '';
    },

  ]
});
foam.CLASS({
  package: 'foam.dao.index',
  name: 'ValueIndexNode',
  extends: 'foam.dao.index.IndexNode',
  implements: [ 'foam.dao.index.Plan' ],

  properties: [
    { class: 'Simple', name: 'value' },
    { class: 'Simple', name: 'cost' }
  ],

  methods: [
    // from plan
    function execute(promise, sink) {
      /** Note that this will put(undefined) if you remove() the item but
        leave this ValueIndex intact. Usages of ValueIndex should clean up
        the ValueIndex itself when the value is removed. */
      sink.put(this.value);
    },

    function toString() {
      return 'ValueIndex_Plan(cost=1, value:' + this.value + ')';
    },

    // from Index
    function put(s) { this.value = s; },
    function remove() { this.value = undefined; },
    function get() { return this.value; },
    function size() { return typeof this.value === 'undefined' ? 0 : 1; },
    function plan() { this.cost = 1; return this; },

    function select(sink, skip, limit, order, predicate, cache) {
      if ( predicate && ! predicate.f(this.value) ) return;
      if ( skip && skip[0]-- > 0 ) return;
      if ( limit && limit[0]-- <= 0 ) return;
      sink.put(this.value);
    },
  ]
});
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
  Represents one node's state in a binary tree. Each tree operation
  can rebalance the subtree or create a new node, so those methods
  return a tree node reference to replace the one called. It may be the
  same node, a different existing node, or a new node.
  <p>
  <code>
    // replace s.right with result of operations on s.right
    s.right = s.right.maybeClone(locked).split(locked);
  </code>
*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'TreeNode',

  properties: [
    // per node properties
    { class: 'Simple', name: 'key'   },
    { class: 'Simple', name: 'value' },
    { class: 'Simple', name: 'size'  },
    { class: 'Simple', name: 'level' },
    { class: 'Simple', name: 'left'  },
    { class: 'Simple', name: 'right' }
  ],

  methods: [

    /**
       Clone is only needed if a select() is active in the tree at the
       same time we are updating it.
    */
    function maybeClone(locked) {
      return locked ? this.clone() : this;
    },

    function clone() {
      var c = this.cls_.create();
      c.key   = this.key;
      c.value = this.value;
      c.size  = this.size;
      c.level = this.level;
      c.left  = this.left;
      c.right = this.right;
      return c;
    },

    function updateSize() {
      this.size = this.left.size + this.right.size + this.value.size();
    },

    /** @return Another node representing the rebalanced AA tree. */
    function skew(locked) {
      if ( this.left.level === this.level ) {
        // Swap the pointers of horizontal left links.
        var l = this.left.maybeClone(locked);

        this.left = l.right;
        l.right = this;

        this.updateSize();
        l.updateSize();

        return l;
      }

      return this;
    },

    /** @return a node representing the rebalanced AA tree. */
    function split(locked) {
      if (
          this.right.level       &&
          this.right.right.level &&
          this.level === this.right.right.level
      ) {
        // We have two horizontal right links.
        // Take the middle node, elevate it, and return it.
        var r = this.right.maybeClone(locked);

        this.right = r.left;
        r.left = this;
        r.level++;

        this.updateSize();
        r.updateSize();

        return r;
      }

      return this;
    },

    function predecessor() {
      if ( ! this.left.level ) return this;
      for ( var s = this.left ; s.right.level ; s = s.right ) {}
      return s;
    },

    function successor() {
      if ( ! this.right.level ) return this;
      for ( var s = this.right ; s.left.level ; s = s.left ) {}
      return s;
    },

    /**
       Removes links that skip levels.
       @return the tree with its level decreased.
    */
    function decreaseLevel(locked) {
      var expectedLevel = Math.min(
          this.left.level  ? this.left.level  : 0,
          this.right.level ? this.right.level : 0) + 1;

      if ( expectedLevel < this.level ) {
        this.level = expectedLevel;
        if ( this.right.level && expectedLevel < this.right.level ) {
          this.right = this.right.maybeClone(locked);
          this.right.level = expectedLevel;
        }
      }

      return this;
    },

    /** extracts the value with the given key from the index */
    function get(key, compare) {
      var r = compare(this.key, key);

      if ( r === 0 ) return this.value; // TODO... tail.get(this.value) ???

      return r > 0 ? this.left.get(key, compare) : this.right.get(key, compare);
    },

    /** scans the entire tree and returns all matches */
    function getAll(key, compare, retArray) {
      var r = compare(this.key, key);

      if ( r === 0 ) retArray.push(this.value);

      this.left.getAll(key, compare, retArray);
      this.right.getAll(key, compare, retArray);
    },

    function putKeyValue(key, value, compare, dedup, locked) {
      var s = this.maybeClone(locked);

      var r = compare(s.key, key);

      if ( r === 0 ) {
        dedup(value, s.key);

        s.size -= s.value.size();
        s.value.put(value);
        s.size += s.value.size();
      } else {
        var side = r > 0 ? 'left' : 'right';

        if ( s[side].level ) s.size -= s[side].size;
        s[side] = s[side].putKeyValue(key, value, compare, dedup, locked);
        s.size += s[side].size;
      }

      return s.split(locked).skew(locked);
    },

    function removeKeyValue(key, value, compare, locked, nullNode) {
      var s = this.maybeClone(locked);
      var side;
      var r = compare(s.key, key);

      if ( r === 0 ) {
        s.size -= s.value.size();
        s.value.remove(value);

        // If the sub-Index still has values, then don't
        // delete this node.
        if ( s.value && s.value.size() > 0 ) {
          s.size += s.value.size();
          return s;
        }

        // If we're a leaf, easy, otherwise reduce to leaf case.
        if ( ! s.left.level && ! s.right.level ) {
          return nullNode;
        }

        side = s.left.level ? 'left' : 'right';

        // TODO: it would be faster if successor and predecessor also deleted
        // the entry at the same time in order to prevent two traversals.
        // But, this would also duplicate the delete logic.
        var l = side === 'left' ?
            s.predecessor() :
            s.successor()   ;

        s.key = l.key;
        s.value = l.value;

        s[side] = s[side].removeNode(l.key, compare, locked);
      } else {
        side = r > 0 ? 'left' : 'right';

        s.size -= s[side].size;
        s[side] = s[side].removeKeyValue(key, value, compare, locked, nullNode);
        s.size += s[side].size;
      }

      // Rebalance the tree. Decrease the level of all nodes in this level if
      // necessary, and then skew and split all nodes in the new level.
      s = s.decreaseLevel(locked).skew(locked);
      if ( s.right.level ) {
        s.right = s.right.maybeClone(locked).skew(locked);
        if ( s.right.right.level ) {
          s.right.right = s.right.right.maybeClone(locked).skew(locked);
        }
      }

      s = s.split(locked);
      s.right = s.right.maybeClone(locked).split(locked);

      return s;
    },

    function removeNode(key, compare, locked) {
      var s = this.maybeClone(locked);

      var r = compare(s.key, key);

      if ( r === 0 ) return s.left.level ? s.left : s.right;

      var side = r > 0 ? 'left' : 'right';

      s.size -= s[side].size;
      s[side] = s[side].removeNode(key, compare, locked);
      s.size += s[side].size;

      return s;
    },


    function select(sink, skip, limit, order, predicate, cache) {
      if ( limit && limit[0] <= 0 ) return;

      if ( skip && skip[0] >= this.size && ! predicate ) {
        skip[0] -= this.size;
        return;
      }

      this.left.select(sink, skip, limit, order, predicate, cache);

      this.value.select(sink, skip, limit,
        order && order.orderTail(), predicate, cache);

      this.right.select(sink, skip, limit, order, predicate, cache);
    },


    function selectReverse(sink, skip, limit, order, predicate, cache) {
      if ( limit && limit[0] <= 0 ) return;

      if ( skip && skip[0] >= this.size && ! predicate ) {
        //console.log('reverse skipping: ', this.key);
        skip[0] -= this.size;
        return;
      }

      this.right.selectReverse(sink, skip, limit, order, predicate, cache);

      // select() will pick reverse or not based on order
      this.value.select(sink, skip, limit,
        order && order.orderTail(), predicate, cache);

      this.left.selectReverse(sink,  skip, limit, order, predicate, cache);
    },

    function gt(key, compare) {
      var s = this;
      var r = compare(key, s.key);

      if ( r < 0 ) {
        var l = s.left.gt(key, compare);
        var copy = s.clone();
        copy.size = s.size - s.left.size + l.size;
        copy.left = l;
        return copy;
      }

      if ( r > 0 ) return s.right.gt(key, compare);

      return s.right;
    },

    function gte(key, compare, nullNode) {
      var s = this;
      var copy;
      var r = compare(key, s.key);

      if ( r < 0 ) {
        var l = s.left.gte(key, compare, nullNode);
        copy = s.clone();
        copy.size = s.size - s.left.size + l.size;
        copy.left = l;
        return copy;
      }

      if ( r > 0 ) return s.right.gte(key, compare, nullNode);

      copy = s.clone();
      copy.size = s.size - s.left.size;
      copy.left = nullNode;
      return copy;
    },

    function lt(key, compare) {
      var s = this;
      var r = compare(key, s.key);

      if ( r > 0 ) {
        var rt = s.right.lt(key, compare);
        var copy = s.clone();
        copy.size = s.size - s.right.size + rt.size;
        copy.right = rt;
        return copy;
      }

      if ( r < 0 ) return s.left.lt(key, compare);

      return s.left;
    },

    function lte(key, compare, nullNode) {
      var s = this;
      var copy;
      var r = compare(key, s.key);

      if ( r > 0 ) {
        var rt = s.right.lte(key, compare, nullNode);
        copy = s.clone();
        copy.size = s.size - s.right.size + rt.size;
        copy.right = rt;
        return copy;
      }

      if ( r < 0 ) return s.left.lte(key, compare, nullNode);

      copy = s.clone();
      copy.size = s.size - s.right.size;
      copy.right = nullNode;
      return copy;
    }
  ]
});


/**
  Guards the leaves of the tree. Once instance is created per instance of
  TreeIndex, and referenced by every tree node. Most of its methods are
  no-ops, cleanly terminating queries and other tree operations.
  <p>
  NullTreeNode covers creation of new nodes: when a put value hits the
  nullNode, a new TreeNode is returned and the caller replaces the
  nullNode reference with the new node.
*/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'NullTreeNode',

  properties: [
    {
      /**
        The nullNode for a given tree creates all the new nodes, so it needs
        the factory for the tail index to create inside each new node.
      */
      class: 'Simple',
      name: 'tail'
    },
    {
      /**
        The tree node factory is used to create new, empty tree nodes. They
        will be initialized with a new tail index from tail.
      */
      class: 'Simple',
      name: 'treeNode'
    },
    {
      class: 'Simple',
      name: 'left',
      //getter: function() { return undefined; }
    },
    {
      class: 'Simple',
      name: 'right',
      //getter: function() { return undefined; }
    },
    {
      class: 'Simple',
      name: 'size',
      //getter: function() { return 0; }
    },
    {
      class: 'Simple',
      name: 'level',
      //getter: function() { return 0; }
    }
  ],

  methods: [
    function init() {
      this.left  = undefined;
      this.right = undefined;
      this.size  = 0;
      this.level = 0;
    },

    function clone()         { return this; },
    function maybeClone()    { return this; },
    function skew(locked)    { return this; },
    function split(locked)   { return this; },
    function decreaseLevel() { return this; },
    function get()           { return undefined; },
    function updateSize()    {  },

    /** Add a new value to the tree */
    function putKeyValue(key, value) {
      var subIndex = this.tail.createNode();
      subIndex.put(value);
      var n = this.treeNode.create();
      n.left  = this;
      n.right = this;
      n.key   = key;
      n.value = subIndex;
      n.size  = 1;
      n.level = 1;
      return n;
    },

    function removeKeyValue() { return this; },
    function removeNode()     { return this; },
    function select()         { },
    function selectReverse()  { },

    function gt()   { return this; },
    function gte()  { return this; },
    function lt()   { return this; },
    function lte()  { return this; },

    function getAll()  { return; },

    function bulkLoad_(a, start, end, keyExtractor) {
      if ( end < start ) return this;

      var tree = this;
      var m    = start + Math.floor((end-start+1) / 2);
      tree = tree.putKeyValue(keyExtractor(a[m]), a[m]);

      tree.left  = tree.left.bulkLoad_(a, start, m-1, keyExtractor);
      tree.right = tree.right.bulkLoad_(a, m+1, end, keyExtractor);
      tree.size += tree.left.size + tree.right.size;

      return tree;
    }
  ]
});
/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
  refines: 'foam.core.Property',

  requires: [
    'foam.dao.index.TreeIndex',
  ],

  methods: [
    function toIndex(tail) {
      /** Creates the correct type of index for this property, passing in the
          tail factory (sub-index) provided. */
      return this.TreeIndex.create({ prop: this, tail: tail });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.FObjectArray',

  requires: [
    'foam.dao.index.SetIndex',
  ],

  methods: [
    function toIndex(tail) {
       return this.SetIndex.create({ prop: this, tail: tail });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.AxiomArray',

  requires: [
    'foam.dao.index.SetIndex',
  ],

  methods: [
    function toIndex(tail) {
       return this.SetIndex.create({ prop: this, tail: tail });
    }
  ]
});


foam.CLASS({
  refines: 'foam.core.StringArray',

  requires: [
    'foam.dao.index.SetIndex',
  ],

  methods: [
    function toIndex(tail) {
       return this.SetIndex.create({ prop: this, tail: tail });
    }
  ]
});


/** A tree-based Index. Defaults to an AATree (balanced binary search tree) **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'TreeIndex',
  extends: 'foam.dao.index.Index',

  requires: [
    'foam.core.Property',
    'foam.dao.ArraySink',
    'foam.mlang.sink.NullSink',
    'foam.dao.index.MergePlan',
    'foam.dao.index.CountPlan',
    'foam.dao.index.CustomPlan',
    'foam.dao.index.NotFoundPlan',
    'foam.dao.index.NullTreeNode',
    'foam.dao.index.TreeNode',
    'foam.dao.index.ValueIndex',
    'foam.mlang.order.Desc',
    'foam.mlang.order.Comparator',
    'foam.mlang.order.ThenBy',
    'foam.mlang.predicate.And',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.False',
    'foam.mlang.predicate.Gt',
    'foam.mlang.predicate.Gte',
    'foam.mlang.predicate.Lt',
    'foam.mlang.predicate.Lte',
    'foam.mlang.predicate.Or',
    'foam.mlang.predicate.True',
    'foam.mlang.predicate.In',
    'foam.mlang.predicate.Contains',
    'foam.mlang.predicate.ContainsIC',
    'foam.mlang.sink.Count',
    'foam.mlang.sink.Explain',
  ],

  constants: {
    IS_EXPR_MATCH_FN: function isExprMatch(predicate, prop, model) {
      var self = this.index || this;
      if ( predicate && model && prop ) {
        // util.equals catches Properties that were cloned if the predicate has
        //  been cloned.
        if ( model.isInstance(predicate) &&
            ( predicate.arg1 === prop || foam.util.equals(predicate.arg1, prop) )
        ) {
          var arg2 = predicate.arg2;
          predicate = undefined;
          return { arg2: arg2, predicate: predicate };
        }

        if ( predicate.args && self.And.isInstance(predicate) ) {
          for ( var i = 0 ; i < predicate.args.length ; i++ ) {
            var q = predicate.args[i];
            // Util.equals to catch clones again
            if ( model.isInstance(q) &&
                (q.arg1 === prop || foam.util.equals(q.arg1, prop)) ) {
              predicate = predicate.clone();
              predicate.args[i] = self.True.create();
              predicate = predicate.partialEval();
              if ( self.True.isInstance(predicate) ) predicate = undefined;
              return { arg2: q.arg2, predicate: predicate };
            }
          }
        }
      }
      return undefined;
    }
  },

  properties: [
    {
      name: 'prop',
      required: true
    },
    {
      name: 'nullNode',
      factory: function() {
        var nn = this.NullTreeNode.create({
          tail: this.tail,
          treeNode: this.treeNode
        });
        return nn;
      }
    },
    {
      name: 'treeNode',
      factory: function() { return this.TreeNode; }
    },
    {
      name: 'tail',
      required: true
    }
  ],

  methods: [
    function init() {
      this.dedup = this.dedup.bind(this, this.prop.name);
    },

    /** Set the value's property to be the same as the key in the index.
        This saves memory by sharing objects. */
    function dedup(propName, obj, value) {
      obj[propName] = value;
    },

    function compare(o1, o2) {
      return foam.util.compare(o1, o2);
    },

    function isOrderSelectable(order) {
      // no ordering, no problem
      if ( ! order ) return true;

      // if this index can sort, it's up to our tail to sub-sort
      if ( foam.util.equals(order.orderPrimaryProperty(), this.prop) ) {
        // If the subestimate is less than sort cost (N*lg(N) for a dummy size of 1000)
        return 9965 >
          this.tail.estimate(1000, this.NullSink.create(), 0, 0, order.orderTail())
      }
      // can't use select() with the given ordering
      return false;
    },

    function estimate(size, sink, skip, limit, order, predicate) {
      // small sizes don't matter
      if ( size <= 16 ) return Math.log(size) / Math.log(2);

      // if only estimating by ordering, just check if we can scan it
      //  otherwise return the sort cost.
      // NOTE: This is conceptually the right thing to do, but also helps
      //   speed up isOrderSelectable() calls on this:
      //   a.isOrderSelectable(o) -> b.estimate(..o) -> b.isOrderSelectable(o) ...
      //   Which makes it efficient but removes the need for Index to
      //   have an isOrderSelectable() method forwarding directly.
      if ( order && ! ( predicate || skip || limit ) ) {
        return this.isOrderSelectable(order) ? size :
          size * Math.log(size) / Math.log(2);
      }

      var self = this;
      predicate = predicate ? predicate.clone() : null;
      var property = this.prop;
      // TODO: validate this assumption:
      var nodeCount = Math.floor(size * 0.25); // tree node count will be a quarter the total item count

      var isExprMatch = this.IS_EXPR_MATCH_FN.bind(this, predicate, property);

      var tail = this.tail;
      var subEstimate = ( tail ) ? function() {
          return Math.log(nodeCount) / Math.log(2) +
            tail.estimate(size / nodeCount, sink, skip, limit, order, predicate);
        } :
        function() { return Math.log(nodeCount) / Math.log(2); };

      var expr = isExprMatch(this.In);
      if ( expr ) {
        // tree depth * number of compares
        return subEstimate() * expr.arg2.f().length;
      }

      expr = isExprMatch(this.Eq);
      if ( expr ) {
        // tree depth
        return subEstimate();
      }

      expr = isExprMatch(this.ContainsIC);
      if ( expr ) ic = true;
      expr = expr || isExprMatch(this.Contains);
      if ( expr ) {
        // TODO: this isn't quite right. Tree depth * query string length?
        // If building a trie to help with this, estimate becomes easier.
        return subEstimate() * expr.arg2.f().length;
      }

      // At this point we are going to scan all or part of the tree
      //  with select()
      var cost = size;

      // These cases are just slightly better scans, but we can't estimate
      //   how much better... maybe half
      if ( isExprMatch(this.Gt) || isExprMatch(this.Gte) ||
          isExprMatch(this.Lt) || isExprMatch(this.Lte) ) {
        cost /= 2;
      }

      // Ordering
      // if sorting required, add the sort cost
      if ( ! this.isOrderSelectable(order) ) {
        // this index or a tail index can't sort this ordering,
        // manual sort required
        if ( cost > 0 ) cost *= Math.log(cost) / Math.log(2);
      }

      return cost;
    },

    function toString() {
      return '[' + this.cls_.name + ': ' + this.prop.name + ' ' + this.tail.toString() + ']';
    },

    function toPrettyString(indent) {
      var ret = '';
      //ret += "  ".repeat(indent) + this.cls_.name + "( " + this.prop.name + "\n";
      //ret += this.tail.toPrettyString(indent + 1);
      //ret += "  ".repeat(indent) + ")\n";
      var tail = this.tail.toPrettyString(indent + 1);
      ret = '  '.repeat(indent) + this.prop.name + '(' + this.$UID + ')\n';
      if ( tail.trim().length > 0 ) ret += tail;
      return ret;
    }
  ]
});


/** A tree-based Index. Defaults to an AATree (balanced binary search tree) **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'TreeIndexNode',
  extends: 'foam.dao.index.IndexNode',

  properties: [
    {
      class: 'Simple',
      name: 'selectCount',
    },
    {
      class: 'Simple',
      name: 'root',
    }
  ],

  methods: [
    function init() {
      this.root = this.root || this.index.nullNode;
      this.selectCount = this.selectCount || 0;
    },

    /**
     * Bulk load an unsorted array of objects.
     * Faster than loading individually, and produces a balanced tree.
     **/
    function bulkLoad(a) {
      a = a.array || a;
      this.root = this.index.nullNode;

      // Only safe if children aren't themselves trees
      // TODO: should this be !TreeIndex.isInstance? or are we talking any
      // non-simple index, and is ValueIndex the only simple index?
      // It's the default, so ok for now
      if ( this.index.ValueIndex.isInstance(this.tail) ) {
        var prop = this.index.prop;
        a.sort(prop.compare.bind(prop));
        this.root = this.root.bulkLoad_(a, 0, a.length-1, prop.f);
      } else {
        for ( var i = 0 ; i < a.length ; i++ ) {
          this.put(a[i]);
        }
      }
    },

    function put(newValue) {
      this.root = this.root.putKeyValue(
          this.index.prop.f(newValue),
          newValue,
          this.index.compare,
          this.index.dedup,
          this.selectCount > 0);
    },

    function remove(value) {
      this.root = this.root.removeKeyValue(
          this.index.prop.f(value),
          value,
          this.index.compare,
          this.selectCount > 0,
          this.index.nullNode);
    },

    function get(key) {
      // does not delve into sub-indexes
      return this.root.get(key, this.index.compare);
    },

    function select(sink, skip, limit, order, predicate, cache) {
      // AATree node will extract orderDirs.next for the tail index
      if ( order && order.orderDirection() < 0 ) {
        this.root.selectReverse(sink, skip, limit, order, predicate, cache);
      } else {
        this.root.select(sink, skip, limit, order, predicate, cache);
      }
    },

    function size() { return this.root.size; },

    function plan(sink, skip, limit, order, predicate, root) {
      var index = this;
      var m = this.index;


      if ( m.False.isInstance(predicate) ) return m.NotFoundPlan.create();

      if ( ! predicate && m.Count.isInstance(sink) ) {
        var count = this.size();
        //        console.log('**************** COUNT SHORT-CIRCUIT ****************', count, this.toString());
        return m.CountPlan.create({ count: count });
      }

      var prop = m.prop;

      if ( foam.mlang.sink.GroupBy.isInstance(sink) && sink.arg1 === prop ) {
      // console.log('**************** GROUP-BY SHORT-CIRCUIT ****************');
      // TODO: allow sink to split up, for GroupBy passing one sub-sink to each tree node
      //  for grouping. Allow sink to suggest order, if order not defined
      //    sink.subSink(key) => sink
      //    sink.defaultOrder() => Comparator
      }

      var result, subPlan, cost;

      var isExprMatch = m.IS_EXPR_MATCH_FN.bind(this, predicate, prop);

      var expr = isExprMatch(m.In);
      if ( expr ) {
        predicate = expr.predicate;
        var keys = expr.arg2.f();
        // Just scan if that would be faster.
        if ( Math.log(this.size())/Math.log(2) * keys.length < this.size() ) {
          var subPlans = [];
          cost = 1;

          for ( var i = 0 ; i < keys.length ; ++i) {
            result = this.get(keys[i]);

            if ( result ) { // TODO: could refactor this subindex recursion into .plan()
              subPlan = result.plan(sink, skip, limit, order, predicate, root);

              cost += subPlan.cost;
              subPlans.push(subPlan);
            }
          }

          if ( subPlans.length === 0 ) return m.NotFoundPlan.create();

          return m.MergePlan.create({
            subPlans: subPlans,
            prop: prop
          });
        }
      }

      expr = isExprMatch(m.Eq);
      if ( expr ) {
        predicate = expr.predicate;
        var key = expr.arg2.f();
        result = this.get(key, this.index.compare);

        if ( ! result ) return m.NotFoundPlan.create();

        subPlan = result.plan(sink, skip, limit, order, predicate, root);

        return subPlan;
      }

      var ic = false;
      expr = isExprMatch(m.ContainsIC);
      if ( expr ) ic = true;
      expr = expr || isExprMatch(m.Contains);
      if ( expr ) {
        predicate = expr.predicate;
        var key = ic ? expr.arg2.f().toLowerCase() : expr.arg2.f();

        // Substring comparison function:
        // returns 0 if nodeKey contains masterKey.
        // returns -1 if nodeKey is shorter than masterKey
        // returns 1 if nodeKey is longer or equal length, but does not contain masterKey
        var compareSubstring = function compareSubstring(nodeKey, masterKey) {
          // nodeKey can't contain masterKey if it's too short
          if ( ( ! nodeKey ) || ( ! nodeKey.indexOf ) || ( nodeKey.length < masterKey.length ) ) return -1;

          if ( ic ) nodeKey = nodeKey.toLowerCase(); // TODO: handle case-insensitive better

          return nodeKey.indexOf(masterKey) > -1 ? 0 : 1;
        }

        var indexes = [];
        if ( ! key || key.length === 0 ) {
          // everything contains 'nothing'
          this.root.getAll('', function() { return 0; }, indexes);
        } else {
          this.root.getAll(key, compareSubstring, indexes);
        }
        var subPlans = [];
        // iterate over all keys
        for ( var i = 0; i < indexes.length; i++ ) {
          subPlans.push(indexes[i].plan(sink, skip, limit, order, predicate, root));
        }

        return m.MergePlan.create({
          subPlans: subPlans,
          prop: prop
        });
      }

      // Restrict the subtree to search as necessary
      var subTree = this.root;

      expr = isExprMatch(m.Gt);
      if ( expr ) subTree = subTree.gt(expr.arg2.f(), this.index.compare);

      expr = isExprMatch(m.Gte);
      if ( expr ) subTree = subTree.gte(expr.arg2.f(), this.index.compare, this.index.nullNode);

      expr = isExprMatch(m.Lt);
      if ( expr ) subTree = subTree.lt(expr.arg2.f(), this.index.compare);

      expr = isExprMatch(m.Lte);
      if ( expr ) subTree = subTree.lte(expr.arg2.f(), this.index.compare, this.index.nullNode);

      cost = subTree.size;
      var sortRequired = ! this.index.isOrderSelectable(order);
      var reverseSort = false;

      var subOrder;
      var orderDirections;
      if ( order && ! sortRequired ) {
        // we manage the direction of the first scan directly,
        // tail indexes will use the order.orderTail()
        if ( order.orderDirection() < 0 ) reverseSort = true;
      }

      if ( ! sortRequired ) {
        if ( skip ) cost -= skip;
        if ( limit ) cost = Math.min(cost, limit);
      } else {
        // add sort cost
        if ( cost !== 0 ) cost *= Math.log(cost) / Math.log(2);
      }

      return m.CustomPlan.create({
        cost: cost,
        customExecute: function(promise, sink, skip, limit, order, predicate) {
          if ( sortRequired ) {
            var arrSink = m.ArraySink.create();
            index.selectCount++;
            subTree.select(arrSink, null, null, null, predicate, {});
            index.selectCount--;
            var a = arrSink.array;
            a.sort(order.compare.bind(order));

            skip = skip || 0;
            limit = Number.isFinite(limit) ? limit : a.length;
            limit += skip;
            limit = Math.min(a.length, limit);

            var sub = foam.core.FObject.create();
            var detached = false;
            sub.onDetach(function() { detached = true; });
            for ( var i = skip; i < limit; i++ ) {
              sink.put(a[i], sub);
              if ( detached ) break;
            }
          } else {
            index.selectCount++;
            // Note: pass skip and limit by reference, as they are modified in place
            reverseSort ?
              subTree.selectReverse(
                sink,
                skip != null ? [skip] : null,
                limit != null ? [limit] : null,
                order, predicate, {}) : subTree.select(
                  sink,
                  skip != null ? [skip] : null,
                  limit != null ? [limit] : null,
                  order, predicate, {}) ;
            index.selectCount--;
          }
        },
        customToString: function() {
          return 'scan(key=' + prop.name + ', cost=' + this.cost +
              ', sorting=' + ( sortRequired ? order.toString() : 'none' ) +
              ', reverseScan=' + reverseSort +
              (predicate && predicate.toSQL ? ', predicate: ' + predicate.toSQL() : '') +
              ')';
        }
      });
    },

    function toString() {
      return 'TreeIndex(' + (this.index || this).prop.name + ', ' + (this.index || this).tail + ')';
    }
  ]
});


/** Case-Insensitive TreeIndex **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'CITreeIndex',
  extends: 'foam.dao.index.TreeIndex',
});


foam.CLASS({
  package: 'foam.dao.index',
  name: 'CITreeIndexNode',
  extends: 'foam.dao.index.TreeIndexNode',

  methods: [
    function put(newValue) {
      this.root = this.root.putKeyValue(
          this.index.prop.f(newValue).toLowerCase(),
          newValue,
          this.index.compare,
          this.index.dedup,
          this.selectCount > 0);
    },

    function remove(value) {
      this.root = this.root.removeKeyValue(
          this.index.prop.f(value).toLowerCase(),
          value,
          this.index.compare,
          this.selectCount > 0,
          this.index.nullNode);
    },

    /**
     * Do not optimize bulkload
     **/
    function bulkLoad(a) {
      a = a.array || a;
      this.root = this.index.nullNode;
      for ( var i = 0 ; i < a.length ; i++ ) {
        this.put(a[i]);
      }
    }
  ]
});


/** An Index for storing multi-valued properties. **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'SetIndex',
  extends: 'foam.dao.index.TreeIndex',
});


foam.CLASS({
  package: 'foam.dao.index',
  name: 'SetIndexNode',
  extends: 'foam.dao.index.TreeIndexNode',

  methods: [
    // TODO: see if this can be done some other way
    function dedup() {
      // NOP, not safe to do here
    },

    /**
     * Do not optimize bulkload to SetIndex
     **/
    function bulkLoad(a) {
      a = a.array || a;
      this.root = this.index.nullNode;
      for ( var i = 0 ; i < a.length ; i++ ) {
        this.put(a[i]);
      }
    },

    function put(newValue) {
      var a = this.index.prop.f(newValue);

      if ( a.length ) {
        for ( var i = 0 ; i < a.length ; i++ ) {
          this.root = this.root.putKeyValue(
              a[i],
              newValue,
              this.index.compare,
              this.index.dedup);
        }
      } else {
        this.root = this.root.putKeyValue('', newValue, this.index.compare, this.index.dedup);
      }
    },

    function remove(value) {
      var a = this.index.prop.f(value);

      if ( a.length ) {
        for ( var i = 0 ; i < a.length ; i++ ) {
          this.root = this.root.removeKeyValue(a[i], value, this.index.compare, this.index.nullNode);
        }
      } else {
        this.root = this.root.removeKeyValue('', value, this.index.compare, this.index.nullNode);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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


/** An Index which adds other indices as needed. **/
foam.CLASS({
  package: 'foam.dao.index',
  name: 'AutoIndex',
  extends: 'foam.dao.index.ProxyIndex',

  requires: [
    'foam.core.Property',
    'foam.dao.index.NoPlan',
    'foam.dao.index.CustomPlan',
    'foam.mlang.predicate.And',
    'foam.mlang.predicate.Or',
    'foam.dao.index.AltIndex',
    'foam.dao.index.ValueIndex',
    'foam.mlang.predicate.True',
    'foam.mlang.predicate.False',
  ],

  constants: {
    /** Maximum cost for a plan which is good enough to not bother looking at the rest. */
    GOOD_ENOUGH_PLAN: 20
  },

  properties: [
    {
      /** Used to create the delegate ID index for new instances of AutoIndex */
      name: 'idIndex',
      required: true
    },
    {
      name: 'delegate',
      factory: function() {
        return this.AltIndex.create({ delegates: [ this.idIndex ] });
      }
    }
  ],

  methods: [
    function estimate(size, sink, skip, limit, order, predicate) {
      return this.delegate.estimate(size, sink, skip, limit, order, predicate);
    },

    function toPrettyString(indent) {
      var ret = '';
      ret = '  '.repeat(indent) + 'Auto(' + this.$UID + ')\n';
      ret += this.delegate.toPrettyString(indent + 1);
      return ret;
    }

  ]
});


foam.CLASS({
  package: 'foam.dao.index',
  name: 'AutoIndexNode',
  extends: 'foam.dao.index.ProxyIndexNode',

  methods: [
    function addPropertyIndex(prop, root) {
      this.addIndex(prop.toIndex(this.index.cls_.create({
        idIndex: this.index.idIndex
      })), root);
    },

    function addIndex(index, root) {
      this.delegate.addIndex(index, root);
    },

    // TODO: mlang comparators should support input collection for
    //   index-building cases like this
    function plan(sink, skip, limit, order, predicate, root) {
      // NOTE: Using the existing index's plan as its cost when comparing
      //  against estimates is bad. An optimistic estimate from an index
      //  will cause it to always appear better than its real world
      //  performance, leading AutoIndex to keep creating new instances
      //  of the offending index. Comparing estimates to estimates is much
      //  more consistent and allows estimate() to be arbitrarily bad
      //  as long as it is indicative of relative performance of each
      //  index type.
      var existingPlan = this.delegate.plan(sink, skip, limit, order, predicate, root);
      var thisSize = this.size();

      // No need to try to auto-index if:
      //  - The existing plan is better than scanning already TODO: how much better?
      //  - We are too small to matter
      //  - There are no order/predicate constraints to optimize for
      if ( existingPlan.cost < thisSize ||
           thisSize < this.index.GOOD_ENOUGH_PLAN ||
           ! order &&
           ( ! predicate ||
             this.index.True.isInstance(predicate) ||
             this.index.False.isInstance(predicate)
           )
      ) {
        return existingPlan;
      }

      // add autoindex overhead
      existingPlan.cost += 10;

      var ARBITRARY_INDEX_CREATE_FACTOR = 1.5;
      var ARBITRARY_INDEX_CREATE_CONSTANT = 20;

      var self = this;
      var newIndex;

      var bestEstimate = this.delegate.index.estimate(this.delegate.size(), sink, skip, limit, order, predicate);
//console.log(self.$UID, "AutoEst OLD:", bestEstimate, this.delegate.toString().substring(0,20), this.size());
      if ( bestEstimate < this.index.GOOD_ENOUGH_PLAN ) {
        return existingPlan;
      }

      // Base planned cost on the old cost for the plan, to avoid underestimating and making this
      //  index build look too good
      var existingEstimate = bestEstimate;
      var idIndex = this.index.idIndex;

      if ( predicate ) {
        var candidate = predicate.toIndex(
          this.index.cls_.create({ idIndex: idIndex }), 1); // depth 1
        if ( candidate ) {
          var candidateEst = candidate.estimate(this.delegate.size(), sink,
            skip, limit, order, predicate)
            * ARBITRARY_INDEX_CREATE_FACTOR
            + ARBITRARY_INDEX_CREATE_CONSTANT;

//console.log(self.$UID, "AutoEst PRD:", candidateEst, candidate.toString().substring(0,20));
          //TODO: must beat by factor of X? or constant?
          if ( bestEstimate > candidateEst ) {
            newIndex = candidate;
            bestEstimate = candidateEst;
          }
        }
      }

      //  The order index.estimate gets the order AND predicate,
      //   so the predicate might make this index worse
      if ( order ) {
        var candidate = order.toIndex(
          this.index.cls_.create({ idIndex: idIndex }), 1); // depth 1
        if ( candidate ) {
          var candidateEst = candidate.estimate(this.delegate.size(), sink,
            skip, limit, order, predicate)
            * ARBITRARY_INDEX_CREATE_FACTOR
            + ARBITRARY_INDEX_CREATE_CONSTANT;
//console.log(self.$UID, "AutoEst ORD:", candidateEst, candidate.toString().substring(0,20));
          if ( bestEstimate > candidateEst ) {
            newIndex = candidate;
            bestEstimate = candidateEst;
          }
        }
      }


      if ( newIndex ) {
        // Since estimates are only valid compared to other estimates, find the ratio
        //  of our existing index's estimate to our new estimate, and apply that ratio
        //  to the actual cost of the old plan to determine our new index's assumed cost.
        var existingPlanCost = existingPlan.cost;
        var estimateRatio = bestEstimate / existingEstimate;

        return this.index.CustomPlan.create({
          cost: existingPlanCost * estimateRatio,
          customExecute: function autoIndexAdd(apromise, asink, askip, alimit, aorder, apredicate) {

console.log(self.$UID, "BUILDING INDEX", existingPlanCost, estimateRatio, this.cost, predicate && predicate.toString());
//console.log(newIndex.toPrettyString(0));
//console.log(self.$UID, "ROOT          ");
//console.log(root.index.toPrettyString(0));

            self.addIndex(newIndex, root);
            // Avoid a recursive call by hitting our delegate.
            // It should pick the new optimal index.
            self.delegate
              .plan(sink, skip, limit, order, predicate, root)
              .execute(apromise, asink, askip, alimit, aorder, apredicate);
          },
          customToString: function() { return 'AutoIndexAdd cost=' + this.cost + ', ' + newIndex.cls_.name; }
        });
      } else {
        return existingPlan;
      }
    },

    function toString() {
      return 'AutoIndex(' + (this.index || this).delegate.toString() + ')';
    },

  ]
});

/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'MDAO',
  label: 'Indexed DAO',
  extends: 'foam.dao.AbstractDAO',

  documentation: 'Indexed in-Memory DAO.',

  requires: [
    'foam.dao.ArraySink',
    'foam.dao.ExternalException',
    'foam.dao.InternalException',
    'foam.dao.InvalidArgumentException',
    'foam.dao.ObjectNotFoundException',
    'foam.dao.index.AltIndex',
    'foam.dao.index.AutoIndex',
    'foam.dao.index.SetIndex',
    'foam.dao.index.TreeIndex',
    'foam.dao.index.ValueIndex',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.True',
    'foam.mlang.predicate.Or',
    'foam.mlang.sink.Explain',
    'foam.dao.index.MergePlan'
  ],

  properties: [
    {
      class: 'Class',
      name:  'of',
      required: true,
      postSet: function() {
        foam.assert(this.of.ID, "MDAO.of must be assigned a FOAM Class " +
          "with an 'id' Property or 'ids' array specified. Missing id in " +
          "class: " + ( this.of && this.of.id ));
      }
    },
    {
      class: 'Boolean',
      name: 'autoIndex'
    },
    {
      name: 'idIndex',
      transient: true
    },
    {
      /** The root IndexNode of our index. */
      name: 'index',
      transient: true
    }
  ],

  methods: [
    function init() {
      // adds the primary key(s) as an index, and stores it for fast find().
      this.addPropertyIndex();
      this.idIndex = this.index;

      if ( this.autoIndex ) {
        this.addIndex(this.AutoIndex.create({ idIndex: this.idIndex.index }));
      }
    },

    /**
     * Add a non-unique index
     * args: one or more properties
     **/
    function addPropertyIndex() {
      var props = Array.from(arguments);

      // Add ID to make each sure the object is uniquely identified
      props.push(this.of.ID);

      return this.addUniqueIndex_.apply(this, props);
    },

    /**
     * Add a unique index
     * args: one or more properties
     * @private
     **/
    function addUniqueIndex_() {
      var index = this.ValueIndex.create();

      for ( var i = arguments.length-1 ; i >= 0 ; i-- ) {
        var prop = arguments[i];

        // Pass previous index as the sub-index of the next level up.
        // (we are working from leaf-most index up to root index in the list)
        index = prop.toIndex(index);
      }

      return this.addIndex(index);
    },

    function addIndex(index) {
      if ( ! this.index ) {
        this.index = index.createNode();
        return this;
      }

      // Upgrade single Index to an AltIndex if required.
      if ( ! this.AltIndex.isInstance(this.index.index) ) {
        this.index = this.AltIndex.create({
          delegates: [ this.index.index ] // create factory
        }).createNode({
          delegates: [ this.index ] // create an instance
        });
      }

      this.index.addIndex(index, this.index);

      return this;
    },

    /**
     * Bulk load data from another DAO.
     * Any data already loaded into this DAO will be lost.
     * @param sink (optional) eof is called when loading is complete.
     **/
    function bulkLoad(dao) {
      var self = this;
      var sink = self.ArraySink.create();
      return dao.select(sink).then(function() {
        var a = sink.array;
        self.index.bulkLoad(a);
        for ( var i = 0; i < a.length; ++i ) {
          var obj = a[i];
        }
      });
    },

    function put_(x, obj) {
      var oldValue = this.findSync_(obj.id);
      if ( oldValue ) {
        this.index.remove(oldValue);
      }
      this.index.put(obj);
      this.pub('on', 'put', obj);
      return Promise.resolve(obj);
    },

    function find_(x, objOrKey) {
      if ( objOrKey === undefined ) {
        return Promise.reject(this.InvalidArgumentException.create({
          message: '"key" cannot be undefined/null'
        }));
      }

      return Promise.resolve(this.findSync_(
          this.of.isInstance(objOrKey) ? objOrKey.id : objOrKey));
    },

    /** internal, synchronous version of find, does not throw */
    function findSync_(key) {
      var index = this.idIndex;
      index = index.get(key);

      if ( index && index.get() ) return index.get();

      return null;
    },

    function remove_(x, obj) {
      if ( ! obj || obj.id === undefined ) {
        return Promise.reject(this.ExternalException.create({ id: 'no_id' })); // TODO: err
      }

      var id   = obj.id;
      var self = this;

      var found = this.findSync_(id);
      if ( found ) {
        self.index.remove(found);
        self.pub('on', 'remove', found);
      }

      return Promise.resolve();
    },

    function removeAll_(x, skip, limit, order, predicate) {
      if ( ! predicate ) predicate = this.True.create();
      var self = this;
      return self.where(predicate).select(self.ArraySink.create()).then(
        function(sink) {
          var a = sink.array;
          for ( var i = 0 ; i < a.length ; i++ ) {
            self.index.remove(a[i]);
            self.pub('on', 'remove', a[i]);
          }
          return Promise.resolve();
        }
      );
    },

    function select_(x, sink, skip, limit, order, predicate) {
      sink = sink || this.ArraySink.create();
      var plan;
//console.log("----select");
      if ( this.Explain.isInstance(sink) ) {
        plan = this.index.plan(sink.arg1, skip, limit, order, predicate, this.index);
        sink.plan = 'cost: ' + plan.cost + ', ' + plan.toString();
        sink && sink.eof && sink.eof();
        return Promise.resolve(sink);
      }

      predicate = predicate && predicate.toDisjunctiveNormalForm();
      if ( ! predicate || ! this.Or.isInstance(predicate) ) {
        plan = this.index.plan(sink, skip, limit, order, predicate, this.index);
      } else {
        plan = this.planForOr(sink, skip, limit, order, predicate);
      }

      var promise = [Promise.resolve()];
      plan.execute(promise, sink, skip, limit, order, predicate);
      return promise[0].then(
        function() {
          sink && sink.eof && sink.eof();
          return Promise.resolve(sink);
        },
        function(err) {
          return Promise.reject(err);
        }
      );
    },

    function planForOr(sink, skip, limit, order, predicate) {
      // if there's a limit, add skip to make sure we get enough results
      //   from each subquery. Our sink will throw out the extra results
      //   after sorting.
      var subLimit = ( limit ? limit + ( skip ? skip : 0 ) : undefined );

      // This is an instance of OR, break up into separate queries
      var args = predicate.args;
      var plans = [];
      for ( var i = 0; i < args.length; i++ ) {
        // NOTE: we pass sink here, but it's not going to be the one eventually
        // used.
        plans.push(
          this.index.plan(sink, undefined, subLimit, order, args[i], this.index)
        );
      }

      return this.MergePlan.create({ of: this.of, subPlans: plans, predicates: args });
    },

    function toString() {
      return 'MDAO(' + this.cls_.name + ',' + this.index + ')';
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ArrayDAO',
  extends: 'foam.dao.AbstractDAO',

  documentation: 'DAO implementation backed by an array.',

  requires: [
    'foam.dao.ArraySink',
    'foam.mlang.predicate.True'
  ],

  properties: [
    {
      class: 'Class',
      name: 'of',
      factory: function() {
        if ( this.array.length === 0 ) return this.lookup('foam.core.FObject');
        return null;
      }
    },
    {
      name: 'array',
      factory: function() { return []; }
    }
  ],

  methods: [
    function put_(x, obj) {
      for ( var i = 0 ; i < this.array.length ; i++ ) {
        if ( obj.ID.compare(obj, this.array[i]) === 0 ) {
          this.array[i] = obj;
          break;
        }
      }

      if ( i == this.array.length ) this.array.push(obj);
      this.on.put.pub(obj);

      return Promise.resolve(obj);
    },

    function remove_(x, obj) {
      for ( var i = 0 ; i < this.array.length ; i++ ) {
        if ( foam.util.equals(obj.id, this.array[i].id) ) {
          var o2 = this.array.splice(i, 1)[0];
          this.on.remove.pub(o2);
          break;
        }
      }

      return Promise.resolve();
    },

    function select_(x, sink, skip, limit, order, predicate) {
      var resultSink = sink || this.ArraySink.create();

      sink = this.decorateSink_(resultSink, skip, limit, order, predicate);

      var detached = false;
      var sub = foam.core.FObject.create();
      sub.onDetach(function() { detached = true; });

      var self = this;

      return new Promise(function(resolve, reject) {
        for ( var i = 0 ; i < self.array.length ; i++ ) {
          if ( detached ) break;

          sink.put(self.array[i], sub);
        }

        sink.eof();

        resolve(resultSink);
      });
    },

    function removeAll_(x, skip, limit, order, predicate) {
      predicate = predicate || this.True.create();
      skip = skip || 0;
      limit = foam.Number.isInstance(limit) ? limit : Number.MAX_VALUE;

      for ( var i = 0; i < this.array.length && limit > 0; i++ ) {
        if ( predicate.f(this.array[i]) ) {
          if ( skip > 0 ) {
            skip--;
            continue;
          }
          var obj = this.array.splice(i, 1)[0];
          i--;
          limit--;
          this.on.remove.pub(obj);
        }
      }

      return Promise.resolve();
    },

    function find_(x, key) {
      var id = this.of.isInstance(key) ? key.id : key;
      for ( var i = 0 ; i < this.array.length ; i++ ) {
        if ( foam.util.equals(id, this.array[i].id) ) {
          return Promise.resolve(this.array[i]);
        }
      }

      return Promise.resolve(null);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'TimestampDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'DAO decorator that sets the current time on each put() object, provided not already set. By default, the .id proeprty is set.',

  properties: [
    {
      /**
        The property of incoming objects to set.
      */
      class: 'String',
      name: 'property',
      value: 'id'
    }
  ],

  methods: [
    /** For each put() object, set the timestamp if .property is not
      set for that object. */
    function put_(x, obj) {
      if ( ! obj.hasOwnProperty(this.property) ) obj[this.property] = this.nextTimestamp();
      return this.delegate.put_(x, obj);
    },

    /** Generates a timestamp. Override to change the way timestamps are
      created. */
    function nextTimestamp() {
      return Date.now();
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'AdapterDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: `DAO for adapting between "of" input type and "to" delegate
      type. I.e., accept put(<instance-of-"of">), and
      this.delegate.of === this.to.`,

  requires: [ 'foam.dao.ArraySink' ],

  classes: [
    {
      name: 'AdapterSink',
      extends: 'foam.dao.ProxySink',

      properties: [
        {
          class: 'Function',
          name: 'adapt',
          documentation: `"adapt(o)" adapts input to type expected by
              "delegate" sink.`,
          required: true
        }
      ],

      methods: [
        function put(o, sub) {
          this.delegate.put(this.adapt(o), sub);
        },
        function remove(o, sub) {
          this.delegate.remove(this.adapt(o), sub);
        }
      ]
    }
  ],

  properties: [
    {
      name: 'delegate',
      postSet: function(old, nu) {
        if ( ! nu ) return;
        foam.assert(
            nu.of === this.to,
            'Expect AdapterDAO.delegate.of === AdapterDAO.to');
      }
    },
    {
      class: 'Class',
      name: 'to',
      documentation: '"of" of delegate.'
    },
    {
      name: 'Function',
      name: 'adaptToDelegate',
      documentation: `Adapt this's "of" type to "delegate"'s "of" type.`,
      value: function(ctx, obj) {
        if ( ! obj ) return obj;
        if ( ! this.of.isInstance(obj) ) return obj;
        return this.to.create(obj, ctx || this.__subContext__);
      }
    },
    {
      name: 'Function',
      name: 'adaptFromDelegate',
      documentation: `Adapt "delegate"'s "of" type this's "of" type.`,
      value: function(ctx, obj) {
        if ( ! obj ) return obj;
        if ( ! this.to.isInstance(obj) ) return obj;
        return this.of.create(obj, ctx || this.__subContext__);
      }
    },
    {
      name: 'Function',
      name: 'adaptOrder',
      documentation: 'Adapt select() order to order understood by "delegate".',
      // TODO(markdittmer): Smarter default?
      value: function(order) { return order; }
    },
    {
      name: 'Function',
      name: 'adaptPredicate',
      documentation: `Adapt select() predicate to predicate understood by
          "delegate".`,
      // TODO(markdittmer): Smarter default?
      value: function(predicate) { return predicate; }
    }
  ],

  methods: [
    function put_(ctx, obj) {
      return this.delegate.put_(ctx, this.adaptToDelegate(ctx, obj)).
        then(this.adaptFromDelegate.bind(this, ctx));
    },

    function remove_(ctx, obj) {
      return this.delegate.remove_(ctx, this.adaptToDelegate(ctx, obj)).
        then(this.adaptFromDelegate.bind(this, ctx));
    },

    function find_(ctx, objOrId) {
      return this.delegate.find_(ctx, this.adaptToDelegate(ctx, objOrId)).
        then(this.adaptFromDelegate.bind(this, ctx));
    },

    function select_(ctx, sink, skip, limit, order, predicate) {
      sink = sink || this.ArraySink.create();
      var adapterSink = this.AdapterSink.create({
        delegate: sink,
        adapt: this.adaptFromDelegate.bind(this, ctx)
      });
      return this.delegate.select_(
              ctx, adapterSink, skip, limit,
              this.adaptOrder(order), this.adaptPredicate(predicate)).
          then(function() { return sink; });
    },

    function removeAll_(ctx, skip, limit, order, predicate) {
      return this.delegate.removeAll_(
          ctx, skip, limit,
          this.adaptOrder(order), this.adaptPredicate(predicate));
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'GUIDDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
    DAO Decorator that sets a property to a new random GUID (globally unique identifier) on put(), unless value already set.
    By default, the .id property is used.
    <p>
    Use a foam.dao.EasyDAO with guid:true to automatically set GUIDs. Set
    EasyDAO.seqProperty to the desired property name or use the default
    of 'id'.
  */},

  properties: [
    {
      /** The property to set with a random GUID value, if not already set
        on put() objects. */
      class: 'String',
      name: 'property',
      value: 'id'
    }
  ],

  methods: [
    /** Ensures all objects put() in have a unique id set.
      @param obj the object to process. */
    function put_(x, obj) {
      if ( ! obj.hasOwnProperty(this.property) ) {
        obj[this.property] = foam.uuid.randomGUID();
      }

      return this.delegate.put_(x, obj);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ReadOnlyDAO',
  extends: 'foam.dao.ProxyDAO',
  documentation: 'DAO decorator that throws errors on put and remove.',
  methods: [
    function put_(x, obj) {
      return Promise.reject('Cannot put into ReadOnlyDAO');
    },
    function remove_(x, obj) {
      return Promise.reject('Cannot remove from ReadOnlyDAO');
    },
    function removeAll() {
      return Promise.reject('Cannot removeAll from ReadOnlyDAO');
    },
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'StoreAndForwardDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: `Store-and-forward (i.e., store-and-retry) failed DAO
    operations. Useful for DAOs that may flake, but eventually succeed.`,


  requires: [ 'foam.dao.InternalException' ],

  classes: [
    {
      name: 'DAOOperation',

      properties: [
        {
          class: 'String',
          documentation: 'DAO method name associated with operation.',
          name: 'methodName',
        },
        {
          documentation: 'Arguments object associated with operation.',
          name: 'args',
        },
        {
          name: 'promise_',
          factory: function() {
            var self = this;
            var resolve;
            var reject;
            var promise = new Promise(function(res, rej) {
              resolve = res;
              reject = rej;
            });
            promise.resolveFunction_ = resolve;
            promise.rejectFunction_ = reject;
            return promise;
          }
        },
        {
          class: 'Function',
          name: 'resolve_',
          factory: function() {
            return this.promise_.resolveFunction_;
          }
        },
        {
          class: 'Function',
          name: 'reject_',
          factory: function() {
            return this.promise_.rejectFunction_;
          }
        }
      ],

      methods: [
        function getPromise() { return this.promise_; }
      ],

      listeners: [
        function resolve() { return this.resolve_.apply(this, arguments); },
        function reject() { return this.reject_.apply(this, arguments); }
      ]
    }
  ],

  properties: [
    {
      name: 'delegate',
      postSet: function(old, nu) {
        if ( this.isForwarding_ )
          this.warn('StoreAndForwardDAO: Delegate while flushing queue!');
        this.forward_();
      }
    },
    {
      class: 'Function',
      documentation: `Determine whether or not an error is sufficiently internal
        to the DAO that it's worth retrying the operation that yeilded the
        error. Default is to retry foam.dao.InternalException errors.`,
      name: 'shouldRetry',
      // TODO(markdittmer): These should be supported by function properties,
      // but they're not.
      /*
      returns: {
        documentation: 'Indicator: Should this error be retried?',
        typeName: 'Boolean',
      },
      args: [
        {
          documentation: 'The error thrown by the delegate DAO.',
          name: 'error',
          typeName: 'Error',
        },
      ],
      */
      value: function(error) {
        return this.InternalException.isInstance(error);
      }
    },
    {
      class: 'FObjectArray',
      of: 'FObject',
      // of: 'DAOOperation',
      documentation: 'Queue for incomplete DAO operations.',
      name: 'q_',
    },
    {
      class: 'Boolean',
      name: 'isForwarding_',
    },
  ],

  methods: [
    function put_() { return this.store_('put_', arguments); },
    function remove_() { return this.store_('remove_', arguments); },
    function find_() { return this.store_('find_', arguments); },
    function select_() { return this.store_('select_', arguments); },
    function removeAll_() { return this.store_('removeAll_', arguments); },

    function store_(methodName, args) {
      // Store DAO operations in order.
      var op = this.DAOOperation.create({
        methodName: methodName,
        args: args,
      });
      this.q_.push(op);
      // If no forwarding in progress then forward this op immediately.
      // Otherwise, in-progress forwarding will get to it eventually.
      if ( ! this.isForwarding_ ) this.forward_();
      // Return Promise associated with completing operation.
      return op.getPromise();
    },
    function forward_() {
      // Guard against flush-to-(no delegate) or attempt to flush empty queue.
      if ( ( ! this.delegate ) || this.q_.length === 0 ) {
        this.isForwarding_ = false;
        return;
      }

      this.isForwarding_ = true;

      var op = this.q_[0];
      this.delegate[op.methodName].apply(this.delegate, op.args)
          .then(this.onComplete.bind(this, op))
          .catch(this.onError.bind(this, op));
    }
  ],

  listeners: [
    {
      name: 'onQ',
      documentation: `Attempt to forward failed operations no more frequently
        than "mergeDelay"ms.`,
      isMerged: 'true',
      mergeDelay: 2000,
      code: function() {
        this.forward_();
      }
    },
    {
      name: 'onComplete',
      documentation: `Operation, "op", just completed successfully, yielding
        "result". Since order is presvered, "op" is at the head of "q_".
        Dequeue "op" and resolve its promise.`,
      code: function(op, result) {
        // Dequeue and resolve completed op; attempt to forward next op.
        this.q_.shift();
        op.resolve(result);
        this.forward_();
      }
    },
    {
      name: 'onError',
      documentation: `Operation, "op", failed, yielding "error". If it should be
        retried, tickle merged listener "onQ" to ensure that it is tried again
        later. Otherwise, discard it from "q_" and reject its promise.`,
      code: function(op, error) {
        // Trigger merged listener to initiate another forwarding attempt.
        if ( this.shouldRetry(error) ) {
          this.isForwarding_ = false;
          this.onQ();
          return;
        }

        // Thrown error not retryable:
        // Dequeue and reject op; attempt to forward next op.
        this.q_.shift();
        op.reject(error);
        this.forward_();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.dao',
  name: 'Journal',
  extends: 'foam.dao.Sink',

  methods: [
    function replay(dao) {}
  ]
});


if ( foam.isServer ) {
  foam.CLASS({
    package: 'foam.dao',
    name: 'NodeFileJournal',
    implements: ['foam.dao.Journal'],
    properties: [
      {
        class: 'Class',
        name: 'of',
        value: 'foam.core.FObject'
      },
      {
        name: 'fd',
        required: true
      },
      {
        name: 'offset',
        factory: function() {
          var stat = this.fs.fstatSync(this.fd);
          return stat.size;
        }
      },
      {
        name: 'fs',
        factory: function() { return require('fs'); }
      },
      {
        name: 'writePromise',
        value: Promise.resolve()
      }
    ],

    methods: [
      function put(obj) {
        return this.write_(Buffer.from(
            "put(foam.json.parse(" + foam.json.Storage.stringify(obj, this.of) +
              "));\n"));
      },

      function remove(obj) {
        return this.write_(Buffer.from(
            "remove(foam.json.parse(" +
              foam.json.Storage.stringify(obj, this.of) +
              "));\n"));
      },

      function write_(data) {
        var self = this;
        var offset = self.offset;
        self.offset += data.length;
        return self.writePromise = self.writePromise.then(function() {
          return new Promise(function(resolve, reject) {
            self.fs.write(
                self.fd, data, 0, data.length, offset,
                function(err, written, buffer) {
                  if ( err ) reject(err);
                  if ( written != data.length )
                    reject(new Error('foam.dao.NodeFileJournal: Incomplete write'));
                  resolve();
                });
          });
        });
      },

      function replay(dao) {
        var self = this;
        return new Promise(function(resolve, reject) {
          self.fs.readFile(self.fd, 'utf8', function(err, data_) {
            if ( err ) {
              reject(err);
              return;
            }

            var context = {
              put: function(o) { return dao.put(o); },
              remove: function(o) { return dao.remove(o); },
              foam: {
                json: {
                  parse: function(obj) {
                    return foam.json.parse(obj, self.of, dao.__context__);
                  }
                }
              }
            };

            with(context) eval(data_);

            resolve(dao);
          });
        });
      },
      function eof() {}
    ]
  });
}


foam.CLASS({
  package: 'foam.dao',
  name: 'JDAO',
  extends: 'foam.dao.PromisedDAO',

  properties: [
    'delegate',
    'journal',
    {
      name: 'promise',
      factory: function() {
        var self = this;
        return this.journal.replay(this.delegate).then(function(dao) {
          dao.listen(self.journal);
          return dao;
        });
      }
    },
    {
      name: 'synced',
      getter: function() {
        return Promise.all([ this.promise, this.journal.writePromise ]);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'Relationship',
  implements: [ { path: 'foam.mlang.Expressions', java: false } ],

  documentation: 'An Axiom for defining Relationships between models.',

  requires: [
    'foam.dao.RelationshipDAO',
    'foam.dao.ManyToManyRelationshipDAO',
    'foam.dao.ReadOnlyDAO',
  ],

  properties: [
    {
      name: 'id',
      hidden: true,
      transient: true,
      getter: function() {
        return this.package ? this.package + '.' + this.name : this.name;
      }
    },
    {
      name: 'package',
      // Default to sourceModel's package if not specified.
      factory: function() {
        return this.lookup(this.sourceModel).package;
      }
    },
    {
      name: 'name',
      class: 'String',
      transient: true,
      hidden: true,
      getter: function() {
        return this.lookup(this.sourceModel).name +
          this.lookup(this.targetModel).name + 'Relationship';
      }
    },
    'forwardName',
    {
      name: 'inverseName',
      class: 'String'
    },
    {
      name: 'cardinality',
      assertValue: function(value) {
        foam.assert(value === '1:*' || value === '*:*',
          'Supported cardinalities are 1:* and *:*');
      },
      value: '1:*'
    },
    {
      class: 'String',
      name: 'sourceModel'
    },
    {
      class: 'String',
      name: 'targetModel'
    },
    {
      class: 'FObjectArray',
      name: 'sourceProperties',
      of: 'foam.core.PropertyInfo',
      javaType: 'foam.core.PropertyInfo[]',
      adaptArrayElement: foam.core.Model.PROPERTIES.adaptArrayElement
    },
    {
      class: 'FObjectArray',
      name: 'targetProperties',
      of: 'foam.core.PropertyInfo',
      javaType: 'foam.core.PropertyInfo[]',
      adaptArrayElement: foam.core.Model.PROPERTIES.adaptArrayElement
    },
    {
      class: 'String',
      name: 'junctionModel',
      expression: function(sourceModel, targetModel) {
        return ( this.package ? this.package + '.' : '' ) + this.lookup(sourceModel).name + this.lookup(targetModel).name + 'Junction'; }
    },
    {
      class: 'String',
      name: 'sourceDAOKey',
      expression: function(sourceModel) {
        return foam.String.daoize(this.lookup(sourceModel).name);
      }
    },
    {
      class: 'String',
      name: 'targetDAOKey',
      expression: function(targetModel) {
        return foam.String.daoize(this.lookup(targetModel).name);
      }
    },
    {
      class: 'String',
      name: 'junctionDAOKey',
      expression: function(junctionModel) {
        return foam.String.daoize(this.lookup(junctionModel).name);
      }
    },
    {
      name: 'adaptTarget',
      factory: function() {
        var inverseName = this.inverseName;

        return function(source, target) {
          target[inverseName] = source.id;

          return target;
        }
      }
    },
    {
      class: 'Boolean',
      name: 'oneWay'
    },
    {
      class: 'Map',
      name: 'sourceProperty'
    },
    {
      class: 'Map',
      name: 'targetProperty'
    },
    /* FUTURE:
    {
      name: 'deleteStrategy'
      // prevent, cascade, orphan
    }
    */
  ],

  methods: [
    function init() {
      var sourceProps   = this.sourceProperties || [];
      var targetProps   = this.targetProperties || [];
      var cardinality   = this.cardinality;
      var forwardName   = this.forwardName;
      var inverseName   = this.inverseName;
      var relationship  = this;
      var sourceModel   = this.sourceModel;
      var targetModel   = this.targetModel;
      var junctionModel = this.junctionModel;
      var source        = this.lookup(sourceModel);
      var target        = this.lookup(targetModel);
      var junction      = this.lookup(junctionModel, true);

      var sourceDAOKey   = this.sourceDAOKey;
      var targetDAOKey   = this.targetDAOKey;

      if ( cardinality === '1:*' ) {
        if ( ! sourceProps.length ) {
          sourceProps = [
            foam.dao.DAOProperty.create({
              name: forwardName,
              cloneProperty: function(value, map) {},
              transient: true,
              expression: function(id) {
                return foam.dao.RelationshipDAO.create({
                  obj: this,
                  relationship: relationship
                }, this);
              },
            }).copyFrom(this.sourceProperty)
          ];
        }

        if ( ! targetProps.length ) {
          targetProps = [
            foam.core.Reference.create({
              name: inverseName,
              of: sourceModel,
              targetDAOKey: sourceDAOKey
            }).copyFrom(this.targetProperty)
          ];
        }
      } else { /* cardinality === '*.*' */
        if ( ! junction ) {
          var name = this.junctionModel.substring(
            this.junctionModel.lastIndexOf('.') + 1);
          var id = this.package + '.' + name;
          foam.CLASS({
            package: this.package,
            name: name,
            ids: [ 'sourceId', 'targetId' ],
            properties: [
              { name: 'sourceId', shortName: 's' },
              { name: 'targetId', shortName: 't' }
            ]
          });

          junction = this.lookup(this.junctionModel);
        }

        var junctionDAOKey = this.junctionDAOKey;

        if ( ! sourceProps.length ) {
          sourceProps = [
            foam.dao.RelationshipProperty.create({
              name: forwardName,
              cloneProperty: function(value, map) {},
              transient: true,
              expression: function(id) {
                return  foam.dao.RelationshipPropertyValue.create({
                  sourceId: id,
                  dao: foam.dao.ReadOnlyDAO.create({
                    delegate: foam.dao.ManyToManyRelationshipDAO.create({
                      delegate: this.__context__[targetDAOKey],
                      junctionProperty: junction.TARGET_ID,
                      junctionDAOKey: junctionDAOKey,
                      junctionKeyFactory: function(a) { return [id, a]; },
                      // junctionFactoryPreOrder: true, TODO: Tmp implementation for ManyToManyRelationshipDAO, replace with java lambda function
                      junctionCls: junction,
                      sourceKey: id,
                      sourceProperty: junction.SOURCE_ID,
                      targetProperty: target.ID
                    }, this)
                  }, this),
                  targetDAO: this.__context__[targetDAOKey],
                  junctionDAO: this.__context__[junctionDAOKey]
                }, this);
              },
            }).copyFrom(this.sourceProperty)
          ];
        }

        if ( ! targetProps.length ) {
          targetProps = [
            foam.dao.RelationshipProperty.create({
              name: inverseName,
              cloneProperty: function(value, map) {},
              transient: true,
              expression: function(id) {
                return  foam.dao.RelationshipPropertyValue.create({
                  targetId: id,
                  dao: foam.dao.ReadOnlyDAO.create({
                    delegate: foam.dao.ManyToManyRelationshipDAO.create({
                      delegate: this.__context__[sourceDAOKey],
                      junctionProperty: junction.SOURCE_ID,
                      junctionDAOKey: junctionDAOKey,
                      junctionKeyFactory: function(a) { return [a, id]; },
                      // junctionFactoryPreOrder: false, TODO: Tmp implementation for ManyToManyRelationshipDAO, replace with java lambda function
                      junctionCls: junction,
                      sourceKey: id,
                      sourceProperty: junction.TARGET_ID,
                      targetProperty: source.ID
                    }, this)
                  }, this),
                  targetDAO: this.__context__[sourceDAOKey],
                  junctionDAO: this.__context__[junctionDAOKey]
                }, this);
              },
            }).copyFrom(this.targetProperty)
          ];
        }
      }

      foam.assert(
        sourceProps.length === targetProps.length,
        'Relationship source/target property list length mismatch.');

      for ( var i = 0 ; i < sourceProps.length ; i++ ) {
        var sp = sourceProps[i];
        var tp = targetProps[i];

        if ( ! source.getAxiomByName(sp.name) ) {
          source.installAxiom(sp);
        }

        if ( ! this.oneWay && ! target.getAxiomByName(tp.name) ) {
          target.installAxiom(tp);
        }
      }

      /*
      if ( ! this.oneWay ) {
        sourceProperty.preSet = function(_, newValue) {
          if ( newValue ) {
            for ( var i = 0 ; i < sourceProps.length ; i++ ) {
              newValue[targetProps[i].name] = this[sourceProps[i]];
            }
          }
          return newValue;
        };
      }
      */
    },

    function targetQueryFromSource(obj) {
      var targetClass = this.lookup(this.targetModel);
      var name        = this.inverseName;
      var targetProp  = targetClass[foam.String.constantize(name)];

      if ( obj.id === undefined ) {
        this.warn('Attempted to read relationship from object with no id.');
        return this.FALSE;
      }

      return this.EQ(targetProp, obj.id);
    }
  ]
});


foam.LIB({
  name: 'foam',
  methods: [
    function RELATIONSHIP(m, opt_ctx) {
      var r = foam.dao.Relationship.create(m, opt_ctx);

      r.validate && r.validate();
      foam.package.registerClass(r);

      return r;
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'RelationshipPropertyValue',
  properties: [
    'sourceId',
    'targetId',
    {
      class: 'foam.dao.DAOProperty',
      name: 'dao'
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'junctionDAO'
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'targetDAO'
    },
  ],
  methods: [
    function add(obj) {
      var junction = this.junctionDAO.of.create({
        sourceId: this.sourceId || obj.id,
        targetId: this.targetId || obj.id
      });
      return this.junctionDAO.put(junction);
    },

    function remove(obj) {
      var junction = this.junctionDAO.of.create({
        sourceId: this.sourceId || obj.id,
        targetId: this.targetId || obj.id
      });
      return this.junctionDAO.remove(junction);
    }
  ],
});

foam.CLASS({
  package: 'foam.dao',
  name: 'RelationshipProperty',
  extends: 'foam.core.FObjectProperty',
  properties: [
    {
      name: 'of',
      value: 'foam.dao.RelationshipPropertyValue',
    },
    {
      name: 'view',
      value: { class: 'foam.comics.RelationshipView' },
    },
    {
      name: 'comparePropertyValues',
      documentation: `Relationships cannot be compared synchronously. Ignore
          them during synchronous comparison.`,
      value: function() { return 0; }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'RelationshipDAO',
  extends: 'foam.dao.FilteredDAO',

  documentation: 'Adapts a DAO based on a Relationship.',

  properties: [
    {
      name: 'obj',
      class: 'FObjectProperty'
    },
    {
      name: 'relationship',
      class: 'FObjectProperty',
      of: 'foam.dao.Relationship',
      required: true
    },
    {
      name: 'predicate',
      getter: function() {
        return this.relationship.targetQueryFromSource(this.obj);
      }
    },
    {
      name: 'delegate',
      factory: function() {
        var key      = this.relationship.targetDAOKey;
        var delegate = this.__context__[key];

        foam.assert(delegate, 'Missing relationship DAO:', key);

        return delegate;
      }
    }
  ],

  methods: [
    function put_(x, obj) {
      return this.SUPER(x, this.relationship.adaptTarget(this.obj, obj));
    },
    function clone() {
      // Prevent cloneing
      return this;
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ManyToManyRelationshipDAO',
  extends: 'foam.dao.ProxyDAO',

  implements: [ { path: 'foam.mlang.Expressions', java: false } ],

  documentation: 'Adapts a DAO based on a *:* Relationship.',

  properties: [
    {
      class: 'foam.core.Property',
      name: 'junctionProperty'
    },
    {
      class: 'foam.core.String',
      name: 'junctionDAOKey'
    },
    'junctionCls',
    {
      class: 'foam.core.Property',
      name: 'sourceKey'
    },
    {
      class: 'foam.core.Property',
      name: 'targetProperty'
    },
    {
      class: 'foam.core.Property',
      name: 'sourceProperty'
    },
    'junctionKeyFactory',
    {
      class: 'foam.core.Boolean',
      name: 'junctionFactoryPreOrder'
    },
    {
      name: 'junctionDAO',
      getter: function() {
        return this.__context__[this.junctionDAOKey];
      }
    }
  ],

  methods: [
    function find_(x, key) {
      var id = foam.core.FObject.isInstance(key) ? key.id : key;
      var self = this;
      return self.junctionDAO.find_(x, self.junctionKeyFactory(id)).then(function(a) {
        return a && self.delegate.find_(x, id);
      });
    },
    function select_(x, sink, skip, limit, order, predicate) {
      var self = this;

      return self.junctionDAO.
        where(self.EQ(self.sourceProperty, self.sourceKey)).
        select(self.MAP(self.junctionProperty)).then(function(map) {
          return self.delegate.select_(x, sink, skip, limit, order, self.AND(
            predicate || self.TRUE,
            self.IN(self.targetProperty, map.delegate.array)));
        });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao.grid',
  name: 'ManyToManyGridRecord',

  properties: [
    {
      name: 'id',
      getter: function() { return this.target.id; }
    },
    {
      class: 'FObjectProperty',
      name: 'target',
      required: true
    },
    {
      class: 'Array',
      of: 'Boolean',
      name: 'data'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao.grid',
  name: 'ManyToManyGridDAO',
  extends: 'foam.dao.ReadOnlyDAO',
  implements: [ 'foam.mlang.Expressions' ],

  documentation: `A DAO that delegates to the "target" side of a many-to-many
      relationship, and maintains a reference to a "sources" DAO of "source"
      objects. This DAO is "of":

      { target, data: Boolean[](is "target" related to ith source) }.

      The DAO is designed for adapting to table views of a relationship grid.
      The preprocessing is implemented at the DAO layer so that it can easily
      pushed off the UI thread.`,

  requires: [ 'foam.dao.ArraySink' ],

  imports: [ 'relationship' ],

  properties: [
    {
      name: 'delegate',
      factory: function() {
        return this.__context__[this.relationship.targetDAOKey];
      }
    },
    {
      class: 'Class',
      name: 'junctionCls',
      factory: function() {
        return this.lookup(this.relationship.junctionModel);
      }
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'sourceDAO',
      factory: function() {
        return this.__context__[this.relationship.sourceDAOKey];
      }
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'junctionDAO',
      factory: function() {
        return this.__context__[this.relationship.junctionDAOKey];
      }
    },
    {
      class: 'String',
      name: 'gridClsId',
      factory: function() {
        return this.relationship.junctionModel + 'Grid';
      }
    },
    {
      class: 'Class',
      name: 'of',
      value: 'foam.dao.grid.ManyToManyGridRecord'
    }
  ],

  methods: [
    function find_(x, o) {
      return this.delegate.find_(x, o).
          then(this.addSourcesToTarget.bind(this, x));
    },
    function select_(x, sink, skip, limit, order, predicate) {
      sink = sink || this.ArraySink.create();
      return this.delegate.
          select_(x, this.ArraySink.create(), skip, limit, order, predicate).
          then(this.addSourcesToTargets.bind(this, x, sink)).
          then(function() { sink && sink.eof && sink.eof(); return sink; });
    }
  ],

  listeners: [
    function addSourcesToTarget(x, target) {
      var Cls = this.of;
      return this.sourceDAO.select().
          then(this.getDataForTarget.bind(this, target)).
          then(function(data) {
            return Cls.create({ target: target, data: data }, x);
          });
    },

    function addSourcesToTargets(x, sink, localSink) {
      var put = sink.put.bind(sink);
      var array = localSink.array;
      var promises = new Array(array.length);
      for ( var i = 0; i < array.length; i++ ) {
        promises.push(this.addSourcesToTarget(x, array[i]).then(put));
      }
      return Promise.all(promises);
    },

    function getDataForTarget(target, sink) {
      var sources = sink.array;
      return Promise.all(
          sources.map(this.getDatumForTarget.bind(this, target)));
    },
    
    function getDatumForTarget(target, source) {
      return this.junctionDAO.where(this.AND(
          this.EQ(this.junctionCls.SOURCE_ID, source.id),
          this.EQ(this.junctionCls.TARGET_ID, target.id))).select().
          then(function(arraySink) { return !! arraySink.array[0]; });
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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

/**
  LazyCacheDAO can cache successful results from find() and select() on its
  delegate. It only updates after new queries come in, and returns cached
  results immediately, even if new results arrive from the delegate.
  listen or pipe from this DAO to stay up to date.
*/
foam.CLASS({
  package: 'foam.dao',
  name: 'LazyCacheDAO',
  extends: 'foam.dao.ProxyDAO',

  implements: [ 'foam.mlang.Expressions' ],

  requires: [
    'foam.dao.ArraySink',
    'foam.dao.DAOSink'
  ],

  classes: [
    {
      name: 'AnySink',
      properties: [ { class: 'Boolean', name: 'hasAny' } ],
      methods: [ function put() { this.hasAny = true; }, function eof() {} ]
    }
  ],

  properties: [
    {
      /** Set to the desired cache, such as a foam.dao.MDAO. */
      name: 'cache',
      required: true
    },
    {
      /**
        TODO: This is attempting to express a link between two other properties,
        and a side-effect (subscription) is what is desired, not a value. Also
        the cacheSync_ prop needs to be tickled to ensure the link exists.
        Change this to define an expression that defines a run-time 'thing'
        to be done between properties, and allows cleanup when re-evaluating.
        @private
      */
      name: 'cacheSync_',
      expression: function(delegate, cache) {
        var s = this.cacheSyncSub_ = delegate.on.remove.sub(
          function(sub_, on_, remove_, obj) {
            cache.remove(obj);
          }
        );
        return s;
      }
    },
    {
      /** Stores cleanup info for the cache sychronization subscription.
        @private */
      name: 'cacheSyncSub_',
      postSet: function(old, nu) {
        if ( old && old.detach ) old.detach();
      }
    },
    {
      /**
        When true, makes a network call in the background to
        update the record, even on a cache hit.
      */
      class: 'Boolean',
      name: 'refreshOnCacheHit',
      value: false,
    },
    {
      /**
        Whether to populate the cache on select().
      */
      class: 'Boolean',
      name: 'cacheOnSelect',
      value: false
    },
    {
      /**
        Time in milliseconds before we consider the delegate
        results to be stale for a particular predicate and will issue a new
        select.
      */
      class: 'Int',
      name: 'staleTimeout',
      value: 500,
      //units: 'ms',
    },
    {
      /**
        The active promises for remote finds in progress, for re-use
        by subsequent finds made before the previous resolves.
        @private
      */
      name: 'finds_',
      hidden: true,
      transient: true,
      factory: function() { return {}; }
    },
    {
      /**
        The active promises for remote selects in progress, for re-use
        by subsequent selects made before the previous resolves.
        @private
      */
      name: 'selects_',
      hidden: true,
      transient: true,
      factory: function() { return {}; }
    },
    {
      /**
        Generates an internal key to uniquely identify a select.
        @private
      */
      class: 'Function',
      name: 'selectKey',
      value: function(sink, skip, limit, order, predicate /*string*/) {
        return ( predicate && predicate.toString() ) || "" + "," +
          limit + "," + skip + "," + ( order && order.toString() ) || "";
      }
    }
  ],

  methods: [
    /** Ensures removal from both cache and delegate before resolving. */
    function remove_(x, obj) {
      var self = this;
      return self.cache.remove_(x, obj).then(function() {
        return self.delegate.remove_(x, obj);
      });
    },

    /**
      Explicitly update cache, else caller will query stale data if
      the staleTimeout is large
    */
    function put_(x, obj) {
      var self = this;
      return self.delegate.put_(x, obj).then(function(o) {
        return self.cache.put_(x, o);
      });
    },

    /**
      Executes the find on the cache first, and if it fails triggers an
      update from the delegate.
    */
    function find_(x, id) {
      var self = this;
      // TODO: Express this better.
      // Assigning to unused variable to keep Closure happy.
      var _ = self.cacheSync_; // ensures listeners are set
      // TODO: stale timeout on find?

      // Check the in-flight remote finds_
      if ( self.finds_[id] ) {
        // Attach myself if there's one for this id, since the cache must
        // have already failed
        return self.finds_[id];
      } else {
        // Try the cache
        return self.cache.find_(x, id).then(

          function (val) {
            // Cache hit, but create background request if required
            if ( val ) {
              if ( self.refreshOnCacheHit ) {
                // Don't record in finds_, since we don't want anyone waiting for it
                self.delegate.find_(x, id).then(function (val) {
                  val && self.cache.put_(x, val);
                });
              }
              return val;
            }
            // Failed to find in cache, so try remote.
            // Another request may have come in the meantime, so check again for
            // an in-flight find for this ID.
            if ( ! self.finds_[id] ) {
              self.finds_[id] = self.delegate.find_(x, id);
              // we created the remote request, so clean up finds_ later
              var errorHandler = function(err) {
                delete self.finds_[id]; // in error case, still clean up
                throw err;
              };

              return self.finds_[id].then(function (val) {
                // once the cache is updated, remove this stale promise
                if ( ! val ) {
                  delete self.finds_[id];
                  return null;
                }

                return self.cache.put_(x, val).then(function(val) {
                  delete self.finds_[id];
                  return val;
                }, errorHandler);
              }, errorHandler);
            } else {
              // piggyback on an existing update request, cleanup already handled
              return self.finds_[id];
            }
          }
        );
      }
    },

    /**
      Executes the select on the cache first, and if it fails triggers an
      update from the delegate.
      <p>
      If .cacheOnSelect is false, the select()
      bypasses the cache and goes directly to the delegate.
    */
    function select_(x, sink, skip, limit, order, predicate) {
      if ( ! this.cacheOnSelect ) {
        return this.SUPER(x, sink, skip, limit, order, predicate);
      }
      sink = sink || this.ArraySink.create();
      var key = this.selectKey(sink, skip, limit, order, predicate);
      var self = this;
      // Assigning to unused variable to keep Closure happy.
      // TODO: Express this better.
      var _ = self.cacheSync_; // Ensures listeners are set.

      // Check for missing or stale remote request. If needed, immediately
      // start a new one that will trigger a reset of this when complete.
      // TODO: Entries are retained for every query, never deleted. Is that ok?
      var entry = self.selects_[key];
      if ( ! entry || ( Date.now() - entry.time ) > self.staleTimeout ) {
        self.selects_[key] = entry = {
          time: Date.now(),
          promise:
            self.delegate.select_(x, self.DAOSink.create({ dao: self.cache }), skip, limit, order, predicate)
              .then(function(cache) {
                self.onCacheUpdate();
                return cache;
              })
        };
      }

      function readFromCache() {
        return self.cache.select_(x, sink, skip, limit, order, predicate);
      }

      // If anything exists in the cache for this query, return it (updates
      // may arrive later and trigger a reset notification). If nothing,
      // wait on the pending cache update.
      return self.cache.select_(
          x, this.AnySink.create(), skip, 1, order, predicate)
              .then(function(hasAny) {
                if ( hasAny.hasAny ) {
                  return readFromCache();
                } else {
                  return entry.promise.then(readFromCache);
                }
              });
    }
  ],

  listeners: [
    {
      /* replaces self.pub('on', 'reset') in select promise select
         which was triggering repeated/cyclic onDAOUpdate in caller */
      name: 'onCacheUpdate',
      isMerged: true,
      code: function() {
        this.pub('on', 'reset');
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
  CachingDAO will do all queries from its fast cache. Writes
  are sent through to the src and cached before resolving any put() or
  remove().
  <p>
  You can use a foam.dao.EasyDAO with caching:true to use caching
  automatically with an indexed MDAO cache.
  <p>
  The cache maintains full copy of the src, but the src is considered the
  source of truth.
*/
foam.CLASS({
  package: 'foam.dao',
  name: 'CachingDAO',
  extends: 'foam.dao.ProxyDAO',

  requires: [
    'foam.dao.PromisedDAO',
    'foam.dao.DAOSink',
  ],

  properties: [
    {
      /** The source DAO on which to add caching. Writes go straight
        to the src, and cache is updated to match.
      */
      class: 'foam.dao.DAOProperty',
      name: 'src'
    },
    {
      /** The cache to read items quickly. Cache contains a complete
        copy of src. */
      name: 'cache',
    },
    {
      /**
        Set .cache rather than using delegate directly.
        Read operations and notifications go to the cache, waiting
        for the cache to preload the complete src state. 'Unforward'
        ProxyDAO's default forwarding of put/remove/removeAll.
        @private
      */
      class: 'Proxy',
      of: 'foam.dao.DAO',
      name: 'delegate',
      hidden: true,
      topics: [ 'on' ],
      forwards: [ 'find_', 'select_' ],
      expression: function(src, cache) {
        // Preload src into cache, then proxy everything to cache that we
        // don't override explicitly.
        var self = this;
        var cacheFilled = cache.removeAll().then(function() {
          // First clear cache, then load the src into the cache
          return src.select(self.DAOSink.create({dao: cache})).then(function() {
            return cache;
          });
        });
        // The PromisedDAO resolves as our delegate when the cache is ready to use
        return this.PromisedDAO.create({
          promise: cacheFilled
        });
      }
    },
  ],

  methods: [
    function init() {
      this.SUPER();

      var proxy = this.src$proxy;
      proxy.sub('on', 'put',    this.onSrcPut);
      proxy.sub('on', 'remove', this.onSrcRemove);
      proxy.sub('on', 'reset',  this.onSrcReset);
    },

    /** Puts are sent to the cache and to the source, ensuring both
      are up to date. */
    function put_(x, o) {
      var self = this;
      // ensure the returned object from src is cached.
      return self.src.put(o).then(function(srcObj) {
        return self.delegate.put_(x, srcObj);
      })
    },

    /** Removes are sent to the cache and to the source, ensuring both
      are up to date. */
    function remove_(x, o) {
      var self = this;
      return self.src.remove(o).then(function() {
        return self.delegate.remove_(x, o);
      })
    },
   /** removeAll is executed on the cache and the source, ensuring both
      are up to date. */
    function removeAll_(x, skip, limit, order, predicate) {
      var self = this;
      return self.src.removeAll_(x, skip, limit, order, predicate).then(function() {
        return self.delegate.removeAll_(x, skip, limit, order, predicate);
      })
    }
  ],

  listeners: [
    /** Keeps the cache in sync with changes from the source.
      @private */
    function onSrcPut(s, on, put, obj) {
      this.delegate.put(obj);
    },

    /** Keeps the cache in sync with changes from the source.
      @private */
    function onSrcRemove(s, on, remove, obj) {
      this.delegate.remove(obj);
    },

    /** Keeps the cache in sync with changes from the source.
      @private */
    function onSrcReset() {
      // TODO: Should this removeAll from the cache?
    }
  ]
});
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
  package: 'foam.dao',
  name: 'DeDupDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
    DeDupDAO is a decorator that internalizes strings in put() objects to save memory.
    Useful for indexed or cached data.
    <p>
    Use a foam.dao.EasyDAO with dedup:true to automatically apply deduplication.
  */},

  methods: [
    /** Scan each object for strings and internalize them. */
    function put_(x, obj) {
      this.dedup(obj);
      return this.delegate.put_(x, obj);
    },

    /** Internalizes strings in the given object.
      @private */
    function dedup(obj) {
      var inst = obj.instance_;
      for ( var key in inst ) {
        var val = inst[key];
        if ( typeof val === 'string' ) {
          inst[key] = foam.String.intern(val);
        }
      }
    }
  ]
});
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
  package: 'foam.dao',
  name: 'LRUDAOManager',
  implements: [ 'foam.mlang.Expressions' ],

  documentation: 'Manages a DAO\'s size by removing old items. Commonly applied inside a cache to limit the cache\'s size. Item freshness is tracked in a separate DAO.',

  requires: [ 'foam.dao.MDAO' ],

  classes: [
    {
      /** Links an object id to a last-accessed timestamp */
      name: 'LRUCacheItem',
      properties: [
        {
          name: 'id',
        },
        {
          class: 'Int',
          name: 'timestamp'
        }
      ]
    }
  ],

  properties: [
    {
      /** The maximum size to allow the target dao to be. */
      class: 'Int',
      name: 'maxSize',
      value: 100
    },
    {
      /** Tracks the age of items in the target dao. */
      name: 'trackingDAO',
      factory: function() {
        return this.MDAO.create({ of: this.LRUCacheItem });
      }
    },
    {
      /** The DAO to manage. Items will be removed from this DAO as needed. */
      class: 'foam.dao.DAOProperty',
      name: 'dao'
    },
    {
      /** By starting at the current time, this should always be higher
        than previously stored timestamps. (only relevant if trackingDAO
        is persisted.) */
      class: 'Int',
      name: 'lastTimeUsed_',
      factory: function() { return Date.now(); }
    }
  ],

  methods: [
    function init() {
      this.SUPER();

      var proxy = this.dao$proxy;
      proxy.sub('on', 'put',    this.onPut);
      proxy.sub('on', 'remove', this.onRemove);
      proxy.sub('on', 'reset',  this.onReset);
    },

    /** Calculates a timestamp to use in the tracking dao. Override to
      provide a different timestamp calulation. */
    function getTimestamp() {
      // Just increment on each request.
      return this.lastTimeUsed_++;
    },

    function cleanup() {
      var self = this;
      self.trackingDAO
        .orderBy(this.DESC(self.LRUCacheItem.TIMESTAMP))
        .skip(self.maxSize)
        .select({
          put: function(obj) {
            self.dao.remove(obj);
          }
        });
    }
  ],

  listeners: [
    /** Adds the put() item to the tracking dao, runs cleanup() to check
      the dao size. */
    function onPut(s, on, put, obj) {
      var self = this;
      this.trackingDAO.put(
        this.LRUCacheItem.create({
          id: obj.id,
          timestamp: self.getTimestamp()
        })
      ).then(function() {
        self.cleanup();
      });
    },

    /** Clears the remove()'d item from the tracking dao. */
    function onRemove(s, on, remove, obj) {
      // ensure tracking DAO is cleaned up
      this.trackingDAO.remove(obj);
    },

    /** On reset, clear the tracking dao. */
    function onReset(s, on, reset, obj) {
      this.trackingDAO.removeAll(obj);
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'SequenceNumberDAO',
  extends: 'foam.dao.ProxyDAO',

  implements: [
    'foam.mlang.Expressions'
  ],

  documentation: 'DAO Decorator which sets a specified property\'s value with an auto-increment sequence number on DAO.put() if the value is set to the default value.',

  requires: [
    'foam.dao.InternalException'
  ],

  properties: [
    {
      /** The property to set uniquely. */
      class: 'String',
      name: 'property',
      value: 'id'
    },
    {
      /** The starting sequence value. This will be calclated from the
        existing contents of the delegate DAO, so it is one greater
        than the maximum existing value. */
      class: 'Int',
      name: 'value',
      value: 1
    },
    { /** Returns a promise that fulfills when the maximum existing number
          has been found and assigned to this.value */
      name: 'calcDelegateMax_',
      hidden: true,
      expression: function(delegate, property) {
        // TODO: validate property self.of[self.property.toUpperCase()]
        var self = this;
        return self.delegate.select( // TODO: make it a pipe?
          self.MAX(self.property_)
        ).then(
          function(max) {
            if ( max.value ) self.value = max.value + 1;
          }
        );
      }
    },
    {
      /** @private */
      name: 'property_',
      hidden: true,
      expression: function(property, of) {
        var a = this.of.getAxiomByName(property);
        if ( ! a ) {
          throw this.InternalException.create({message:
              'SequenceNumberDAO specified with invalid property ' +
              property + ' for class ' + this.of
          });
        }
        return a;
      }
    }
  ],

  methods: [
    /** Sets the property on the given object and increments the next value.
      If the unique starting value has not finished calculating, the returned
      promise will not resolve until it is ready. */
    function put_(x, obj) {
      var self = this;
      return this.calcDelegateMax_.then(function() {
        var val = self.property_.f(obj);

        if ( ! val || val == self.property_.value ) {
          obj[self.property_.name] = self.value++;
        } else if ( val && ( val >= self.value ) ) {
          // if the object has a value, and it's greater than our current value,
          // bump up the next value we try to auto-assign.
          self.value = val + 1;
        }

        return self.delegate.put_(x, obj);
      });
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ContextualizingDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: function() {/*
    ContextualizingDAO recreates objects returned by find(), giving them
    access to the exports that this ContextualizingDAO has access to.
    <p>
    If using a foam.dao.EasyDAO, set contextualize:true to automatically
    contextualize objects returned by find().
  */},

  methods: [
    /** Found objects are cloned into the same context as this DAO */
    function find_(x, id) {
      var self = this;
      return self.delegate.find_(x, id).then(function(obj) {
        if ( obj ) return obj.clone(self);
        return null;
      });
    }
    // TODO: select() too?
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

// TODO(markdittmer): foam.dao.InternalException should be unnecessary here;
// make this a PromisedDAO.
foam.CLASS({
  package: 'foam.dao',
  name: 'VersionNoDAO',
  extends: 'foam.dao.ProxyDAO',
  implements: [ 'foam.mlang.Expressions' ],

  documentation: `DAO decorator that applies an incrementing version number
      to all objects put() and remove()d. Instead of deleting objects that
      are remove()d, a placeholder with a deleted flag is put() in its place.
      This allows foam.dao.SyncDAO clients that are polling a VersionNoDAO to
      recieve deletes from other clients.

      This DAO expects to be "of" a class that has the trait
      foam.version.VersionTrait.

      Note that marking records as deleted violates certain expectaions DAO
      expectations. For example, removing an object and then finding it will not
      yield null, it will yield a record marked as deleted.

      This DAO throws an InternalException when writes are issued before it has
      synchronized its delegate. To get a DAO of this class that can accept
      writes immediately, decorate it with a StoreAndForwardDAO.`,

  requires: [
    'foam.dao.InternalException',
    'foam.version.VersionTrait'
  ],

  properties: [
    {
      name: 'of',
      required: true
    },
    {
      name: 'delegate',
      required: true,
      final: true
    },
    {
      class: 'Int',
      name: 'version',
      value: 1
    },
    {
      class: 'Boolean',
      name: 'ready_'
    }
  ],

  methods: [
    function init() {
      this.validate();
      this.SUPER();

      // Get largest version number in delegate's records.
      this.delegate
          // Like MAX(), but faster on DAOs that can optimize order+limit.
          .orderBy(this.DESC(this.VersionTrait.VERSION_)).limit(1)
          .select().then(function(sink) {
            var propName = this.VersionTrait.VERSION_.name;
            if ( sink.array[0] && sink.array[0][propName] )
              this.version = sink.array[0][propName] + 1;
            this.ready_ = true;
          }.bind(this));
    },
    function validate() {
      this.SUPER();
      if ( ! this.VersionTrait.isSubClass(this.of) ) {
        throw new Error(`VersionNoDAO.of must have trait
                            foam.version.VersionTrait`);
      }
    },
    function put_(x, obj) {
      if ( ! this.ready_ )
        return Promise.reject(this.InternalException.create());

      // Increment version number and put to delegate.
      obj[this.VersionTrait.VERSION_.name] = this.version;
      this.version++;
      return this.delegate.put_(x, obj);
    },
    function remove_(x, obj) {
      if ( ! this.ready_ )
        return Promise.reject(this.InternalException.create());

      // Increment version number and put empty object (except for "id"
      // and "deleted = true") to delegate.
      var deleted = obj.clone(x);
      deleted[this.VersionTrait.DELETED_.name] = true;
      deleted[this.VersionTrait.VERSION_.name] = this.version;
      this.version++;
      return this.delegate.put_(x, deleted);
    },
    function removeAll_(x, skip, limit, order, predicate) {
      if ( ! this.ready_ )
        return Promise.reject(this.InternalException.create());

      // Select relevant records and mark each as deleted via remove_().
      return this.select_(x, null, skip, limit, order, predicate).
          then(function(sink) {
            var array = sink.array;
            var promises = [];
            for ( var i = 0; i < array.length; i++ ) {
              promises.push(this.remove_(x, array[i]));
            }
            return Promise.all(promises);
          }.bind(this));
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao.sync',
  name: 'SyncRecord',

  documentation: `Used by foam.dao.SyncDAO to track object updates and
      deletions.`,

  properties: [ 'id' ]
});

// Define foam.dao.sync.VersionedSyncRecord.
foam.lookup('foam.version.VersionedClassFactorySingleton').create().get(
    foam.lookup('foam.dao.sync.SyncRecord'));
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'SyncDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: `SyncDAO synchronizes data between multiple clients' offline
      caches and a server. When syncronizing, each client tracks the last-seen
      version of each object, or if the object was deleted. The most recent
      version is retained.

      Objects put to this DAO must be subclasses of foam.version.VersionTrait.
      The "version_" property will be automatically be incremented as changes
      are put() into the SyncDAO. The SyncDAO will expect to find objects in
      remoteDAO that have been marked as deleted; this is interpreted as a
      signal to delete records (during initial sync or polling). Details on
      versioned class generation, and the "version_" and "deleted_" properties
      are in the foam.version package.

      Remote DAOs that interact with SyncDAO clients should be decorated with
      foam.dao.VersionNoDAO, or similar, to provision new version numbers for
      records being stored.`,

  requires: [
    'foam.dao.ArraySink',
    'foam.dao.sync.VersionedSyncRecord',
    'foam.version.VersionTrait'
  ],

  implements: [ 'foam.mlang.Expressions' ],

  imports: [ 'setInterval' ],

  classes: [
    {
      name: 'AdapterSink',
      extends: 'foam.dao.ProxySink',

      properties: [
        {
          class: 'Class',
          name: 'of'
        }
      ],

      methods: [
        function put(o, sub) {
          this.delegate.put(this.of.create(o, this.__subContext__), sub);
        }
      ]
    }
  ],

  properties: [
    {
      class: 'foam.dao.DAOProperty',
      name: 'remoteDAO',
      documentation: 'The shared server DAO to synchronize to.',
      transient: true,
      required: true
    },
    {
      name: 'delegate',
      documentation: 'The local cache to sync with the server DAO.'
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'syncRecordDAO',
      documentation: `The DAO in which to store VersionedSyncRecords for each
          object. Each client tracks their own sync state in a separate
          syncRecordDAO.`,
      transient: true,
      required: true
    },
    {
      name: 'of',
      documentation: 'The class of object this DAO will store.',
      required: true,
      transient: true
    },
    {
      class: 'Boolean',
      name: 'polling',
      documentation: `If using a remote DAO without push capabilities, such as
          an HTTP server, polling will periodically attempt to synchronize.`,
      postSet: function(old, nu) {
        this.sync_ = nu ? this.pollingSync_ : this.syncToRemote_;
      }
    },
    {
      class: 'Int',
      name: 'pollingFrequency',
      documentation: `If using polling, pollingFrequency will determine the
        number of milliseconds to wait between synchronization attempts.`,
      value: 1000
    },
    {
      name: 'synced',
      documentation: `A promise that resolves after any in-flight
          synchronization pass completes.`,
      factory: function() { return Promise.resolve(); }
    },
    {
      name: 'syncRecordWriteSync_',
      factory: function() { return Promise.resolve(); }
    },
    {
      class: 'Function',
      name: 'sync_',
      documentation: `Selected sync strategy; either syncToRemote_() or
          pollingSync_().`,
      factory: function() {
        return this.polling ? this.pollingSync_ : this.syncToRemote_;
      }
    }
  ],

  methods: [
    function init() {
      this.SUPER();

      this.validate();

      // Only listen to DAOs that support push (i.e., do not require polling).
      if ( ! this.polling )
        this.remoteDAO$proxy.sub('on', this.onRemoteUpdate);

      // Push initial data from delegate.
      var self = this;
      self.synced = self.delegate.select().
          then(function(sink) {
            var minVersionNo = 0;
            var array = sink.array;
            for ( var i = 0; i < array.length; i++ ) {
              var version = self.VersionTrait.VERSION_.f(array[i]);
              self.syncRecordDAO.put(self.VersionedSyncRecord.create({
                id: array[i].id,
                version_: version
              }));
              minVersionNo = Math.max(minVersionNo, version);
            }
            return self.syncFromRemote_(minVersionNo);
          });

      // Setup polling after initial sync.
      if ( ! self.polling ) return;
      self.synced.then(function() {
        self.setInterval(function() {
          self.sync();
        }, self.pollingFrequency);
      });
    },
    function validate() {
      this.SUPER();
      if ( ! this.VersionTrait.isSubClass(this.of) ) {
        throw new Error(`SyncDAO.of must have trait foam.version.VersionTrait`);
      }
    },
    function sync() {
      // Sync after any sync(s) in progress complete.
      return this.synced = this.synced.then(function() {
        return this.sync_();
      }.bind(this));
    },

    //
    // DAO overrides.
    //

    function put_(x, obj) {
      var self = this;
      var ret;
      return self.withSyncRecordTx_(function() {
        return self.delegate.put_(x, obj).then(function(o) {
          ret = o;
          // Updates the object's last seen info.
          return self.syncRecordDAO.put_(x, self.VersionedSyncRecord.create({
            id: o.id,
            version_: -1
          }));
        });
      }).then(self.onLocalUpdate).then(function() { return ret; });
    },
    function remove_(x, obj) {
      var self = this;
      var ret;
      return self.withSyncRecordTx_(function() {
        return self.delegate.remove_(x, obj).then(function(o) {
          ret = o;
          // Marks the object as deleted.
          self.syncRecordDAO.put_(x, self.VersionedSyncRecord.create({
            id: obj.id,
            deleted_: true,
            version_: -1
          }));
        });
      }).then(self.onLocalUpdate).then(function() { return ret; });
    },
    function removeAll_(x, skip, limit, order, predicate) {
      // Marks all the removed objects' sync records as deleted via remove_().
      return this.delegate.select_(x, null, skip, limit, order, predicate).
          then(function(a) {
            a = a.array;
            var promises = [];

            for ( var i = 0 ; i < a.length ; i++ ) {
              promises.push(this.remove_(x, a[i]));
            }

            return Promise.all(promises);
          }.bind(this));
    },

    //
    // Private synchronization details.
    //

    {
      name: 'putFromRemote_',
      documentation: 'Process a put() to cache from remote.',
      code: function(obj) {
        var self = this;
        var ret;
        return self.withSyncRecordTx_(function() {
          return self.delegate.put(obj).then(function(o) {
            ret = o;
            return self.syncRecordDAO.put(self.VersionedSyncRecord.create({
              id: o.id,
              version_: self.VersionTrait.VERSION_.f(o)
            }));
          });
        }).then(function() { return ret; });
      }
    },
    {
      name: 'removeFromRemote_',
      documentation: 'Process a remove() on cache from remote.',
      code: function(obj) {
        var self = this;
        var ret;
        return self.withSyncRecordTx_(function() {
          return self.delegate.remove(obj).then(function(o) {
            ret = o;
            return self.syncRecordDAO.put(self.VersionedSyncRecord.create({
              id: obj.id,
              version_: self.VersionTrait.VERSION_.f(obj),
              deleted_: true
            }));
          });
        }).then(function() { return ret; });
      }
    },
    {
      name: 'resetFromRemote_',
      documentation: 'Process a reset signal on cache from remote.',
      code: function(obj) {
        // Clear sync records and data not associated with unsynced data, then
        // sync.
        var self = this;
        var ret;
        return self.withSyncRecordTx_(function() {
          return self.syncRecordDAO.
              where(self.GT(self.VersionedSyncRecord.VERSION_, -1)).
              removeAll().
              then(self.syncRecordDAO.select.bind(self.syncRecordDAO)).
              then(function(sink) {
                var idsToKeep = sink.array.map(function(syncRecord) {
                  return syncRecord.id;
                });
                return self.delegate.where(
                    self.NOT(self.IN(self.of.ID, idsToKeep))).
                    removeAll();
              });
        }).then(self.sync.bind(self));
      }
    },
    {
      name: 'pollingSync_',
      documentation: `Polling synchronization strategy. Determine current
          version, then push to remote, then pull update from remote.`,
      code: function() {
        var self = this;
        var VERSION_ = self.VersionedSyncRecord.VERSION_;
        return self.syncRecordDAO.
            // Like MAX(), but faster on DAOs that can optimize order+limit.
            orderBy(self.DESC(VERSION_)).limit(1).
            select().then(function(sink) {
              var minVersionNo = sink.array[0] && VERSION_.f(sink.array[0]) ||
                  0;
              return self.syncToRemote_().
                  then(self.syncFromRemote_.bind(self, minVersionNo));
            });
      }
    },
    {
      name: 'syncToRemote_',
      documentation: `Push synchronization strategy: Push data from cach to
          remote; rely on pushed updates from server.`,
      code: function() {
        var self = this;

        return this.syncRecordDAO.
          where(self.EQ(self.VersionedSyncRecord.VERSION_, -1)).
          select().then(function(records) {
            records = records.array;
            var promises = [];

            for ( var i = 0 ; i < records.length ; i++ ) {
              var record = records[i];
              var id = record.id;
              var deleted = self.VersionedSyncRecord.DELETED_.f(record);

              if ( deleted ) {
                var obj = self.of.create(undefined, self);
                obj.id = id;
                var promise = self.remoteDAO.remove(obj);

                // When not polling, server result will processed when
                // onRemoteUpdate listener is fired.
                if ( self.polling ) {
                  promises.push(promise.then(function() {
                    var propName = self.VersionTrait.VERSION_.name;
                    // Ensure that obj SyncRecord does not remain queued (i.e.,
                    // does not have version_ = -1).
                    obj[propName] = Math.max(obj[propName], 0);
                    return self.removeFromRemote_(obj);
                  }));
                } else {
                  promises.push(promise);
                }
              } else {
                // TODO(markdittmer): Deal appropriately with failed updates.
                promises.push(self.delegate.find(id).then(function(obj) {
                  if ( ! obj ) return null;
                  var ret = self.remoteDAO.put(obj);

                  // When not polling, server result will processed when
                  // onRemoteUpdate listener is fired.
                  if ( self.polling ) {
                    ret = ret.then(function(o) {
                      return self.putFromRemote_(o);
                    });
                  }

                  return ret;
                }));
              }
            }

            return Promise.all(promises);
          });
      }
    },
    {
      name: 'syncFromRemote_',
      documentation: `Pull updates from remote; used for initial sync and
          polling sync strategy.`,
      code: function(minVersionNo) {
        var self = this;
        return self.remoteDAO.
            where(self.GT(self.VersionTrait.VERSION_, minVersionNo)).
            orderBy(self.VersionTrait.VERSION_).
            select().then(function(sink) {
              var array = sink.array;
              var promises = [];

              for ( var i = 0 ; i < array.length ; i++ ) {
                if ( self.VersionTrait.DELETED_.f(array[i]) ) {
                  promises.push(self.removeFromRemote_(array[i]));
                } else {
                  promises.push(self.putFromRemote_(array[i]));
                }
              }

              return Promise.all(promises);
            });
      }
    },
    {
      name: 'withSyncRecordTx_',
      documentation: `Run a computation that writes to syncRecordDAO
          transactionally with respect to other syncRecordDAO writes.`,
      code: function(f) {
        return this.syncRecordWriteSync_ = this.syncRecordWriteSync_.then(f);
      }
    }
  ],

  listeners: [
    {
      name: 'onRemoteUpdate',
      documentation: 'Respond to push event from remote.',
      code: function(s, on, event, obj) {
        if ( event == 'put' ) {
          if ( this.VersionTrait.DELETED_.f(obj) ) this.removeFromRemote_(obj);
          else                                     this.putFromRemote_(obj);
        } else if ( event === 'remove' ) {
          throw new Error(`SyncDAO recieved remove() event;
                              expected put(deleted)-as-remove()`);
        } else if ( event === 'reset' ) {
          this.resetFromRemote_();
        }
      }
    },
    {
      name: 'onLocalUpdate',
      isMerged: true,
      mergeDelay: 100,
      code: function() {
        this.sync();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'EasyDAO',
  extends: 'foam.dao.ProxyDAO',
  implements: [ 'foam.mlang.Expressions' ],

  documentation: function() {/*
    Facade for easily creating decorated DAOs.
    <p>
    Most DAOs are most easily created and configured with EasyDAO.
    Simply require foam.dao.EasyDAO and create() with the flags
    to indicate what behavior you're looking for. Under the hood, EasyDAO
    will create one or more DAO instances to service your requirements and then
  */},

  requires: [
    'foam.dao.MDAO',
    'foam.dao.JDAO',
    'foam.dao.GUIDDAO',
    'foam.dao.IDBDAO',
    'foam.dao.SequenceNumberDAO',
    'foam.dao.CachingDAO',
    'foam.dao.SyncDAO',
    'foam.dao.ContextualizingDAO',
    'foam.dao.DecoratedDAO',
    'foam.dao.CompoundDAODecorator',
    'foam.dao.DeDupDAO',
    'foam.dao.ClientDAO',
    'foam.dao.PromisedDAO',
    'foam.box.Context',
    'foam.box.HTTPBox',
    'foam.box.SocketBox',
    'foam.box.WebSocketBox',
    //'foam.core.dao.MergeDAO',
    //'foam.core.dao.MigrationDAO',
    //'foam.core.dao.VersionNoDAO',
    //'foam.dao.EasyClientDAO',
    'foam.dao.LoggingDAO',
    'foam.dao.TimingDAO'
  ],

  imports: [ 'document' ],

  constants: {
    // Aliases for daoType
    ALIASES: {
      ARRAY:  'foam.dao.ArrayDAO',
      MDAO:   'foam.dao.MDAO',
      IDB:    'foam.dao.IDBDAO',
      LOCAL:  'foam.dao.LocalStorageDAO',
      CLIENT: 'foam.dao.RequestResponseClientDAO'
    }
  },

  properties: [
    {
      /** The developer-friendly name for this EasyDAO. */
      name: 'name',
      factory: function() { return this.of.id; }
    },
    {
      /** This is set automatically when you create an EasyDAO.
        @private */
      name: 'delegate'
    },
    {
      /** Have EasyDAO use a sequence number to index items. Note that
        .seqNo and .guid features are mutually
        exclusive. */
      class: 'Boolean',
      name: 'seqNo',
      value: false
    },
    {
      /** Have EasyDAO generate guids to index items. Note that .seqNo and .guid features are mutually exclusive. */
      class: 'Boolean',
      name: 'guid',
      label: 'GUID',
      value: false
    },
    {
      /** The property on your items to use to store the sequence number or guid. This is required for .seqNo or .guid mode. */
      name: 'seqProperty',
      class: 'Property'
    },
    {
      /** Enable local in-memory caching of the DAO. */
      class: 'Boolean',
      name: 'cache',
      value: false
    },
    {
      /** Enable value de-duplication to save memory when caching. */
      class: 'Boolean',
      name: 'dedup',
      value: false,
    },
    {
      /** Keep a history of all state changes to the DAO. */
      class: 'FObjectProperty',
      of: 'foam.dao.Journal',
      name: 'journal'
    },
    {
      /** Enable logging on the DAO. */
      class: 'Boolean',
      name: 'logging',
      value: false,
    },
    {
      /** Enable time tracking for concurrent DAO operations. */
      class: 'Boolean',
      name: 'timing',
      value: false
    },
    {
      /** Contextualize objects on .find, re-creating them with this EasyDAO's
        exports, as if they were children of this EasyDAO. */
      class: 'Boolean',
      name: 'contextualize',
      value: false
    },
//     {
//       class: 'Boolean',
//       name: 'cloning',
//       value: false,
//       //documentation: "True to clone results on select"
//     },
    {
      /**
        <p>Selects the basic functionality this EasyDAO should provide.
        You can specify an instance of a DAO model definition such as
        MDAO, or a constant indicating your requirements.</p>
        <p>Choices are:</p>
        <ul>
          <li>IDB: Use IndexDB for storage.</li>
          <li>LOCAL: Use local storage.</li>
          <li>MDAO: Use non-persistent in-memory storage.</li>
        </ul>
      */
      name: 'daoType',
      value: 'foam.dao.IDBDAO'
    },
    {
      /** Automatically generate indexes as necessary, if using an MDAO or cache. */
      class: 'Boolean',
      name: 'autoIndex',
      value: false
    },
//     {
//       /** Creates an internal MigrationDAO and applies the given array of MigrationRule. */
//       class: 'FObjectArray',
//       name: 'migrationRules',
//       of: 'foam.core.dao.MigrationRule',
//     },
    {
      /** Turn on to activate synchronization with a server. Specify serverUri
        and syncProperty as well. */
      class: 'Boolean',
      name: 'syncWithServer',
      value: false
    },
    {
      /** Turn on to enable remote listener support. Only useful with daoType = CLIENT. */
      class: 'Boolean',
      name: 'remoteListenerSupport',
      value: false
    },
    {
      /** Setting to true activates polling, periodically checking in with
        the server. If sockets are used, polling is optional as the server
        can push changes to this client. */
      class: 'Boolean',
      name: 'syncPolling',
      value: true
    },
    {
      /** Set to true if you are running this on a server, and clients will
        synchronize with this DAO. */
      class: 'Boolean',
      name: 'isServer',
      value: false
    },
    {
      /** The property to synchronize on. This is typically an integer value
        indicating the version last seen on the remote. */
      name: 'syncProperty'
    },
    {
      /** Destination address for server. */
      name: 'serverBox',
      factory: function() {
        return this.remoteListenerSupport ?
            this.WebSocketBox.create({of: this.model, uri: this.serviceName}) :
            this.HTTPBox.create({of: this.model, url: this.serviceName}) ;
      }
    },
    {
      /** Simpler alternative than providing serverBox. */
      name: 'serviceName'
    },
    {
      class: 'FObjectArray',
      of: 'foam.dao.DAODecorator',
      name: 'decorators'
    },
    'testData'
  ],

  methods: [
    function init() {
      /**
        <p>On initialization, the EasyDAO creates an appropriate chain of
        internal EasyDAO instances based on the EasyDAO
        property settings.</p>
        <p>This process is transparent to the developer, and you can use your
        EasyDAO like any other DAO.</p>
      */
      this.SUPER.apply(this, arguments);

      var daoType = typeof this.daoType === 'string' ?
        this.ALIASES[this.daoType] || this.daoType :
        this.daoType;

      var params = { of: this.of };

      if ( daoType == 'foam.dao.RequestResponseClientDAO' ) {
        foam.assert(this.hasOwnProperty('serverBox') || this.serviceName, 'EasyDAO "client" type requires a serveBox or serviceName');

        if ( this.remoteListenerSupport ) {
          daoType = 'foam.dao.ClientDAO';
        }

        params.delegate = this.serverBox;
      }

      var daoModel = typeof daoType === 'string' ?
        this.lookup(daoType) || global[daoType] :
        daoType;

      if ( ! daoModel ) {
        this.warn(
          "EasyDAO: Unknown DAO Type.  Add '" + daoType + "' to requires: list."
        );
      }

      if ( this.name && daoModel.getAxiomByName('name') ) params.name = this.name;
      if ( daoModel.getAxiomByName('autoIndex') ) params.autoIndex = this.autoIndex;
      //if ( this.seqNo || this.guid ) params.property = this.seqProperty;

      var dao = daoModel.create(params, this.__subContext__);

      // Not used by decorators.
      delete params['name'];

      if ( this.MDAO.isInstance(dao) ) {
        this.mdao = dao;
        if ( this.dedup ) dao = this.DeDupDAO.create({delegate: dao});
      } else {
//         if ( this.migrationRules && this.migrationRules.length ) {
//           dao = this.MigrationDAO.create({
//             delegate: dao,
//             rules: this.migrationRules,
//             name: this.model.id + "_" + daoModel.id + "_" + this.name
//           });
//         }
        if ( this.cache ) {
          this.mdao = this.MDAO.create(params);
          dao = this.CachingDAO.create({
            cache: this.dedup ?
              this.mdao :
              this.DeDupDAO.create({delegate: this.mdao}),
            src: dao,
            of: this.model});
        }
      }

      if ( this.journal ) {
        dao = this.JDAO.create({
          delegate: dao,
          journal: this.journal
        });
      }

      if ( this.seqNo && this.guid ) throw "EasyDAO 'seqNo' and 'guid' features are mutually exclusive.";

      if ( this.seqNo ) {
        var args = {__proto__: params, delegate: dao, of: this.of};
        if ( this.seqProperty ) args.property = this.seqProperty;
        dao = this.SequenceNumberDAO.create(args);
      }

      if ( this.guid ) {
        var args = {__proto__: params, delegate: dao, of: this.of};
        if ( this.seqProperty ) args.property = this.seqProperty;
        dao = this.GUIDDAO.create(args);
      }

      var cls = this.of;

      if ( this.syncWithServer && this.isServer ) throw "isServer and syncWithServer are mutually exclusive.";

      if ( this.syncWithServer || this.isServer ) {
        if ( ! this.syncProperty ) {
          this.syncProperty = cls.SYNC_PROPERTY;
          if ( ! this.syncProperty ) {
            throw "EasyDAO sync with class " + cls.id + " invalid. Sync requires a sync property be set, or be of a class including a property 'sync_property'.";
          }
        }
      }

      if ( this.syncWithServer ) {
        foam.assert(this.serverBox, 'syncWithServer requires serverBox');

        dao = this.SyncDAO.create({
          remoteDAO: this.ClientDAO.create({
              name: this.name,
              delegate: this.serverBox
          }, boxContext),
          syncProperty: this.syncProperty,
          delegate: dao,
          pollingFrequency: 1000
        });
        dao.syncRecordDAO = foam.dao.EasyDAO.create({
          of: dao.SyncRecord,
          cache: true,
          daoType: this.daoType,
          name: this.name + '_SyncRecords'
        });
      }

//       if ( this.isServer ) {
//         dao = this.VersionNoDAO.create({
//           delegate: dao,
//           property: this.syncProperty,
//           version: 2
//         });
//       }

      if ( this.contextualize ) {
        dao = this.ContextualizingDAO.create({delegate: dao});
      }

      if ( this.decorators.length ) {
        var decorated = this.DecoratedDAO.create({
          decorator: this.CompoundDAODecorator.create({
            decorators: this.decorators
          }),
          delegate: dao
        });
        dao = decorated;
      }

      if ( this.timing  ) {
        dao = this.TimingDAO.create({ name: this.name + 'DAO', delegate: dao });
      }

      if ( this.logging ) {
        dao = this.LoggingDAO.create({ delegate: dao });
      }

      var self = this;

      if ( decorated ) decorated.dao = dao;

      if ( this.testData ) {
        var delegate = dao;

        dao = this.PromisedDAO.create({
          promise: new Promise(function(resolve, reject) {
            delegate.select(self.COUNT()).then(function(c) {
              // Only load testData if DAO is empty
              if ( c.value ) {
                resolve(delegate);
                return;
              }

              self.log("Loading test data");
              Promise.all(foam.json.parse(self.testData, self.of, self).map(
                function(o) { return delegate.put(o); }
              )).then(function() {
                self.log("Loaded", self.testData.length, "records.");
                resolve(delegate);
              }, reject);
            });
          })
        });
      }

      this.delegate = dao;
    },

    /** Only relevant if cache is true or if daoType
       was set to MDAO, but harmless otherwise. Generates an index
       for a query over all specified properties together.
       @param var_args specify any number of Properties to be indexed.
    */
    function addPropertyIndex() {
      this.mdao && this.mdao.addPropertyIndex.apply(this.mdao, arguments);
      return this;
    },

    /** Only relevant if cache is true or if daoType
      was set to MDAO, but harmless otherwise. Adds an existing index
      to the MDAO.
      @param index The index to add.
    */
    function addIndex(index) {
      this.mdao && this.mdao.addIndex.apply(this.mdao, arguments);
      return this;
    }
  ]
});
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
  package: 'foam.dao',
  name: 'NoSelectAllDAO',
  extends: 'foam.dao.ProxyDAO',

  requires: [
    'foam.dao.ArraySink',
    'foam.mlang.predicate.True',
    'foam.mlang.predicate.False'
  ],

  documentation: 'DAO Decorator which prevents \'select all\', ie. a select() with no query, limit, or skip.',

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
        if ( predicate &&
             ( ! this.True.isInstance(predicate) &&
               ! this.False.isInstance(predicate) ) ||
          ( foam.Number.isInstance(limit) && Number.isFinite(limit) && limit != 0 ) ||
          ( foam.Number.isInstance(skip) && Number.isFinite(skip) && skip != 0 ) ) {
        return this.delegate.select_(x, sink, skip, limit, order, predicate);
      } else {
        sink && sink.eof();
        return Promise.resolve(sink || this.ArraySink.create());
      }
    }
    // TODO: removeAll?
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'NullDAO',
  extends: 'foam.dao.AbstractDAO',

  documentation: 'A Null pattern (do-nothing) DAO implementation.',

  requires: [
    'foam.dao.ExternalException',
    'foam.dao.ObjectNotFoundException'
  ],

  methods: [
    function put_(x, obj) {
      this.pub('on', 'put', obj);
      return Promise.resolve(obj);
    },

    function remove_(x, obj) {
      this.pub('on', 'remove', obj);
      return Promise.resolve();
    },

    function find_(x, id) {
      return Promise.resolve(null);
    },

    function select_(x, sink, skip, limit, order, predicate) {
      sink = sink || foam.dao.ArraySink.create();
      sink.eof();
      return Promise.resolve(sink);
    },

    function removeAll_(x, skip, limit, order, predicate) {
      return Promise.resolve();
    }
  ]
});
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
  package: 'foam.dao',
  name: 'TimingDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'Times access to the delegate DAO; useful for debugging and profiling.',

  properties: [
    'name',
    {
      name: 'id',
      value: 0
    },
    ['activeOps', {put: 0, remove:0, find: 0, select: 0}],
    {
      /** High resolution time value function */
      class: 'Function',
      name: 'now',
      factory: function() {
        if ( global.window && global.window.performance ) {
          return function() {
            return window.performance.now();
          }
        } else if ( global.process && global.process.hrtime ) {
          return function() {
            var hr = global.process.hrtime();
            return ( hr[0] * 1000 ) + ( hr[1] / 1000000 );
          }
        } else {
          return function() { return Date.now(); }
        }
      }
    }
  ],

  methods: [
    function start(op) {
      var str = this.name + '-' + op;
      var key = this.activeOps[op]++ ? str + '-' + (this.id++) : str;
      console.time(key);
      return [key, str, this.now(), op];
    },

    function end(act) {
      this.activeOps[act[3]]--;
      this.id--;
      console.timeEnd(act[0]);
      console.log('Timing: ', act[1], ' ', (this.now()-act[2]).toFixed(3), ' ms');
    },

    function put_(x, obj) {
      var act = this.start('put');
      var self = this;
      return this.SUPER(x, obj).then(function(o) { self.end(act); return o; });
    },
    function remove_(x, obj) {
      var act = this.start('remove');
      var self = this;
      return this.SUPER(x, obj).then(function() { self.end(act); });
    },
    function find_(x, key) {
      var act = this.start('find');
      var self = this;
      return this.SUPER(x, key).then(function(o) { self.end(act); return o; });
    },
    function select() {
      var act = this.start('select');
      var self = this;
      return this.SUPER.apply(this, arguments).then(function(s) {
        self.end(act);
        return s;
      })
    }
  ]
});
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
  package: 'foam.dao',
  name: 'LoggingDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'DAO Decorator which logs access to the delegate; useful for debugging.',

  requires: [ 'foam.dao.ArraySink' ],

  properties: [
    {
      name: 'name',
    },
    {
      name: 'logger',
      expression: function(name) {
        return console.log.bind(console, name);
      }
    },
    {
      class: 'Boolean',
      name: 'logReads',
      value: false
    },
  ],

  methods: [
    function put_(x, obj) {
      this.logger('put', obj);
      return this.SUPER(x, obj);
    },

    function remove_(x, obj) {
      this.logger('remove', obj);
      return this.SUPER(x, obj);
    },

    function select_(x, sink, skip, limit, order, predicate) {
      this.logger('select',
                  'skip', skip,
                  'limit', limit,
                  'order', order && order.toString(),
                  'predicate', predicate && predicate.toString());
      sink = sink || this.ArraySink.create();
      if ( this.logReads ) {
        var put = sink.put.bind(sink);
        var newSink = { __proto__: sink };
        newSink.put = function(o) {
          this.logger('read', foam.json.objectify(o));
          return put.apply(null, arguments);
        }.bind(this);
        return this.SUPER(x, newSink, skip, limit, order, predicate).then(function() {
          return sink;
        });
      }
      return this.SUPER(x, sink, skip, limit, order, predicate);
    },

    function removeAll_(x, sink, skip, limit, order, predicate) {
      this.logger('removeAll', skip, limit, order, predicate);
      return this.SUPER(x, sink, skip, limit, order, predicate);
    },

    function find_(x, id) {
      this.logger('find', id);
      return this.SUPER(x, id);
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'RestDAO',
  extends: 'foam.dao.AbstractDAO',

  documentation: function() {/*
    A client-side DAO for interacting with a REST endpoint.

    Sinks are managed on the client (i.e., sinks passed to
    select() will not serialize the sink and send it to the
    endpoint for server-side logic implementation).
  */},

  requires: [
    'foam.core.Serializable',
    'foam.dao.ArraySink',
    'foam.json.Outputter',
    'foam.net.HTTPRequest'
  ],

  properties: [
    {
      class: 'String',
      name: 'baseURL',
      documentation: 'URL for most rest calls. Some calls add "/<some-info>".',
      final: true,
      required: true
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        // NOTE: Configuration must be consistent with parser in
        // corresponding foam.net.node.RestDAOHandler.
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],

  methods: [
    function put_(x, o) {
      /**
       * PUT baseURL
       * <network-foam-jsonified FOAM object>
       */
      return this.createRequest_({
        method: 'PUT',
        url: this.baseURL,
        payload: this.outputter.stringify(o)
      }).send().then(this.onResponse.bind(this, 'put'))
          .then(this.onPutResponse);
    },

    function remove_(x, o) {
      /**
       * DELETE baseURL/<network-foam-jsonified FOAM object id>
       */
      return this.createRequest_({
        method: 'DELETE',
        url: this.baseURL + '/' +
            encodeURIComponent(this.outputter.stringify(o.id))
      }).send().then(this.onResponse.bind(this, 'remove'))
          .then(this.onRemoveResponse);
    },

    function find_(x, key) {
      /**
       * GET baseURL/<network-foam-jsonified FOAM object id>
       */
      var id = this.of.isInstance(key) ? key.id : key;
      return this.createRequest_({
        method: 'GET',
        url: this.baseURL + '/' +
            encodeURIComponent(this.outputter.stringify(id))
      }).send().then(this.onResponse.bind(this, 'find'))
          .then(this.onFindResponse);
    },

    function select_(x, sink, skip, limit, order, predicate) {
      /**
       * GET baseURL
       * { skip, limit, order, predicate }
       *
       * Each key's value is network-foam-jsonified.
       */
      var payload = {};

      var networkSink = this.Serializable.isInstance(sink) && sink;
      if ( networkSink )
        payload.sink = networkSink;

      if ( typeof skip !== 'undefined' )
        payload.skip = skip;
      if ( typeof limit !== 'undefined' )
        payload.limit = limit;
      if ( typeof order !== 'undefined' )
        payload.order = order;
      if ( typeof predicate !== 'undefined' )
        payload.predicate = predicate;

      return this.createRequest_({
        method: 'POST',
        url: this.baseURL + ':select',
        payload: this.outputter.stringify(payload)
      }).send().then(this.onResponse.bind(this, 'select'))
          .then(this.onSelectResponse.bind(
              this, sink || this.ArraySink.create()));
    },

    function removeAll_(x, skip, limit, order, predicate) {
      /**
       * POST baseURL/removeAll
       * { skip, limit, order, predicate }
       *
       * Each key's value is network-foam-jsonified.
       */
      var payload = {};
      if ( typeof skip  !== 'undefined' ) payload.skip = skip;
      if ( typeof limit !== 'undefined' ) payload.limit = limit;
      if ( typeof order !== 'undefined' ) payload.order = order;
      if ( typeof predicate !== 'undefined' ) payload.predicate = predicate;

      return this.createRequest_({
        method: 'POST',
        url: this.baseURL + ':removeAll',
        payload: this.outputter.stringify(payload)
      }).send().then(this.onResponse.bind(this, 'removeAll'))
          .then(this.onRemoveAllResponse);
    },

    function createRequest_(o) {
      // Demand that required properties are set before using DAO.
      this.validate();
      // Each request should default to a json responseType.
      return this.HTTPRequest.create(Object.assign({responseType: 'json'}, o));
    }
  ],

  listeners: [
    function onResponse(name, response) {
      if ( response.status !== 200 ) {
        throw new Error(
          'Unexpected ' + name + ' response code from REST DAO endpoint: ' +
            response.status);
      }
      return response.payload;
    },

    function onPutResponse(payload) {
      var o = foam.json.parse(payload);
      this.pub('on', 'put', o);
      return o;
    },

    function onRemoveResponse(payload) {
      var o = foam.json.parse(payload);
      if ( o !== null ) this.pub('on', 'remove', o);
      return o;
    },

    function onFindResponse(payload) {
      return foam.json.parse(payload);
    },

    function onSelectResponse(localSink, payload) {
      var wasSerializable = this.Serializable.isInstance(localSink);
      var remoteSink = foam.json.parse(payload);

      // If not proxying a local unserializable sink, just return the remote.
      if ( wasSerializable ) return remoteSink;

      var array = remoteSink.array;
      if ( ! array )
        throw new Error('Expected ArraySink from REST endpoint when proxying local sink');

      if ( localSink.put ) {
        var sub = foam.core.FObject.create();
        var detached = false;
        sub.onDetach(function() { detached = true; });
        for ( var i = 0; i < array.length; i++ ) {
          localSink.put(array[i], sub);
          if ( detached ) break;
        }
      }
      if ( localSink.eof ) localSink.eof();

      return localSink;
    },

    function onRemoveAllResponse(payload) {
      return undefined;
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.dao',
  name: 'EnabledAwareDAO',
  extends: 'foam.dao.FilteredDAO',

  documentation: 'Filter out disabled EnabledAware objects.',

  properties: [
    {
      name: 'predicate',
      factory: function() {
        return this.EQ(this.EnabledAware.ENABLED, true);
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
  package: 'foam.dao',
  name: 'LastModifiedAwareDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'Sets lastModified timestamp on put() of LastModifiedAware objects.',

  methods: [
    {
      name: 'put_',
      code: function(value) {
        value.lastModified = new Date();
        return SUPER(value);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ValidationDAODecorator',
  implements: ['foam.dao.DAODecorator'],
  documentation: 'DAO decorator that rejects puts of objects that are invalid.',
  methods: [
    function write(X, dao, obj, existing) {
      if ( obj.errors_ ) {
        return Promise.reject(foam.dao.ValidationException.create({
          errors: obj.errors_,
        }));
      }
      return Promise.resolve(obj);
    },
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'ValidationException',
  extends: 'foam.dao.ExternalException',
  properties: [
    'errors',
    {
      name: 'message',
      expression: function(errors) {
        return errors.join(', ');
      },
    },
  ],
});
/**
 * @license
 * Copyright 2016 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'NoDisjunctionDAO',
  extends: 'foam.dao.ProxyDAO',
  implements: [ 'foam.mlang.Expressions' ],

  documentation: 'DAO decorator for DAOs that do not support disjunction.',

  requires: [
    'foam.dao.DAOSink',
    'foam.dao.MDAO',
    'foam.mlang.Constant',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.Or'
  ],

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
      if ( ! predicate )
        return this.SUPER(x, sink, skip, limit, order, predicate);

      // Get predicate in reduced form of OR( ... <no ORs or INs> ... ).
      var newPredicate = this.inToOr_(predicate)
          .toDisjunctiveNormalForm()
          .partialEval();

      // Do not bother disjunction-only DAOs with returning empty set or
      // implementing select(..., TRUE) = select(..., <no predicate>).
      if ( this.FALSE.equals(newPredicate) ) {
        sink.eof && sink.eof();
        return Promise.resolve(sink);
      }
      if ( this.TRUE.equals(newPredicate) ) newPredicate = undefined;

      if ( ! this.Or.isInstance(newPredicate) )
        return this.SUPER(x, sink, skip, limit, order, newPredicate);

      // Perform query over each arg of top-level OR.
      var predicates = newPredicate.args;
      var dao = this.MDAO.create({ of: this.of });
      // TODO(markdittmer): Create indices based on predicate.
      var sharedSink = this.DAOSink.create({ dao: dao });
      var promises = [];
      for ( var i = 0; i < predicates.length; i++ ) {
        promises.push(
            this.SUPER(x, sharedSink, skip, limit, order, predicates[i]));
      }

      return Promise.all(promises).then(function() {
        // Perform "actual" query over DAO of merged results.
        return dao.select_(x, sink, skip, limit, order, predicate);
      });
    },
    {
      name: 'inToOr_',
      documentation: 'Convert IN() mLangs in input to OR(EQ(...), ...).',
      code: foam.mmethod({
        'foam.mlang.predicate.In': function(predicate) {
          foam.assert(this.Constant.isInstance(predicate.arg2),
                      'NoDisjunctionDAO expects constant IN.arg2');

          var orArgs = [];
          var arg2 = predicate.arg2.value;

          for ( var i = 0; i < arg2.length; i++ ) {
            orArgs.push(this.Eq.create({
              arg1: predicate.arg1.clone(),
              arg2: arg2[i]
            }, predicate));
          }
          return this.Or.create({ args: orArgs }, predicate);
        },
        'foam.mlang.predicate.Binary': function(predicate) {
          return predicate.cls_.create({
            arg1: this.inToOr_(predicate.arg1),
            arg2: this.inToOr_(predicate.arg2)
          }, predicate);
        },
        'foam.mlang.predicate.Nary': function(predicate) {
          var oldArgs = predicate.args;
          var newArgs = new Array(oldArgs.length);
          for ( var i = 0; i < oldArgs.length; i++ ) {
            newArgs[i] = this.inToOr_(oldArgs[i]);
          }
          return predicate.cls_.create({ args: newArgs });
        },
        'foam.mlang.predicate.AbstractPredicate': function(predicate) {
          return predicate.clone();
        },
        'foam.mlang.AbstractExpr': function(expr) {
          return expr.clone();
        },
        'foam.core.Property': function(property) {
          return property;
        }
      }, function(predicate) {
        throw new Error('Unrecognized predicate: ' +
                        ( predicate && predicate.cls_ && predicate.cls_.id ));
      })
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'NoNeqDAO',
  extends: 'foam.dao.ProxyDAO',

  documentation: 'DAO decorator for DAOs that do not support NEQ().',

  requires: [
    'foam.mlang.predicate.Gt',
    'foam.mlang.predicate.Lt',
    'foam.mlang.predicate.Neq',
    'foam.mlang.predicate.Or'
  ],

  methods: [
    function select_(x, sink, skip, limit, order, predicate) {
      if ( ! predicate )
        return this.SUPER(x, sink, skip, limit, order, predicate);

      return this.SUPER(x, sink, skip, limit, order,
                        this.transformNeq_(predicate));
    },
    {
      name: 'transformNeq_',
      documentation: 'Convert NEQ() mLangs in input to OR(LT(), GT()).',
      code: foam.mmethod({
        'foam.mlang.predicate.Neq': function(predicate) {
          return this.Or.create({
            args: [
              this.Lt.create({ arg1: predicate.arg1, arg2: predicate.arg2 }),
              this.Gt.create({ arg1: predicate.arg1, arg2: predicate.arg2 }),
            ]
          }, predicate);
        },
        'foam.mlang.predicate.Binary': function(predicate) {
          return predicate.cls_.create({
            arg1: this.transformNeq_(predicate.arg1),
            arg2: this.transformNeq_(predicate.arg2)
          }, predicate);
        },
        'foam.mlang.predicate.Nary': function(predicate) {
          var oldArgs = predicate.args;
          var newArgs = new Array(oldArgs.length);
          for (var i = 0; i < oldArgs.length; i++) {
            newArgs[i] = this.transformNeq_(oldArgs[i]);
          }
          return predicate.cls_.create({ args: newArgs });
        },
        'foam.mlang.predicate.AbstractPredicate': function(predicate) {
          return predicate.clone();
        },
        'foam.mlang.AbstractExpr': function(expr) {
          return expr.clone();
        },
        'foam.core.Property': function(property) {
          return property;
        }
      }, function(predicate) {
        throw new Error('Unrecognized predicate: ' +
                        (predicate && predicate.cls_ && predicate.cls_.id));
      })
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.parse',
  name: 'QueryParser',

  documentation:
      'Create a query strings to MLangs parser for a particular class.',

  axioms: [
    // Reuse parsers if created for same 'of' class.
    foam.pattern.Multiton.create({ property: 'of' })
  ],

  // TODO(braden): Support KEYWORD predicates and queries on them.

  requires: [
    'foam.mlang.predicate.And',
    'foam.mlang.predicate.ContainsIC',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.Gt',
    'foam.mlang.predicate.Gte',
    'foam.mlang.predicate.Has',
    'foam.mlang.predicate.In',
    'foam.mlang.predicate.InIC',
    'foam.mlang.predicate.Lt',
    'foam.mlang.predicate.Lte',
    'foam.mlang.predicate.Not',
    'foam.mlang.predicate.Or',
    'foam.mlang.predicate.True',
    'foam.parse.Alternate',
    'foam.parse.ImperativeGrammar',
    'foam.parse.LiteralIC',
    'foam.parse.Parsers',
    'foam.parse.PropertyRefinement',
    'foam.parse.StringPS'
  ],

  properties: [
    {
      class: 'Class',
      name: 'of'
    },
    /** An optional input. If this is defined, 'me' is a keyword in the search
     * and can be used for queries like <tt>owner:me</tt>. Note that since
     * there is exactly one parser instance per 'of' value, the value of 'me' is
     * also shared.
     */
    {
      class: 'String',
      name: 'me'
    },
    {
      // The core query parser. Needs a fieldname symbol added to function
      // properly.
      name: 'baseGrammar_',
      value: function(alt, literal, literalIC, not, notChars, optional, range,
          repeat, seq, seq1, str, sym) {
        return {
          START: sym('query'),
          query: sym('or'),

          or: repeat(sym('and'), alt(literalIC(' OR '), literal(' | ')), 1),

          and: repeat(
              sym('expr'),
              alt(literalIC(' AND '),
                  not(alt(literalIC(' OR'), literal(' |')), literal(' '))),
              1),

          expr: alt(
              sym('paren'),
              sym('negate'),
              sym('has'),
              sym('is'),
              sym('equals'),
              sym('before'),
              sym('after'),
              sym('id')
          ),

          paren: seq1(1, '(', sym('query'), ')'),

          negate: alt(
              seq(literal('-'), sym('expr')),
              seq(literalIC('NOT '), sym('expr'))
          ),

          id: sym('number'),

          has: seq(literalIC('has:'), sym('fieldname')),

          is: seq(literalIC('is:'), sym('fieldname')),

          equals: seq(sym('fieldname'), alt(':', '='), sym('valueList')),

          // TODO(kgr): Merge with 'equals'.
          before: seq(sym('fieldname'), alt('<=', '<', literalIC('-before:')),
              sym('value')),
          after: seq(sym('fieldname'), alt('>=', '>', literalIC('-after:')),
              sym('value')),

          value: alt(
              sym('me'),
              sym('date'),
              sym('string'),
              sym('number')
          ),

          compoundValue: alt(
              sym('negateValue'),
              sym('orValue'),
              sym('andValue')
          ),

          negateValue: seq(
              '(',
              alt('-', literalIC('not ')),
              sym('value'),
              ')'
          ),

          orValue: seq(
              '(',
              repeat(sym('value'), alt('|', literalIC(' or '), ' | '), 1),
              ')'
          ),

          andValue: seq(
              '(',
              repeat(sym('value'), alt(literalIC(' and '), ' '), 1),
              ')'
          ),

          valueList: alt(sym('compoundValue'), repeat(sym('value'), ',', 1)),

          me: seq(literalIC('me'), not(sym('char'))),

          date: alt(
              sym('range date'),
              sym('literal date'),
              sym('relative date')
          ),

          'range date': seq(
              alt(sym('literal date'), sym('number')),
              '..',
              alt(sym('literal date'), sym('number'))),

          'literal date': alt(
              // YYYY-MM-DDTHH:MM
              seq(sym('number'), '-', sym('number'), '-', sym('number'), 'T',
                  sym('number'), ':', sym('number')),
              // YYYY-MM-DDTHH
              seq(sym('number'), '-', sym('number'), '-', sym('number'), 'T',
                  sym('number')),
              // YYYY-MM-DD
              seq(sym('number'), '-', sym('number'), '-', sym('number')),
              // YYYY-MM
              seq(sym('number'), '-', sym('number')),
              // YY/MM/DD
              seq(sym('number'), '/', sym('number'), '/', sym('number'))
          ),

          'relative date': seq(literalIC('today'),
                optional(seq('-', sym('number')))),

          string: alt(sym('word'), sym('quoted string')),

          'quoted string': seq1(1, '"',
                repeat(alt(literal('\\"', '"'), notChars('"'))),
                '"'),

          word: repeat(sym('char'), null, 1),

          char: alt(range('a', 'z'), range('A', 'Z'), range('0', '9'), '-', '^',
              '_', '@', '%', '.'),
          number: repeat(range('0', '9'), null, 1)
        };
      }
    },
    {
      name: 'grammar_',
      factory: function() {
        var cls = this.of;
        var fields = [];
        var properties = cls.getAxiomsByClass(foam.core.Property);
        for ( var i = 0; i < properties.length; i++ ) {
          var prop = properties[i];
          fields.push(this.LiteralIC.create({
            s: prop.name,
            value: prop
          }));
          if ( prop.shortName ) {
            fields.push(this.LiteralIC.create({
              s: prop.shortName,
              value: prop
            }));
          }
          if ( prop.aliases ) {
            for ( var j = 0; j < prop.aliases.length; j++ ) {
              fields.push(this.LiteralIC.create({
                s: prop.aliases[j],
                value: prop
              }));
            }
          }
        }
        fields.sort(function(a, b) {
          var d = b.lower.length - a.lower.length;
          if ( d !== 0 ) return d;
          if ( a.lower === b.lower ) return 0;
          return a.lower < b.lower ? 1 : -1;
        });

        var base = foam.Function.withArgs(this.baseGrammar_,
            this.Parsers.create(), this);
        var grammar = {
          __proto__: base,
          fieldname: this.Alternate.create({ args: fields })
        };

        // This is a closure that's used by some of the actions that follow.
        // If a Date-valued field is set to a single number, it expands into a
        // range spanning that whole year.
        var maybeConvertYearToDateRange = function(prop, num) {
          var isDateField = foam.core.Date.isInstance(prop) ||
              foam.core.Date.isInstance(prop);
          var isDateRange = Array.isArray(num) && num[0] instanceof Date;

          if ( isDateField && ! isDateRange ) {
            // Convert the number, a single year, into a date.
            var start = new Date(0); // Jan 1 1970, midnight UTC.
            var end   = new Date(0);
            start.setUTCFullYear(+num);
            end.setUTCFullYear(+num + 1);
            return [ start, end ];
          }
          return num;
        };

        var compactToString = function(v) {
          return v.join('');
        };

        var self = this;

        // TODO: Fix me to just build the object directly.
        var actions = {
          id: function(v) {
            return self.Eq.create({
              arg1: cls.ID,
              arg2: v
            });
          },

          or: function(v) {
            return self.Or.create({ args: v });
          },

          and: function(v) {
            return self.And.create({ args: v });
          },

          negate: function(v) {
            return self.Not.create({ arg1: v[1] });
          },

          number: function(v) {
            return parseInt(compactToString(v));
          },

          me: function() {
            return self.me || '';
          },

          has: function(v) {
            return self.Has.create({ arg1: v[1] });
          },

          is: function(v) {
            return self.Eq.create({
              arg1: v[1],
              arg2: self.True.create()
            });
          },

          before: function(v) {
            // If the property (v[0]) is a Date(Time)Property, and the value
            // (v[2]) is a single number, expand it into a Date range for that
            // whole year.
            v[2] = maybeConvertYearToDateRange(v[0], v[2]);

            // If the value (v[2]) is a Date range, use the appropriate end point.
            if ( Array.isArray(v[2]) && v[2][0] instanceof Date ) {
              v[2] = v[1] === '<=' ? v[2][1] : v[2][0];
            }
            return (v[1] === '<=' ? self.Lte : self.Lt).create({
              arg1: v[0],
              arg2: v[2]
            });
          },

          after: function(v) {
            // If the property (v[0]) is a Date(Time)Property, and the value
            // (v[2]) is a single number, expand it into a Date range for that
            // whole year.
            v[2] = maybeConvertYearToDateRange(v[0], v[2]);

            // If the value (v[2]) is a Date range, use the appropriate end point.
            if ( Array.isArray(v[2]) && v[2][0] instanceof Date ) {
              v[2] = v[1] === '>=' ? v[2][0] : v[2][1];
            }
            return (v[1] === '>=' ? self.Gte : self.Gt).create({
              arg1: v[0],
              arg2: v[2]
            });
          },

          equals: function(v) {
            // v[2], the values, is an array, which might have an 'and', 'or' or
            // 'negated' property on it. The default is 'or'. The partial
            // evaluator for expressions can simplify the resulting Mlang further.
            var prop = v[0];
            var values = v[2];
            // Int is actually the parent of Float and Long, so this captures all
            // numeric properties.
            var isNum = foam.core.Int.isInstance(prop);
            var isFloat = foam.core.Float.isInstance(prop);

            var isDateField = foam.core.Date.isInstance(prop) ||
                foam.core.DateTime.isInstance(prop);
            var isDateRange = Array.isArray(values[0]) &&
                values[0][0] instanceof Date;

            if ( isDateField || isDateRange ) {
              if ( ! isDateRange ) {
                // Convert the single number, representing a year, into a
                // date.
                var start = new Date(0); // Jan 1 1970 at midnight UTC
                var end = new Date(0);
                start.setUTCFullYear(values[0]);
                end.setUTCFullYear(+values[0] + 1);
                values = [ [ start, end ] ];
              }
              return self.And.create({
                args: [
                  self.Gte.create({ arg1: prop, arg2: values[0][0] }),
                  self.Lt.create({ arg1: prop, arg2: values[0][1] })
                ]
              });
            }

            var expr;

            if ( isNum ) {
              for ( var i = 0; i < values.length; i++ ) {
                values[i] = isFloat ? parseFloat(values[i]) :
                    parseInt(values[i]);
              }

              expr = self.In.create({ arg1: prop, arg2: values });
            } else if ( foam.core.Enum.isInstance(prop) ) {
              expr = self.In.create({ arg1: prop, arg2: values });
            } else {
              expr = (v[1] === '=') ?
                  self.InIC.create({ arg1: prop, arg2: values }) :
                  self.Or.create({
                    args: values.map(function(v) {
                      return self.ContainsIC.create({ arg1: prop, arg2: v });
                    })
                  });
            }

            if ( values.negated ) {
              return self.Not.create({ arg1: expr });
            } else if ( values.and ) {
              return self.And.create({
                args: values.map(function(x) {
                  expr.class_.create({ arg1: expr.arg1, arg2: [ x ] });
                })
              });
            } else {
              return expr;
            }
          },

          negateValue: function(v) {
            v.negated = true;
            return v;
          },

          orValue: function(v) {
            v = v[1];
            v.or = true;
            return v;
          },

          andValue: function(v) {
            v = v[1];
            v.and = true;
            return v;
          },

          // All dates are actually treated as ranges. These are arrays of Date
          // objects: [start, end]. The start is inclusive and the end exclusive.
          // Using these objects, both ranges (date:2014, date:2014-05..2014-06)
          // and open-ended ranges (date > 2014-01-01) can be computed higher up.
          // Date formats:
          // YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH, YYYY-MM-DD, YYYY-MM, YY/MM/DD, YYYY
          'literal date': function(v) {
            var start;
            var end;

            // Previously we used just new Date() (ie. right now). That breaks
            // when the current date is eg. 31 but the parsed date wants to be a
            // shorter month (eg. April with 30 days). We would set the month to
            // April, but "April 31" gets corrected to "May 1" and then our
            // parsed dates are wrong.
            //
            // We fix that by using a fixed starting date that won't get
            // adjusted like that.
            start = new Date(2000, 0, 1);
            end   = new Date(2000, 0, 1);
            var ops = [ 'FullYear', 'Month', 'Date', 'Hours', 'Minutes',
                'Seconds' ];
            var defaults = [ 0, 1, 1, 0, 0, 0 ];
            for ( var i = 0; i < ops.length; i++ ) {
              var x = i * 2 > v.length ? defaults[i] : v[i * 2];
              // Adjust for months being 0-based.
              var val = x - (i === 1 ? 1 : 0);
              start['setUTC' + ops[i]](val);
              end['setUTC' + ops[i]](val);
            }

            start.setUTCMilliseconds(0);
            end.setUTCMilliseconds(0);

            // start and end are currently clones of each other. We bump the last
            // portion of the date and set it in end.
            var last = Math.floor(v.length / 2);
            var op = 'UTC' + ops[last];
            end['set' + op](end['get' + op]() + 1);

            return [ start, end ];
          },

          'relative date': function(v) {
            // We turn this into a Date range for the current day, or a day a few
            // weeks before.
            var d = new Date();
            var year  = d.getFullYear();
            var month = d.getMonth();
            var date  = d.getDate();
            if ( v[1] ) date -= v[1][1];

            return actions['literal date']([ year, '-', month + 1, '-', date ]);
          },

          'range date': function(v) {
            // This gives two dates, but each has already been converted to a
            // range. So we take the start of the first and the end of the second.
            var start = Array.isArray(v[0]) ? v[0][0] :
                typeof v[0] === 'number' ? new Date(v[0], 0, 1) : v[0];
            var end = Array.isArray(v[2]) ? v[2][1] :
                typeof v[2] === 'number' ? new Date(+v[2] + 1, 0, 1) : v[2];
            return [ start, end ];
          },

          'quoted string': compactToString,
          word: compactToString
        };

        var g = this.ImperativeGrammar.create({
          symbols: grammar
        });

        g.addActions(actions);
        return g;
      }
    }
  ],

  methods: [
    function parseString(str, opt_name) {
      var query = this.grammar_.parseString(str, opt_name);
      return query && query.partialEval ? query.partialEval() : query;
    }
  ]
});


foam.CLASS({
  package: 'foam.parse',
  name: 'PropertyRefinement',
  refines: 'foam.core.Property',

  properties: [
    {
      class: 'StringArray',
      name: 'aliases'
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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
  package: 'foam.physics',
  name: 'Physical',

  documentation: 'A Physical object has velocity and mass and may optionally be subject to friction and gravity.',

  constants: {
    INFINITE_MASS: 10000
  },

  properties: [
    { class: 'Float', name: 'friction' },
    { class: 'Float', name: 'gravity', value: 1 },
    { class: 'Float', name: 'vx', value: 0 },
    { class: 'Float', name: 'vy', value: 0 },
    {
      class: 'Float',
      name: 'velocity',
      getter: function() { return this.distance(this.vx, this.vy); },
      setter: function(v) { this.setVelocityAndAngle(v, this.angleOfVelocity); }
    },
    {
      class: 'Float',
      name: 'angleOfVelocity',
      getter: function() { return Math.atan2(this.vy, this.vx); },
      setter: function(a) { this.setVelocityAndAngle(this.velocity, a); }
    },
    { class: 'Float', name: 'mass', value: 1 }
  ],

  methods: [
    function distance(dx, dy) {
      return Math.sqrt(dx*dx + dy*dy);
    },

    function applyMomentum(m, a) {
      this.vx += (m * Math.cos(a) / this.mass);
      this.vy += (m * Math.sin(a) / this.mass);
    },

    function momentumAtAngle(a) {
      if ( this.mass === this.INFINITE_MASS ) return 0;
      var v = this.velocityAtAngle(a);
      return v * this.mass;
    },

    function velocityAtAngle(a) {
      if ( this.mass === this.INFINITE_MASS ) return 0;
      return Math.cos(a-this.angleOfVelocity) * this.velocity;
    },

    function setVelocityAndAngle(v, a) {
      this.vx = v * Math.cos(a);
      this.vy = v * Math.sin(a);

      return this;
    },

    function distanceTo(other) {
      return this.distance(this.x-other.x, this.y-other.y);
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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

/** Collision detection manager. **/
foam.CLASS({
  package: 'foam.physics',
  name: 'Collider',

  documentation: 'Apply physics when objects collide.',

  topics: [ 'onTick' ],

  properties: [
    {
      class: 'Boolean',
      name: 'bounceOnWalls'
    },
    {
      name: 'bounds',
      hidden: true
    },
    {
      name: 'children',
      factory: function() { return []; },
      hidden: true
    },
    {
      class: 'Boolean',
      name: 'stopped_',
      value: true,
      hidden: true
    }
  ],

  methods: [
    function updateChild(c) {
      if ( this.bounceOnWalls && this.bounds ) {

        if ( c.left_   < this.bounds.x      ) { c.vx =  Math.abs(c.vx); c.x++; }
        if ( c.top_    < this.bounds.y      ) { c.vy =  Math.abs(c.vy); c.y++; }
        if ( c.right_  > this.bounds.width  ) { c.vx = -Math.abs(c.vx); c.x--; }
        if ( c.bottom_ > this.bounds.height ) { c.vy = -Math.abs(c.vy); c.y--; }
      }
    },

    function updateChildren() {
      var cs = this.children;
      for ( var i = 0 ; i < cs.length ; i++ ) {
        this.updateChild(cs[i]);
      }
    },

    function detectCollisions() {
      /* implicit k-d-tree divide-and-conquer algorithm */
            this.detectCollisions_(0, this.children.length-1, 'x', false, '');

      // TODO: put back above line when properly supports mixing circles and squares
      //this.detectCollisions__(0, this.children.length-1, 'x', false, '');
    },

    function detectCollisions__(start, end) {
      /*
        Simple O(n^2) algorithm, used by more complex algorithm
        once data is partitioned.
      */
      var cs = this.children;
      for ( var i = start ; i <= end ; i++ ) {
        var c1 = cs[i];
        for ( var j = i+1 ; j <= end ; j++ ) {
          var c2 = cs[j];
          if ( c1.intersects && c1.intersects(c2) ) this.collide(c1, c2);
        }
      }
    },

    function choosePivot(start, end, axis) {
      var p = 0, cs = this.children, n = end-start;
      for ( var i = start ; i <= end ; i++ ) p += cs[i][axis] / n;
      return p;
    },

    // TODO: Add support for rectangular objects
    function detectCollisions_(start, end, axis, oneD) {
      if ( start >= end ) return;

      var cs = this.children;
      var pivot = this.choosePivot(start, end, axis);
      var nextAxis = oneD ? axis : axis === 'x' ? 'y' : 'x' ;

      var p = start;
      for ( var i = start ; i <= end ; i++ ) {
        var c = cs[i];
        if ( c[axis] - c.radius < pivot ) {
          var t = cs[p];
          cs[p] = c;
          cs[i] = t;
          p++;
        }
      }

      if ( p === end + 1 ) {
        if ( oneD ) {
          this.detectCollisions__(start, end);
        } else {
          this.detectCollisions_(start, end, nextAxis, true);
        }
      } else {
        this.detectCollisions_(start, p-1, nextAxis, oneD);

        p--;
        for ( var i = p ; i >= start ; i-- ) {
          var c = cs[i];
          if ( c[axis] + c.radius > pivot ) {
            var t = cs[p];
            cs[p] = c;
            cs[i] = t;
            p--;
          }
        }
        if ( p === start-1 ) {
          if ( oneD ) {
            this.detectCollisions__(start, end);
          } else {
            this.detectCollisions_(start, end, nextAxis, true);
          }
        } else {
          this.detectCollisions_(p+1, end, nextAxis, oneD);
        }
      }
    },

    // TODO: add support for rectangles
    function collide(c1, c2) {
      c1.collideWith && c1.collideWith(c2);
      c2.collideWith && c2.collideWith(c1);

      if ( ! c1.mass || ! c2.mass ) return;

      var a  = Math.atan2(c2.y-c1.y, c2.x-c1.x);
      var m1 =  c1.momentumAtAngle(a);
      var m2 = -c2.momentumAtAngle(a);
      var m  = ( m1 + m2 )/2;

      // ensure a minimum amount of momentum so that objects don't overlap
      if ( m >= 0 ) {
        m = Math.max(1, m);
        var tMass = c1.mass + c2.mass;
        c1.applyMomentum(-m * c2.mass/tMass, a);
        c2.applyMomentum( m * c1.mass/tMass, a);
      }
    },

    // add one or more components to be monitored for collisions
    function add() {
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        this.children.push(arguments[i]);
      }
      return this;
    },

    function findChildAt(x, y) {
      var c2 = { x: x, y: y, r: 1 };

      var cs = this.children;
      // Start from the end to find the child in the foreground
      for ( var i = cs.length-1 ; i >= 0 ; i-- ) {
        var c1 = cs[i];
        if ( c1.intersects(c2) ) return c1;
      }
    },

    function selectChildrenAt(x, y) {
      var c2 = { x: x, y: y, r: 1 };

      var children = [];
      var cs = this.children;
      for ( var i = 0 ; i < cs.length ; i++ ) {
        var c1 = cs[i];
        if ( c1.intersects(c2) ) children.push(c1);
      }
      return children;
    },

    function remove() {
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        foam.Array.remove(this.children, arguments[i]);
      }
      return this;
    },

    function detach() {
      this.stopped_ = true;
      this.children = [];
    }
  ],

  actions: [
    {
      name: 'start',
      isEnabled: function(stopped_) { return stopped_; },
      code: function start() {
        this.stopped_ = false;
        this.tick();
      }
    },
    {
      name: 'stop',
      isEnabled: function(stopped_) { return ! stopped_; },
      code: function start() { this.stopped_ = true; }
    }
  ],

  listeners: [
    {
      name: 'tick',
      isFramed: true,
      code: function tick() {
        if ( this.stopped_ ) return;
        this.onTick.pub();
        this.detectCollisions();
        this.updateChildren();

        this.tick();
      }
    }
  ]
});
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
  package: 'foam.physics',
  name: 'PhysicsEngine',
  extends: 'foam.physics.Collider',

  documentation: 'PhysicsEngine is a sub-type of Collider which adds support for friction and gravity.',

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
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.blob',
  name: 'Blob',

  properties: [
    {
      class: 'Long',
      name: 'size'
    }
  ],

  methods: [
    {
      name: 'read',
      returns: 'Promise',
      args: [
        {
          name: 'buffer',
        },
        {
          name: 'offset',
          of: 'Long'
        }
      ]
    }
  ]
});

foam.CLASS({
  package: 'foam.blob',
  name: 'AbstractBlob',
  implements: ['foam.blob.Blob'],
  methods: [
    function pipe(writeFn) {
      var self = this;

      var offset = 0;
      var buf = Buffer.alloc(8192 * 4);
      var limit = self.size;

      function a() {
        if ( offset > limit ) {
          throw 'Offest beyond limit?';
        }

        if ( offset == limit ) return;

        return self.read(buf, offset).then(function(buf2) {
          offset += buf2.length;
          return writeFn(Buffer.from(buf2));
        }).then(a);
      };

      return a();
    },
    function slice(offset, length) {
      return foam.blob.SubBlob.create({
        parent: this,
        offset: offset,
        size: length
      });
    }
  ]
});

foam.CLASS({
  package: 'foam.blob',
  name: 'SubBlob',
  extends: 'foam.blob.AbstractBlob',
  properties: [
    {
      name: 'parent',
    },
    {
      name: 'offset'
    },
    {
      name: 'size',
      assertValue: function(value) {
        foam.assert(this.offset + value <= this.parent.size, 'Cannot create sub blob beyond end of parent.');
      }
    }
  ],
  methods: [
    function read(buffer, offset) {
      if ( buffer.length > this.size - offset) {
        buffer = buffer.slice(0, this.size - offset);
      }

      return this.parent.read(buffer, offset + this.offset);
    },
    function slice(offset, length) {
      return foam.blob.SubBlob.create({
        parent: this.parent,
        offset: this.offset + offset,
        size: length
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.blob',
  name: 'BlobBlob',
  extends: 'foam.blob.AbstractBlob',
  properties: [
    'blob',
    {
      name: 'size',
      factory: function() {
        return this.blob.size;
      }
    }
  ],
  methods: [
    function read(buffer, offset) {
      var self = this;
      var reader = new FileReader();

      var b = this.blob.slice(offset, offset + buffer.length);

      return new Promise(function(resolve, reject) {
        reader.onload = function(e) {
          resolve(e.result);
        };

        reader.onerror = function(e) {
          reject(e);
        };

        reader.readAsArrayBuffer(b);
      });
    }
  ]
});

foam.CLASS({
  package: 'foam.blob',
  name: 'IdentifiedBlob',
  extends: 'foam.blob.AbstractBlob',
  imports: [
    'blobService?'
  ],
  properties: [
    {
      class: 'String',
      name: 'id'
    },
    {
      name: 'delegate',
      transient: true,
      factory: function() {
        return this.blobService.find(this.id);
      }
    }
  ],
  methods: [
    function compareTo(other) {
      return foam.blob.IdentifiedBlob.isInstance(other) && other.id == this.id;
    },
    function read(buffer, offset) {
      return this.delegate.then(function(d) {
        return d.read(buffer, offset);
      });
    }
  ]
});

foam.CLASS({
  package: 'foam.core',
  name: 'Blob',
  extends: 'foam.core.FObjectProperty',

  properties: [
    [ 'of', 'foam.blob.Blob' ],
    [ 'tableCellView', function() {} ],
    [ 'view', { class: 'foam.u2.view.BlobView' } ]
  ]
});


foam.CLASS({
  package: 'foam.blob',
  name: 'ClientBlob',
  extends: 'foam.blob.AbstractBlob',

  properties: [
    {
      class: 'Stub',
      of: 'foam.blob.Blob',
      name: 'box'
    }
  ]
});

foam.CLASS({
  package: 'foam.blob',
  name: 'FdBlob',
  extends: 'foam.blob.AbstractBlob',

  properties: [
    {
      name: 'fd'
    },
    {
      class: 'Long',
      name: 'size',
      expression: function(fd) {
        return require('fs').fstatSync(fd).size;
      }
    }
  ],

  methods: [
    function read(buffer, inOffset) {
      inOffset = inOffset || 0;
      var self = this;
      var outOffset = 0;
      var length = Math.min(buffer.length, this.size - inOffset);

      if ( length < buffer.length ) buffer = buffer.slice(0, length);

      return new Promise(function(resolve, reject) {
        function onRead(err, bytesRead, buffer) {
          if ( err ) {
            reject(err);
            return;
          }

          outOffset += bytesRead;
          inOffset += bytesRead;

          if ( outOffset < length ) {
            throw new Error('Does this ever happen.');
//            require('fs').read(self.fd, buffer, outOffset, length - outOffset, inOffset, onRead);
          } else {
            resolve(buffer);
          }
        }

        require('fs').read(self.fd, buffer, outOffset, length - outOffset, inOffset, onRead);
      });
    }
  ]
});


if ( foam.isServer ) {

foam.CLASS({
  package: 'foam.blob',
  name: 'BlobStore',

  properties: [
    {
      class: 'String',
      name: 'root'
    },
    {
      class: 'String',
      name: 'tmp',
      expression: function(root) {
        return root + require('path').sep + 'tmp';
      }
    },
    {
      class: 'String',
      name: 'sha256',
      expression: function(root) {
        return root + require('path').sep + 'sha256';
      }
    },
    {
      class: 'Boolean',
      name: 'isSet',
      value: false
    }
  ],

  methods: [
    function setup() {
      if ( this.isSet ) return;

      var parsed = require('path').parse(this.root);

      if ( ! require('fs').statSync(parsed.dir).isDirectory() ) {
        throw new Error(parsed.dir + ' is not a directory.');
      }

      this.ensureDir(this.root);
      this.ensureDir(this.tmp);
      this.ensureDir(this.sha256);

      this.isSet = true;
    },

    function ensureDir(path) {
      var stat;

      try {
        stat = require('fs').statSync(path);
        if ( stat && stat.isDirectory() ) return;
      } catch(e) {
        if ( e.code === 'ENOENT' ) return require('fs').mkdirSync(path);

        throw e;
      }
    },

    function allocateTmp() {
      var fd;
      var path;
      //      var name = Math.floor(Math.random() * 0xFFFFFF)
      var name = 1;
      var self = this;

      return new Promise(function aaa(resolve, reject) {
        path = self.tmp + require('path').sep + (name++);
        fd = require('fs').open(path, 'wx', function onOpen(err, fd) {
          if ( err && err.code !== 'EEXIST' ) {
            reject(err);
            return;
          }

          if ( err ) aaa(resolve, reject);
          else resolve({ path: path, fd: fd});
        });
      });
    },

    function put(obj) {
      this.setup();
      // This process could probably be sped up a bit by
      // requesting chunks of the incoming blob in advance,
      // currently we wait until they're put into the write-stream's
      // buffer before requesitng the next chunk.

      var hash = require('crypto').createHash('sha256');

      var bufsize = 8192;
      var buffer = Buffer.alloc(bufsize);

      var size = obj.size
      var remaining = size;
      var offset = 0;
      var self = this;

      var chunks = Math.ceil(size / bufsize);

      function chunkOffset(i) {
        return i * bufsize;
      }

      var tmp;

      function writeChunk(chunk) {
        return obj.read(buffer, chunkOffset(chunk)).then(function(buf) {
          hash.update(buf);
          return new Promise(function(resolve, reject) {
            require('fs').write(tmp.fd, buf, 0, buf.length, function cb(err, written, buffer) {
              if ( err ) {
                reject(err);
                return;
              }

              if ( written !== buf.length ) {
                console.warn("Didn't write entire chunk, does this ever happen?");
                require('fs').write(tmp.fd, buf.slice(written), cb);
                return;
              }

              resolve();
            });
          });
        });
      }

      var chunk = 0;
      return this.allocateTmp().then(function(tmpfile) {
        tmp = tmpfile;
      }).then(function a() {
        if ( chunk < chunks ) return writeChunk(chunk++).then(a);
      }).then(function() {
        return new Promise(function(resolve, reject) {
          require('fs').close(tmp.fd, function() {
            var digest = hash.digest('hex');
            require('fs').rename(tmp.path, self.sha256 + require('path').sep + digest, function(err) {
              if ( err ) {
                reject(err);
                return;
              }
              resolve(digest);
            });
          });
        });
      });
    },

    function find(id) {
      this.setup();
      if ( id.indexOf(require('path').sep) != -1 ) {
        return Promise.reject(new Error("Invalid file name"));
      }

      var self = this;

      return new Promise(function(resolve, reject) {
        require('fs').open(self.sha256 + require('path').sep + id, "r", function(err, fd) {
          if ( err ) {
            if ( err.code == 'ENOENT' ) {
              resolve(null);
              return;
            }

            reject(err);
            return;
          }
          resolve(foam.blob.FdBlob.create({ fd: fd }));
        });
      });
    }
  ]
});

}

foam.CLASS({
  package: 'foam.blob',
  name: 'RestBlobService',
  documentation: 'Implementation of a BlobService against a REST interface.',
  requires: [
    'foam.net.HTTPRequest',
    'foam.blob.BlobBlob',
    'foam.blob.IdentifiedBlob'
  ],
  properties: [
    {
      class: 'String',
      name: 'address'
    }
  ],
  methods: [
    function put(blob) {
      if ( this.IdentifiedBlob.isInstance(blob) ) {
        // Already stored.
        return Promise.resolve(blob);
      }

      var req = this.HTTPRequest.create();
      req.fromUrl(this.address);
      req.method = 'PUT';
      req.payload = blob;

      var self = this;

      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(id) {
        return self.IdentifiedBlob.create({ id: id });
      });
    },
    function urlFor(blob) {
      if ( ! foam.blob.IdentifiedBlob.isInstance(blob) ) {
        return null;
      }

      return this.address + '/' + blob.id;
    },
    function find(id) {
      var req = this.HTTPRequest.create();
      req.fromUrl(this.address + '/' + id);
      req.method = 'GET';
      req.responseType = 'blob';

      var self = this;
      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(blob) {
        return self.BlobBlob.create({
          blob: blob
        });
      });
    }
  ]
});

foam.CLASS({
  package: 'foam.blob',
  name: 'BlobServiceDecorator',
  implements: ['foam.dao.DAODecorator'],
  imports: [
    'blobService'
  ],
  properties: [
    {
      class: 'Class',
      name: 'of'
    },
    {
      name: 'props',
      expression: function(of) {
        return of.getAxiomsByClass(foam.core.Blob);
      }
    }
  ],
  methods: [
    function write(X, dao, obj, existing) {
      var i = 0;
      var props = this.props;
      var self = this;

      return Promise.resolve().then(function a() {
        var prop = props[i++];

        if ( ! prop ) return obj;

        var blob = prop.f(obj);

        if ( ! blob ) return obj;

        return self.blobService.put(blob).then(function(b) {
          prop.set(obj, b);
          return a();
        });
      });
    },
    function read(X, dao, obj) {
      return Promise.resolve(obj);
    },
    function remove(X, dao, obj) {
      return Promise.resolve(obj);
    }
  ]
});


foam.CLASS({
  package: 'foam.blob',
  name: 'TestBlobService',
  requires: [
    'foam.blob.IdentifiedBlob',
    'foam.blob.BlobBlob'
  ],
  properties: [
    {
      class: 'Map',
      name: 'blobs'
    },
    {
      class: 'Int',
      name: 'nextId',
      value: 1
    }
  ],
  methods: [
    function put(file) {
      var id = this.nextId++;
      this.blobs[id] = file;
      return Promise.resolve(this.IdentifiedBlob.create({ id: id }));
    },
    function find(id) {
      return Promise.resolve(this.blobs[id] ?
                             this.BlobBlob.create({ blob: this.blobs[id] }) :
                             null);
    },
    function urlFor(id) {
      return this.blobs[id] ?
        URL.createObjectURL(this.blobs[id]) :
        null;
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.dao.node',
  name: 'JSONFileDAO',
  extends: 'foam.dao.ArrayDAO',

  imports: [ 'warn' ],

  properties: [
    {
      class: 'String',
      name: 'path',
      factory: function() {
        return this.of.name + '.json';
      }
    },
    {
      name: 'fs_',
      factory: function() {
        return require('fs');
      }
    },
    {
      class: 'Array',
      name: 'futures_'
    }
  ],

  methods: [
    function init() {
      var data;
      try {
        data = this.fs_.readFileSync(this.path).toString();
      } catch(e) { }

      if ( data && data.length )
        this.array = foam.json.parseString(data, this);

      this.on.put.sub(this.onUpdate);
      this.on.remove.sub(this.onUpdate);
    },

    function put(o) {
      return this.SUPER(o).then(this.getPromise_.bind(this, o));
    },

    function remove(o) {
      var self     = this;
      var startLen = self.array.length;

      return self.SUPER(o).then(function() {
        // Resolve after async update iff something was removed.
        return self.array.length < startLen ?
          self.getPromise_(o) :
          o ;
      });
    },

    function getPromise_(o) {
      var future;
      var promise = new Promise(function(resolve) {
        future = resolve.bind(this, o);
      });
      this.futures_.push(future);
      return promise;
    }
  ],

  listeners: [
    {
      name: 'onUpdate',
      isMerged: 100,
      code: function() {
        this.fs_.writeFile(
            this.path,
            foam.json.stringify(this.array),
            this.onUpdateComplete);
      }
    },

    function onUpdateComplete() {
      var futures = this.futures_;
      for ( var i = 0 ; i < futures.length ; i++ ) {
        futures[i]();
      }
      this.futures_ = [];
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.encodings',
  name: 'UTF8',

  properties: [
    {
      name: 'charcode'
    },
    {
      class: 'Int',
      name: 'remaining',
      value: 0
    },
    {
      class: 'String',
      name: 'string'
    }
  ],

  methods: [
    function reset() {
      this.string = '';
      this.remaining = 0;
      this.charcode = null;
    },

    function put(byte) {
      if ( byte instanceof ArrayBuffer ) {
        var data = new Uint8Array(byte);
        this.put(data);
        return;
      }

      if ( byte instanceof Uint8Array ) {
        for ( var i = 0 ; i < byte.length ; i++ ) {
          this.put(byte[i]);
        }
        return;
      }

      if (this.charcode == null) {
        this.charcode = byte;
        if (!(this.charcode & 0x80)) {
          this.remaining = 0;
          this.charcode = (byte & 0x7f) << (6 * this.remaining);
        } else if ((this.charcode & 0xe0) == 0xc0) {
          this.remaining = 1;
          this.charcode = (byte & 0x1f) << (6 * this.remaining);
        } else if ((this.charcode & 0xf0) == 0xe0) {
          this.remaining = 2;
          this.charcode = (byte & 0x0f) << (6 * this.remaining);
        } else if ((this.charcode & 0xf8) == 0xf0) {
          this.remaining = 3;
          this.charcode = (byte & 0x07) << (6 * this.remaining);
        } else if ((this.charcode & 0xfc) == 0xf8) {
          this.remaining = 4;
          this.charcode = (byte & 0x03) << (6 * this.remaining);
        } else if ((this.charcode & 0xfe) == 0xfc) {
          this.remaining = 5;
          this.charcode = (byte & 0x01) << (6 * this.remaining);
        } else throw 'Bad charcode value';
      } else if ( this.remaining > 0 ) {
        this.remaining--;
        this.charcode |= (byte & 0x3f) << (6 * this.remaining);
      }

      if ( this.remaining == 0 ) {
        this.string += String.fromCodePoint(this.charcode);
        this.charcode = undefined;
      }
    }
   ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.net.web',
  name: 'WebSocket',

  requires: [ 'foam.json.Outputter' ],

  topics: [
    'message',
    'connected',
    'disconnected'
  ],

  properties: [
    {
      name: 'uri'
    },
    {
      name: 'socket',
      transient: true
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],

  methods: [
    function send(msg) {
      // Apparently you can't catch exceptions from calling .send()
      // when the socket isn't open.  So we'll try to predict an exception
      // happening and throw early.
      //
      // There could be a race condition here if the socket
      // closes between our check and .send().
      if ( this.socket.readyState !== this.socket.OPEN ) {
        throw new Error('Socket is not open');
      }
      this.socket.send(this.outputter.stringify(msg));
    },

    function connect() {
      var socket = this.socket = new WebSocket(this.uri);
      var self = this;

      return new Promise(function(resolve, reject) {
        function onConnect() {
          socket.removeEventListener('open', onConnect);
          resolve(self);
        }
        function onConnectError(e) {
          socket.removeEventListener('error', onConnectError);
          reject();
        }
        socket.addEventListener('open', onConnect);
        socket.addEventListener('error', onConnectError);

        socket.addEventListener('open', function() {
          self.connected.pub();
        });
        socket.addEventListener('message', self.onMessage);
        socket.addEventListener('close', function() {
          self.disconnected.pub();
        });
      });
    }
  ],

  listeners: [
    {
      name: 'onMessage',
      code: function(msg) {
        this.message.pub(msg.data);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'WebSocketService',

  requires: [
    'foam.box.Message',
    'foam.box.RegisterSelfMessage',
    'foam.json.Parser',
    'foam.net.web.WebSocket'
  ],
  imports: [ 'creationContext' ],

  properties: [
    {
      name: 'delegate'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Parser',
      name: 'parser',
      factory: function() {
        return this.Parser.create({
          strict: true,
          creationContext: this.creationContext
        });
      }
    }
  ],

  methods: [
    function addSocket(socket) {
      var sub1 = socket.message.sub(function onMessage(s, _, msgStr) {
        var msg = this.parser.parseString(msgStr);

        if ( ! this.Message.isInstance(msg) ) {
          console.warn('Got non-message:', msg, msgStr);
        }

        if ( this.RegisterSelfMessage.isInstance(msg.object) ) {
          var named = foam.box.NamedBox.create({
            name: msg.object.name
          });

          named.delegate = foam.box.RawWebSocketBox.create({
            socket: socket
          });
        } else {
          this.delegate.send(msg);
        }
      }.bind(this));

      socket.disconnected.sub(function(s) {
        s.detach();
        sub1.detach();
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'HTTPResponse',

  topics: [
    'data',
    'err',
    'end'
  ],

  properties: [
    {
      class: 'Int',
      name: 'status'
    },
    {
      class: 'String',
      name: 'responseType'
    },
    {
      class: 'Map',
      name: 'headers'
    },
    {
      name: 'payload',
      factory: function() {
        if ( this.streaming ) {
          return null;
        }

        switch ( this.responseType ) {
          case 'text':        return this.resp.text();
          case 'blob':        return this.resp.blob();
          case 'arraybuffer': return this.resp.arraybuffer();
          case 'json':        return this.resp.json();
        }

        // TODO: responseType should be an enum and/or have validation
        throw new Error('Unsupported response type: ' + this.responseType);
      }
    },
    {
      class: 'Boolean',
      name: 'streaming',
      value: false
    },
    {
      class: 'Boolean',
      name: 'success',
      expression: function(status) {
        return status >= 200 && status <= 299;
      }
    },
    {
      name: 'resp',
      postSet: function(_, r) {
        var iterator = r.headers.entries();
        var next = iterator.next();
        while ( ! next.done ) {
          this.headers[next.value[0]] = next.value[1];
          next = iterator.next();
        }
        this.status = r.status;
      }
    }
  ],

  methods: [
    function start() {
      var reader = this.resp.body.getReader();
      this.streaming = true;

      var onError = foam.Function.bind(function(e) {
        this.err.pub();
        this.end.pub();
      }, this);

      var onData = foam.Function.bind(function(e) {
        if ( e.value ) {
          this.data.pub(e.value);
        }

        if ( e.done || ! this.streaming) {
          this.end.pub();
          return this;
        }
        return reader.read().then(onData, onError);
      }, this);

      return reader.read().then(onData, onError);
    },

    function stop() {
      this.streaming = false;
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'HTTPRequest',

  requires: [
    'foam.net.web.HTTPResponse',
    'foam.blob.Blob',
    'foam.blob.BlobBlob'
  ],

  topics: [
    'data'
  ],

  properties: [
    {
      class: 'String',
      name: 'hostname'
    },
    {
      class: 'Int',
      name: 'port'
    },
    {
      class: 'String',
      name: 'protocol',
      preSet: function(old, nu) {
        return nu.replace(':', '');
      }
    },
    {
      class: 'String',
      name: 'path',
      preSet: function(old, nu) {
        if ( ! nu.startsWith('/') ) return '/' + nu;
        return nu;
      }
    },
    {
      class: 'String',
      name: 'url'
    },
    {
      class: 'String',
      name: 'method',
      value: 'GET'
    },
    {
      class: 'Map',
      name: 'headers'
    },
    {
      name: 'payload'
    },
    {
      // TODO: validate acceptable types
      class: 'String',
      name: 'responseType',
      value: 'text'
    },
    {
      class: 'String',
      name: 'contentType',
      factory: function() { return this.responseType; }
    },
    {
      class: 'String',
      name: 'mode',
      value: 'cors'
    }
  ],

  methods: [
    function fromUrl(url) {
      var u = new URL(url);
      this.protocol = u.protocol.substring(0, u.protocol.length-1);
      this.hostname = u.hostname;
      if ( u.port ) this.port = u.port;
      this.path = u.pathname + u.search;
      return this;
    },

    function send() {
      if ( this.url ) {
        this.fromUrl(this.url);
      }
      this.addContentHeaders();

      var self = this;

      var headers = new Headers();
      for ( var key in this.headers ) {
        headers.set(key, this.headers[key]);
      }

      var options = {
        method: this.method,
        headers: headers,
        mode: this.mode,
        redirect: "follow",
        credentials: "same-origin"
      };

      if ( this.payload ) {
        if ( this.BlobBlob.isInstance(this.payload) ) {
          options.body = this.payload.blob;
        } else if ( this.Blob.isInstance(this.payload) ) {
          foam.assert(false, 'TODO: Implemented sending of foam.blob.Blob over HTTPRequest.');
        } else {
          options.body = this.payload;
        }
      }

      var request = new Request(
          this.protocol + "://" +
          this.hostname +
          ( this.port ? ( ':' + this.port ) : '' ) +
          this.path,
          options);

      return fetch(request).then(function(resp) {
        var resp = this.HTTPResponse.create({
          resp: resp,
          responseType: this.responseType
        });

        if ( resp.success ) return resp;
        throw resp;
      }.bind(this));
    },
    function addContentHeaders() {
      // Specify Content-Type header when it can be deduced.
      if ( ! this.headers['Content-Type'] ) {
        switch ( this.contentType ) {
          case 'text':
          this.headers['Content-Type'] = 'text/plain';
          break;
          case 'json':
          this.headers['Content-Type'] = 'application/json';
          break;
        }
      }
      // Specify this.contentType when it can be deduced.
      if ( ! this.headers['Accept'] ) {
        switch ( this.contentType ) {
          case 'json':
          this.headers['Accept'] = 'application/json';
          break;
        }
      }
    }
  ]
});
// Registering BaseHTTPRequest facilitates decoration when HTTPRequest has been
// re-overridden.
foam.register(foam.lookup('foam.net.web.HTTPRequest'),
              'foam.net.web.BaseHTTPRequest');


foam.CLASS({
  package: 'foam.net.web',
  name: 'EventSource',

  requires: [
    'foam.parse.Grammar',
    'foam.net.web.HTTPRequest',
    'foam.encodings.UTF8'
  ],

  imports: [
    'setTimeout',
    'clearTimeout'
  ],

  topics: [
    {
      name: 'message'
    }
  ],

  properties: [
    {
      name: 'grammar',
      factory: function() {
        var self = this;
        return this.Grammar.create({
          symbols: function(repeat, alt, sym, notChars, seq) {
            return {
              START: sym('line'),

              line: alt(
                sym('event'),
                sym('data')),

              event: seq('event: ', sym('event name')),
              'event name': repeat(notChars('\r\n')),

              data: seq('data: ', sym('data payload')),
              'data payload': repeat(notChars('\r\n'))
            }
          }
        }).addActions({
          'event name': function(v) {
            self.eventName = v.join('');
          },
          'data payload': function(p) {
            self.eventData = p.join('');
          }
        });
      }
    },
    {
      class: 'String',
      name: 'uri'
    },
    {
      class: 'Boolean',
      name: 'running',
      value: false
    },
    {
      name: 'resp'
    },
    {
      name: 'decoder',
      factory: function() {
        return this.UTF8.create()
      }
    },
    {
      name: 'retryTimer'
    },
    {
      class: 'Int',
      name: 'delay',
      preSet: function(_, a) {
        if ( a > 30000 ) return 30000;
        return a;
      },
      value: 1
    },
    'eventData',
    'eventName'
  ],

  methods: [
    function start() {
      var req = this.HTTPRequest.create({
        method: "GET",
        url: this.uri,
        headers: {
          'accept': 'text/event-stream'
        }
      });

      this.running = true;
      this.keepAlive();
      req.send().then(function(resp) {
        if ( ! resp.success ) {
          this.onError();
          return;
        }

        this.clearProperty('decoder');
        resp.data.sub(this.onData);
        resp.end.sub(this.onError);
        this.resp = resp;
        resp.start();
      }.bind(this), this.onError);
    },

    function keepAlive() {
      if ( this.retryTimer ) {
        this.clearTimeout(this.retryTimer);
      }

      this.retryTimer = this.setTimeout(foam.Function.bind(function() {
        this.retryTimer = 0;
        this.onError();
      }, this), 30000);
    },

    function close() {
      this.running = false;
      this.resp.stop();
    },

    function dispatchEvent() {
      // Known possible events names
      // put
      // patch
      // keep-alive
      // cancel
      // auth revoked

      this.message.pub(this.eventName, this.eventData);
      this.eventName = null;
      this.eventData = null;
    },

    function processLine(line) {
      // TODO: This can probably be simplified by using state machine based
      // parsers, but in the interest of saving time we're going to do it line
      // by line for now.  Something we know works from previous interations.

      if ( line.length == 0 ) {
        this.dispatchEvent();
        return;
      }

      this.grammar.parseString(line);
    }
  ],

  listeners: [
    function onData(s, _, data) {
      this.delay = 1;
      this.keepAlive();

      this.decoder.put(data);
      var string = this.decoder.string;
      while ( string.indexOf('\n') != -1 ) {
        var line = string.substring(0, string.indexOf('\n'));
        this.processLine(line);
        string = string.substring(string.indexOf('\n') + 1);
      }
      this.decoder.string = string;
    },

    function onError() {
      this.delay *= 2;
      this.setTimeout(this.onEnd, this.delay);
    },

    function onEnd() {
      if ( this.running ) {
        this.start();
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'XMLHTTPRequest',
  extends: 'foam.net.web.HTTPRequest',

  requires: [
    'foam.net.web.XMLHTTPResponse as HTTPResponse'
  ],

  methods: [
    function send() {
      if ( this.url ) {
        this.fromUrl(this.url);
      }

      var xhr = new XMLHttpRequest();
      xhr.open(
          this.method,
          this.protocol + "://" +
          this.hostname + ( this.port ? ( ':' + this.port ) : '' ) +
          this.path);
      xhr.responseType = this.responseType;
      for ( var key in this.headers ) {
        xhr.setRequestHeader(key, this.headers[key]);
      }

      var self = this;
      return new Promise(function(resolve, reject) {
        xhr.addEventListener('readystatechange', function foo() {
          if ( this.readyState === this.LOADING ||
               this.readyState === this.DONE ) {
            this.removeEventListener('readystatechange', foo);
            var resp = self.HTTPResponse.create({
              xhr: this
            });

            if ( resp.success ) resolve(resp);
            else reject(resp);
          }
        });
        xhr.send(self.payload);
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'XMLHTTPResponse',
  extends: 'foam.net.web.HTTPResponse',

  constants: {
    STREAMING_LIMIT: 10 * 1024 * 1024
  },

  properties: [
    {
      name: 'xhr',
      postSet: function(_, xhr) {
        this.status = xhr.status;
        var headers = xhr.getAllResponseHeaders().split('\r\n');
        for ( var i = 0 ; i < headers.length ; i++ ) {
          var sep = headers[i].indexOf(':');
          var key = headers[i].substring(0, sep);
          var value = headers[i].substring(sep+1);
          this.headers[key.trim()] = value.trim();
        }
        this.responseType = xhr.responseType;
      }
    },
    {
      name: 'payload',
      factory: function() {
        if ( this.streaming ) {
          return null;
        }

        var self = this;
        var xhr = this.xhr;

        if ( xhr.readyState === xhr.DONE )
          return Promise.resolve(xhr.response);
        else
          return new Promise(function(resolve, reject) {
            xhr.addEventListener('readystatechange', function() {
              if ( this.readyState === this.DONE )
                resolve(this.response);
            });
          });
      }
    },
    {
      class: 'Int',
      name: 'pos',
      value: 0
    }
  ],

  methods: [
    function start() {
      this.streaming = true;
      this.xhr.addEventListener('loadend', function() {
        this.done.pub();
      }.bind(this));

      this.xhr.addEventListener('progress', function() {
        var substr = this.xhr.responseText.substring(this.pos);
        this.pos = this.xhr.responseText.length;
        this.data.pub(substr);

        if ( this.pos > this.STREAMING_LIMIT ) {
          this.xhr.abort();
        }
      }.bind(this));
    }
  ]
});


foam.CLASS({
  package: 'foam.net.web',
  name: 'SafariEventSource',
  extends: 'foam.net.web.EventSource',

  requires: [
    'foam.net.web.XMLHTTPRequest as HTTPRequest'
  ],

  properties: [
    {
      class: 'String',
      name: 'buffer'
    }
  ],

  listeners: [
    function onData(s, _, data) {
      this.delay = 1;
      this.keepAlive();

      this.buffer += data;
      var string = this.buffer;

      while ( string.indexOf('\n') != -1 ) {
        var line = string.substring(0, string.indexOf('\n'));
        this.processLine(line);
        string = string.substring(string.indexOf('\n') + 1);
      }

      this.buffer = string;
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.net.node',
  name: 'Frame',

  properties: [
    ['fin', 1],
    ['rsv1',0],
    ['rsv2',0],
    ['rsv3',0],
    ['opcode',1],
    ['mask',0],
    'maskingKey',
    'buffer',
    ['bufferPos', 0],
    ['needed', 0],
    ['length', 0],
    ['length_', 0],
    'headerState',
    'state',
    {
      class: 'Boolean',
      name: 'framing',
      value: true
    },
    {
      class: 'Boolean',
      name: 'finished',
      value: false
    }
  ],

  methods: [
    function init() {
      this.headerState = this.frameHeader;
      this.state = this.readHeader;
    },

    function toData() {
      this.length = this.buffer.length;
      var headerSize = this.buffer.length > 65535 ? 10 :
          (this.buffer.length > 125 ? 4 : 2);

      var i = 0;
      var buffer = Buffer.alloc(this.buffer.length + headerSize);
      // FIN = 1, RSV1-3 = 0
      buffer.writeUInt8(
        0x80 +
          this.opcode, i++);

      var length = this.length;
      if ( length > 0xffffffff ) {
        console.error("Too large a frame to support in JS");
      } else if ( length > 65535 ) {
        buffer.writeUInt8(127, i++);
        buffer.writeUInt8(0, i++);
        buffer.writeUInt8(0, i++);
        buffer.writeUInt8(0, i++);
        buffer.writeUInt8(0, i++);
        buffer.writeUInt8((length >> 24) & 0xff, i++)
        buffer.writeUInt8((length >> 16) & 0xff, i++)
        buffer.writeUInt8((length >> 8) & 0xff, i++)
        buffer.writeUInt8((length & 0xff), i++)
      } else if ( length > 125 ) {
        buffer.writeUInt8(126, i++);
        buffer.writeUInt8((length & 0xff00) >> 8, i++)
        buffer.writeUInt8(length & 0xff, i++)
      } else {
        buffer.writeUInt8(length & 0x7f, i++);
      }

      this.buffer.copy(buffer, i);

      return buffer;
    },

    function frameHeader(byte) {
      this.opcode = byte & 0x0f;
      this.fin  = !! ( byte & 0x80 );
      this.rsv1 = !! ( byte & 0x40 );
      this.rsv2 = !! ( byte & 0x20 );
      this.rsv3 = !! ( byte & 0x10 );

      this.headerState = this.maskLength0;
    },

    function maskLength0(byte) {
      this.mask = !! ( byte & 0x80 );
      this.length_ = byte & 0x7f;

      if ( this.length_ == 126 ) {
        this.headerState = this.lengthShort0;
      } else if ( this.length_ === 127 ) {
        this.headerState = this.lengthShort1;
      } else {
        this.headerState = this.maskingKey0;
      }
    },

    function lengthShort0(byte) {
      this.length_ = 0;
      this.length_ += byte << 8;
      this.headerState = this.lengthShort1;
    },

    function lengthShort1(byte) {
      this.length_ += byte;
      this.headerState = this.maskingKey0;
    },

    function lengthLong0(byte) {
      this.length_ = 0;
      if ( byte !== 0 ) this.state = this.tooLarge;
      this.headerState = this.lengthLong1;
    },

    function lengthLong1(byte) {
      if ( byte !== 0 ) this.state = this.tooLarge;
      this.headerState = this.lengthLong2;
    },

    function lengthLong2(byte) {
      if ( byte !== 0 ) this.state = this.tooLarge;
      this.headerState = this.lengthLong3;
    },

    function lengthLong3(byte) {
      if ( byte !== 0 ) this.state = this.tooLarge;
      this.headerState = this.lengthLong4;
    },

    function lengthLong4(byte) {
      this.length_ += byte << 24;
      this.headerState = this.lengthLong5;
    },

    function lengthLong5(byte) {
      this.length_ += byte << 16;
      this.headerState = this.lengthLong6;
    },

    function lengthLong6(byte) {
      this.length_ += byte << 8;
      this.headerState = this.lengthLong7;
    },

    function lengthLong7(byte) {
      this.length_ += byte;
      this.headerState = this.maskingKey0;
    },

    function maskingKey0(byte) {
      this.length = this.length_
      this.buffer = Buffer.alloc(this.length);
      this.bufferPos = 0;
      this.needed = this.length;

      if ( this.mask ) {
        this.masking_key = [];
        this.masking_key.push(byte);
        this.headerState = this.maskingKey1;
      } else {
        this.headerState = this.frameHeader;
        this.state = this.readData;
      }
    },

    function maskingKey1(byte) {
      this.masking_key.push(byte);
      this.headerState = this.maskingKey2;
    },

    function maskingKey2(byte) {
      this.masking_key.push(byte);
      this.headerState = this.maskingKey3;
    },

    function maskingKey3(byte) {
      this.masking_key.push(byte);
      this.headerState = this.frameHeader;
      this.state = this.readData;
    },

    function readHeader(data, i) {
      while ( this.state === this.readHeader &&
              i < data.byteLength ) {
        this.headerState(data.readUInt8(i++));
      }
      return i;
    },

    function readData(data, i) {
      var amount = Math.min(data.length - i, this.needed);
      data.copy(this.buffer, this.bufferPos, i, i + amount);

      if ( this.mask ) {
        for ( var j = this.bufferPos ; j < this.bufferPos + amount; j++ ) {
          this.buffer.writeUInt8(this.buffer.readUInt8(j) ^ this.masking_key[j % 4], j);
        }
      }

      this.bufferPos += amount;
      this.needed -= amount;
      i += amount;

      if ( this.needed == 0 ) {
        this.finished = true;
      }

      return i;
    },

    function tooLarge(data, i) {
      console.error('WebSocket payload too large');
      this.socket.end();
    },

    function onData(data, i) {
      return this.state(data, i);
    }
  ]
});


foam.CLASS({
  package: 'foam.net.node',
  name: 'Socket',

  imports: [
    'me',
    'socketService'
  ],

  requires: [
    'foam.box.RegisterSelfMessage',
    'foam.json.Outputter'
  ],

  topics: [
    'message',
    'disconnect',
    'connect'
  ],

  properties: [
    {
      name: 'remoteAddress'
    },
    {
      name: 'remotePort'
    },
    {
      name: 'socket_',
      postSet: function(o, s) {
        if ( o ) {
          o.removeListener('data', this.onData);
          o.removeListener('close', this.onClose);
          o.removeListener('error', this.onError);
        }
        if ( s ) {
          this.remoteAddress = s.remoteAddress;
          this.remotePort = s.remotePort;
          s.on('data', this.onData);
          s.on('close', this.onClose);
          s.on('error', this.onError);
        }
      }
    },
    {
      class: 'Int',
      name: 'offset',
      value: 0
    },
    {
      name: 'buffer'
    },
    {
      class: 'Int',
      name: 'nextSize',
      value: 0
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],

  methods: [
    function write(msg) {
      var serialized = this.outputter.stringify(msg);
      var size = Buffer.byteLength(serialized);
      var packet = Buffer.alloc(size + 4);
      packet.writeInt32LE(size);
      packet.write(serialized, 4);
      this.socket_.write(packet);
    },

    function connectTo(address) {
      var sep = address.lastIndexOf(':');
      var host = address.substring(0, sep);
      var port = address.substring(sep + 1);
      return new Promise(function(resolve, reject) {
        require('dns').lookup(host, function(err, address, family) {
          host = address || host;
          var socket = new require('net').Socket();
          socket.once('error', function(e) {
            reject(e);
          });
          socket.once('connect', function() {
            this.socket_ = socket;
            this.write(this.RegisterSelfMessage.create({
              name: this.me.name
            }));
            this.socketService.addSocket(this);
            this.connect.pub();
            resolve(this);
          }.bind(this));

          socket.connect(port, host);
        }.bind(this));
      }.bind(this));
    },

    function onMessage() {
      var data = this.buffer.toString();
      this.message.pub(data);
    }
  ],

  listeners: [
    {
      name: 'onData',
      code: function(data) {
        var start = 0;
        var end = data.length;
        var length = data.length;
        var remaining = this.nextSize - this.offset;

        while ( start != data.length ) {
          if ( this.nextSize == 0 ) {
            this.nextSize = data.readInt32LE(start);
            this.buffer = Buffer.alloc(this.nextSize);
            this.offset = 0;
            remaining = this.nextSize - this.offset;
            start += 4;
          }

          var written = data.copy(
              this.buffer,
              this.offset,
              start,
              Math.min(remaining + start, end));

          start += written;
          this.offset += written;

          if ( this.offset == this.nextSize ) {
            this.onMessage();
            this.nextSize = 0;
          }
        }
      }
    },
    {
      name: 'onClose',
      code: function() {
        this.disconnect.pub();
      }
    },
    {
      name: 'onError',
      code: function() {
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.net.node',
  name: 'SocketService',

  requires: [
    'foam.box.Message',
    'foam.box.RegisterSelfMessage',
    'foam.json.Parser',
    'foam.net.node.Socket'
  ],

  imports: [
    'creationContext',
    'error',
    'info'
  ],

  properties: [
    {
      class: 'Boolean',
      name: 'listen',
      value: true
    },
    {
      class: 'Boolean',
      name: 'listening'
    },
    {
      class: 'Int',
      name: 'port',
      value: 7000
    },
    {
      name: 'server'
    },
    {
      name: 'delegate'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Parser',
      name: 'parser',
      factory: function() {
        return this.Parser.create({
          strict: true,
          creationContext: this.creationContext
        });
      }
    }
  ],

  methods: [
    function init() {
      if ( ! this.listen ) return;

      this.setupServer(this.port);
    },

    function setupServer(port) {
      var server = this.server = new require('net').Server();
      this.server.on('connection', this.onConnection);
      this.server.on('error', function(error) {
        this.error('foam.net.node.SocketService: Server error', error);
        server.unref();
        if ( error.code === 'EADDRINUSE' ) {
          var port = Math.floor( 10000 + ( Math.random() * 10000 ) );
          this.info('foam.net.node.SocketService: Retrying on port', port);
          this.setupServer(port);
        }
      }.bind(this));

      if ( this.listen ) {
        this.server.on('listening', function() {
          this.listening = true;
        }.bind(this));
        this.server.listen(this.port = port);
      }
    },

    function addSocket(socket) {
      var s1 = socket.message.sub(function(s, _, mStr) {
        var m = this.parser.parseString(mStr);

        if ( ! this.Message.isInstance(m) ) {
          console.warn('Got non-message:', m, mStr);
        }

        if ( this.RegisterSelfMessage.isInstance(m) ) {
          var named = foam.box.NamedBox.create({
            name: m.name
          });

          named.delegate = foam.box.RawSocketBox.create({
            socket: socket
          });
          return;
        }

        this.delegate && this.delegate.send(m);
      }.bind(this));

      socket.disconnect.sub(function() {
        s1.detach();
      }.bind(this));
    }
  ],

  listeners: [
    {
      name: 'onConnection',
      code: function(socket) {
        socket = this.Socket.create({ socket_: socket });
        this.addSocket(socket);
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.net.node',
  name: 'WebSocket',

  requires: [
    'foam.json.Outputter',
    'foam.net.node.Frame'
  ],

  topics: [
    'message',
    'connected',
    'disconnected'
  ],

  properties: [
    {
      name: 'socket',
      postSet: function(old, s) {
        if ( old ) {
          old.removeListener('data', this.onData);
          old.removeListener('close', this.onClose);
        }
        if ( s ) {
          s.on('data', this.onData);
          s.on('close', this.onClose);
        }
      }
    },
    'opcode',
    'parts',
    'currentFrame',
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],

  methods: [
    function send(data) {
      if ( foam.box.Message.isInstance(data) ) {
        data = this.outputter.stringify(data);
      }

      if ( typeof data == "string" ) {
        var opcode = 1;
        data = Buffer.from(data);
      } else {
        opcode = 2;
      }

      var frame = this.Frame.create({
        fin: 1,
        buffer: data,
        opcode: opcode
      });
      this.socket.write(frame.toData());
    },

    function close() {
      this.socket.end();
    }
  ],

  listeners: [
    {
      name: 'onClose',
      code: function() {
        this.disconnected.pub();
      }
    },
    {
      name: 'onFrame',
      code: function(frame) {
        if ( frame.opcode & 0x8 ) {
          if ( frame.opcode == 8 ) {
            this.socket.end();
          } else if ( frame.opcode == 9 ) {
            var resp = this.Frame.create({
              fin: 1,
              buffer: frame.buffer,
              opcode: 10
            });
            var written = this.socket.write(resp.toData());
          }
          return;
        }

        if ( frame.opcode == 1 || frame.opcode == 2) {
          this.parts = [frame.buffer];
          this.opcode = frame.opcode;
        } else if ( frame.opcode == 0 ) {
          this.parts.push(frame.buffer);
        }

        if ( frame.fin ) {
          var msg = Buffer.concat(this.parts);
          if ( this.opcode == 1 ) {
            msg = msg.toString();
          }
          this.message.pub(msg);
        }
      }
    },
    {
      name: 'onData',
      code: function(data) {
        var i = 0;
        while ( i < data.length ) {
          if ( ! this.currentFrame ) {
            this.currentFrame = this.Frame.create();
          }

          i = this.currentFrame.onData(data, i);
          if ( this.currentFrame.finished ) {
            var f = this.currentFrame;
            this.currentFrame = null;
            this.onFrame(f);
          }
        }
      }
    }
  ]
});


foam.CLASS({
  package: 'foam.net.node',
  name: 'WebSocketService',
  extends: 'foam.net.web.WebSocketService',

  requires: [
    'foam.net.node.WebSocket',
    'foam.box.RegisterSelfMessage'
  ],

  properties: [
    {
      class: 'Int',
      name: 'port',
      value: 4000
    },
    {
      name: 'server'
    },
    {
      name: 'delegate'
    },
    {
      class: 'String',
      name: 'privateKey'
    },
    {
      class: 'String',
      name: 'cert'
    }
  ],

  methods: [
    function init() {
      if ( this.cert && this.privateKey )
        this.server = require('https').createServer({ key: this.privateKey, cert: this.cert });
      else
        this.server = require('http').createServer();

      this.server.on('upgrade', this.onUpgrade);
      this.server.listen(this.port);
    }
  ],

  listeners: [
    function onUpgrade(req, socket, data) {
      var key = req.headers['sec-websocket-key'];
      key += '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

      var hash = require('crypto').createHash('SHA1');
      hash.update(key);
      hash = hash.digest('base64');

      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
          'Upgrade: websocket\r\n' +
          'Connection: upgrade\r\n' +
          'Sec-WebSocket-Accept: ' + hash + '\r\n\r\n');

      var socket = this.WebSocket.create({
        socket: socket
      });
      this.addSocket(socket);
    }
  ]
});


foam.CLASS({
  package: 'foam.net.node',
  name: 'HTTPRequest',
  extends: 'foam.net.web.HTTPRequest',

  requires: [
    'foam.net.node.HTTPResponse'
  ],

  properties: [
    {
      class: 'Boolean',
      name: 'followRedirect',
      value: true
    },
    {
      name: 'urlLib',
      factory: function() { return require('url'); }
    }
  ],

  methods: [
    function fromUrl(url) {
      var data = this.urlLib.parse(url);
      if ( data.protocol ) this.protocol = data.protocol.slice(0, -1);
      if ( data.hostname ) this.hostname = data.hostname;
      if ( data.port ) this.port = data.port;
      if ( data.path ) this.path = data.path;

      return this;
    },

    function copyUrlFrom(other) {
      if ( other.url ) {
        this.fromUrl(other.url);
        return this;
      }

      this.protocol = other.protocol;
      this.hostname = other.hostname;
      if ( other.port ) this.port = other.port;
      other.path = other.path;

      return this;
    },

    function send() {
      if ( this.url ) {
        this.fromUrl(this.url);
      }
      this.addContentHeaders();

      if ( this.protocol !== 'http' && this.protocol !== 'https' )
        throw new Error("Unsupported protocol '" + this.protocol + "'");

      // 'Content-Length' or 'Transfer-Encoding' required for some requests
      // to be properly handled by Node JS servers.
      // See https://github.com/nodejs/node/issues/3009 for details.

      var buf;
      if ( this.payload && this.Blob.isInstance(this.payload) ) {
        this.headers['Content-Length'] = this.payload.size;
      } else if ( this.payload ) {
        buf = Buffer.from(this.payload, 'utf8');
        if ( ! this.headers['Content-Length'] ) {
          this.headers['Content-Length'] = buf.length;
        }
      }

      var options = {
        hostname: this.hostname,
        headers: this.headers,
        method: this.method,
        path: this.path
      };
      if ( this.port ) options.port = this.port;

      return new Promise(function(resolve, reject) {
        var req = require(this.protocol).request(options, function(nodeResp) {
          var resp = this.HTTPResponse.create({
            resp: nodeResp,
            responseType: this.responseType
          });

          // TODO(markdittmer): Write integration tests for redirects, including
          // same-origin/path-only redirects.
          if ( this.followRedirect &&
               ( resp.status === 301 ||
                 resp.status === 302 ||
                 resp.status === 303 ||
                 resp.status === 307 ||
                 resp.status === 308 ) ) {
            resolve(this.cls_.create({
              method: this.method,
              payload: this.payload,
              responseType: this.responseType,
              headers: this.headers,
              followRedirect: true
              // Redirect URL may not contain all parts if it points to same domain.
              // Copy original URL and overwrite non-null parts from "location"
              // header.
            }).copyUrlFrom(this).fromUrl(resp.headers.location).send());
          } else {
            resolve(resp);
          }
        }.bind(this));

        req.on('error', function(e) {
          reject(e);
        });

        if ( this.payload && this.Blob.isInstance(this.payload) ) {
          this.payload.pipe(function(buf) {
            if ( req.write(buf) ) {
              return new Promise(function(resolve) { req.once('drain', resolve); });
            }
          }).then(function() {
            req.end();
          });
          return;
        } else if ( this.payload ) {
          req.write(buf);
          req.end();
          return;
        }

        req.end();
      }.bind(this));
    }
  ]
});
// Registering BaseHTTPRequest facilitates decoration when HTTPRequest has been
// re-overridden.
foam.register(foam.lookup('foam.net.node.HTTPRequest'),
              'foam.net.node.BaseHTTPRequest');


foam.CLASS({
  package: 'foam.net.node',
  name: 'HTTPResponse',
  extends: 'foam.net.web.HTTPResponse',

  properties: [
    {
      name: 'payload',
      factory: function() {
        if ( this.streaming ) return null;

        var self = this;
        return new Promise(function(resolve, reject) {
          var buffer = ""
          self.resp.on('data', function(d) {
            buffer += d.toString();
          });
          self.resp.on('end', function() {
            switch (self.responseType) {
            case "text":
              resolve(buffer);
              return;
            case "json":
              try {
                resolve(JSON.parse(buffer));
              } catch ( error ) {
                reject(error);
              }
              return;
            }

            // TODO: responseType should be an enum and/or have validation.
            reject(new Error(
                'Unsupported response type: ' + self.responseType));
          });
          self.resp.on('error', function(e) {
            reject(e);
          });
        });
      }
    },
    {
      name: 'resp',
      postSet: function(_, r) {
        this.status = r.statusCode;
        this.headers = {};
        for ( var key in r.headers ) {
          this.headers[key.toLowerCase()] = r.headers[key];
        }
      }
    }
  ],

  methods: [
    function start() {
      this.streaming = true;

      return new Promise(function(resolve, reject) {
        this.resp.on('data', function(chunk) {
          this.data.pub(chunk);
        }.bind(this));

        this.resp.on('end', function() {
          this.end.pub();
          resolve(this);
        }.bind(this));

        this.resp.on('error', function(e) {
          reject(e);
        });
      }.bind(this));
    },

    function stop() {
      // TODO?
    }
  ]
});
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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

/*
TODO:
-better serialization/deserialization
-error handling if firebase contains malformed data, since we're not the only
ones who can write to it.
-multi part keys
*/

foam.CLASS({
  package: 'com.firebase',
  name: 'ExpectedObjectNotFound',
  extends: 'foam.dao.InternalException'
});

foam.CLASS({
  package: 'com.firebase',
  name: 'FirebaseDAO',
  extends: 'foam.dao.AbstractDAO',

  requires: [
    'foam.dao.ArraySink',
    'foam.net.web.HTTPRequest',
    'com.firebase.FirebaseEventSource',
    'foam.mlang.predicate.Gt',
    'foam.mlang.Constant'
  ],

  properties: [
    'of',
    'apppath',
    'secret',
    'eventSource_',
    {
      name: 'timestampProperty'
    },
    {
      name: 'basepath',
      expression: function(apppath, of) {
        return apppath + of.id.replace(/\./g, '/');
      }
    },
    {
      class: 'Boolean',
      name: 'enableStreaming',
      value: true
    },
    'startEventsAt_'
  ],

  methods: [
    function put_(x, obj) {
      var req = this.HTTPRequest.create();

      if ( obj.id ) {
        req.method = "PUT";
        req.url = this.basepath
          + "/"
          + encodeURIComponent(obj.id) + ".json";
      } else {
        throw new Error('Server generated IDs not supported.');
        // req.method = 'POST';
        // req.url = this.basepath + '.json';
      }

      if ( this.secret ) {
        req.url += '?auth=' + encodeURIComponent(this.secret);
      }

      req.payload = JSON.stringify({
        data: foam.json.stringify(obj),
        lastUpdate: {
          ".sv": "timestamp"
        }
      });
      req.headers['content-type'] = 'application/json';
      req.headers['accept']       = 'application/json';

      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(payload) {
        payload = JSON.parse(payload);

        //        if ( obj.id ) {
        var o2 = foam.json.parseString(payload.data, this);
          if ( this.timestampProperty ) {
            this.timestampProperty.set(o2, payload.lastUpdate);
          }
          return o2;
        //        } else {
        //           Server created id
        //        }
      }.bind(this), function(resp) {
        // TODO: Handle various errors.
        return Promise.reject(foam.dao.InternalException.create());
      });
    },

    function remove_(x, obj) {
      var req = this.HTTPRequest.create();
      req.method = 'DELETE',
      req.url = this.basepath + "/" + encodeURIComponent(obj.id) + ".json";

      if ( this.secret ) {
        req.url += "?auth=" + encodeURIComponent(this.secret);
      }

      return req.send().then(function() {
        return Promise.resolve();
      }, function() {
        return Promise.reject(foam.dao.InternalException.create());
      });
    },

    function find_(x, id) {
      var req = this.HTTPRequest.create();
      req.method = "GET";
      req.url = this.basepath + "/" + encodeURIComponent(id) + ".json";
      if ( this.secret ) {
        req.url += "?auth=" + encodeURIComponent(this.secret);
      }

      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(data) {
        if ( data == "null" ) {
          return Promise.resolve(null);
        }
        try {
          data = JSON.parse(data);

          var obj = foam.json.parseString(data.data, this);

          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data.lastUpdate);
          }

          return obj;
        } catch(e) {
          return Promise.reject(foam.dao.InternalException.create());
        }
      }.bind(this));
    },

    function startEvents() {
      if ( this.eventSource_ || ! this.enableStreaming ) {
        return;
      }

      var params = [];
      if ( this.secret ) params.push(['auth', this.secret]);
      if ( this.startEventsAt_ ) {
        params.push(['orderBy', '"lastUpdate"']);
        params.push(['startAt', this.startEventsAt_]);
      }

      var uri = this.basepath + '.json';
      if ( params.length ) {
        uri += '?' + params.map(function(p) { return p.map(encodeURIComponent).join('='); }).join('&');
      }

      this.eventSource_ = this.FirebaseEventSource.create({
        uri: uri
      });

      this.eventSource_.put.sub(this.onPut);
      this.eventSource_.patch.sub(this.onPatch);
      this.eventSource_.start();
    },

    function stopEvents() {
      if ( this.eventSource_ ) {
        this.eventSource_.close();
        this.eventSource_.message.put.unsub(this.onPut);
        this.eventSource_.message.patch.unsub(this.onPatch);
        this.clearProperty('eventSource_');
      }
    },

    function select_(x, sink, skip, limit, order, predicate) {
      var req = this.HTTPRequest.create();
      req.method = "GET";

      var params = [];
      if ( this.secret ) params.push(['auth', this.secret]);

      // Efficiently handle GT(lastupdate, #) queries.  Used by the SyncDAO to get
      // all changes.

      if ( predicate && this.timestampProperty &&
           this.Gt.isInstance(predicate) &&
           this.Constant.isInstance(predicate.arg2) &&
           predicate.arg1 === this.timestampProperty ) {

        // TODO: This is a hack to ensure that
        if ( ! this.startEventsAt_ )  {
          this.startEventsAt_ = predicate.arg2.f() + 1;
          this.startEvents();
        }

        params.push(['orderBy', '"lastUpdate"']);
        params.push(['startAt', predicate.arg2.f() + 1]);
      }

      var url = this.basepath + '.json';
      if ( params.length ) {
        url += '?' + params.map(function(p) { return p.map(encodeURIComponent).join('='); }).join('&');
      }

      req.url = url;

      var resultSink = sink || this.ArraySink.create();
      sink = this.decorateSink_(resultSink, skip, limit, order, predicate);

      // TODO: This should be streamed for better handling of large responses.
      return req.send().then(function(resp) {
        if ( ! resp.success ) {
          return Promise.reject(foam.dao.InternalException.create());
        }
        return resp.payload;
      }).then(function(payload) {
        var data = JSON.parse(payload);

        var detached = false;
        var sub = foam.core.FObject.create();
        sub.onDetach(function() { detached = true; });

        for ( var key in data ) {
          if ( detached ) break;

          var obj = foam.json.parseString(data[key].data, this);
          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data[key].lastUpdate);
          }

          sink.put(obj, sub);
        }
        sink.eof();

        return resultSink;
      }.bind(this), function(resp) {
        var e = foam.dao.InternalException.create();
        return Promise.reject(e);
      });
    }
  ],

  listeners: [
    function onPut(s, _, data) {
      // PATH is one of
      // / -> new objects
      // /key -> new object
      // /key/data -> updated object

      var path = data.path;
      if ( path == "/" ) {
        // All data removed?
        if ( data.data == null ) {
          this.on.reset.pub();
          return;
        }

        for ( var key in data.data ) {
          var obj = foam.json.parseString(data.data[key].data, this);
          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data.data[key].lastUpdate);
          }
          this.on.put.pub(obj);
        }
        return;
      } else if ( path.lastIndexOf('/') === 0 ) {
        if ( data.data == null ) {
          var obj = this.of.create();
          obj.id = path.substring(1)
          this.on.remove.pub(obj);
          return;
        }
        var obj = foam.json.parseString(data.data.data, this);
        if ( this.timestampProperty ) {
          this.timestampProperty.set(obj, data.data.lastUpdate);
        }
        this.on.put.pub(obj);
      } else if ( path.indexOf('/data') === path.length - 5 ) {
        // These last two events shouldn't happen unless somebody is editing
        // the underlying firebase data by hand.

        // Data of an existing row updated.
        debugger;
        var id = path.substring(1);
        id = id.substring(0, id.indexOf('/'));
        this.find(id).then(function(obj) {
          if ( ! obj ) throw com.firebase.ExpectedObjectNotFound.create();
          this.on.put.pub(obj);
        }.bind(this));

        // var obj = foam.json.parseString(data.data, this);
        // this.on.put.pub(obj);
      } else if ( path.indexOf('/lastUpdate') === path.length - 11 ) {
        // Timestamp of an existing row updated, do anything?
        // presumably if the object itself hasn't been updated we don't care
        // if it has been updated we should get an event for that.

        debugger;
        var id = path.substring(1);
        id = id.substring(0, id.indexOf('/'));
        this.find(id).then(function(obj) {
          if ( ! obj ) throw com.firebase.ExpectedObjectNotFound.create();
          this.on.put.pub(obj);
        }.bind(this));
      }
    },

    function onPatch(s, _, __, data) {
          // TODO: What does a patch even look like?
      debugger;
    }
  ]
});


foam.CLASS({
  package: 'com.firebase',
  name: 'SafariFirebaseDAO',
  extends: 'com.firebase.FirebaseDAO',

  requires: [
    'foam.net.web.XMLHTTPRequest as HTTPRequest',
    'foam.net.web.SafariEventSource as EventSource'
  ],

  properties: [
    [ 'enableStreaming', false ]
  ]
});


foam.CLASS({
  package: 'com.firebase',
  name: 'FirebaseEventSource',

  requires: [
    'foam.net.web.EventSource'
  ],

  topics: [
    'put',
    'patch',
    'keep-alive',
    'cancel',
    'auth_revoked'
  ],

  properties: [
    {
      name: 'uri',
      required: true
    },
    {
      name: 'eventSource',
      postSet: function(old, nu) {
        nu.message.sub(this.onMessage);
      },
      factory: function() {
        return this.EventSource.create({
          uri: this.uri
        });
      }
    },
    {
      class: 'String',
      name: 'buffer'
    }
  ],

  methods: [
    function start() {
      this.eventSource.start();
    }
  ],

  listeners: [
    function onMessage(s, msg, name, data) {
      switch (name) {
      case 'put':
        this.onPut(name, data);
        break;
      case 'patch':
        this.onPatch(name, data);
        break;
      case 'keep-alive':
        this.onKeepAlive(name, data);
        break;
      case 'cancel':
        this.onCancel(name, data);
        break;
      case 'auth_revoked':
        this.onAuthRevoked(name, data);
        break;
      default:
        this.onUnknown(name, data);
      }
    },

    function onPut(name, data) {
      this.put.pub(JSON.parse(data));
      return;

      // this.buffer += data;
      // try {
      //   var payload = JSON.parse(this.buffer);
      // } catch(e) {
      //   this.warn('Failed to parse payload, assuming its incomplete.', e, this.buffer.length);
      //   return;
      // }

      // this.buffer = '';
      // this.put.pub(payload);
    },

    function onPatch() {
      debugger;
    },

    function onKeepAlive() {
    },

    function onCancel() {
    },

    function onUnknown(name, data) {
      this.warn('Unknown firebase event', name, data);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

// TODO: doc
foam.CLASS({
  package: 'com.firebase',
  name: 'CloudMessaging',

  requires: [
    'foam.net.node.HTTPRequest',
  ],

  properties: [
    {
      name: 'serverKey'
    }
  ],

  methods: [
    function send(id, payload, collapseKey) {
      return this.HTTPRequest.create({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
          "content-type": "application/json",
          "Authorization": "key=" + this.serverKey
        },
        responseType: 'json',
        payload: JSON.stringify({
          to: id,
          data: payload
        })
      }).send().then(function(resp) {
        if ( ! resp.success ) {
          return resp.payload.then(function(p) { return Promise.reject(p); });
        }
      });
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.core',
  name: 'StubMethod',
  extends: 'Method',

  properties: [
    'replyPolicyName',
    'boxPropName',
    {
      name: 'code',
      factory: function() {
        var returns         = foam.String.isInstance(this.returns) ?
            this.returns :
            this.returns && this.returns.typeName;
        var replyPolicyName = this.replyPolicyName;
        var boxPropName     = this.boxPropName;
        var name            = this.name;

        return function() {
          if ( returns ) {
            var replyBox = this.ReplyBox.create({
              delegate: this.RPCReturnBox.create()
            });

            var errorBox = replyBox;

            var ret = replyBox.delegate.promise;

            replyBox = this.registry.register(
              replyBox.id,
              this[replyPolicyName],
              replyBox);

            // TODO: Move this into RPCReturnBox ?
            if ( returns !== 'Promise' ) {
              ret = this.lookup(returns).create({ delegate: ret });
            }
          }

          var msg = this.Message.create({
            object: this.RPCMessage.create({
              name: name,
              args: Array.from(arguments)
            })
          });

          if ( replyBox ) {
            msg.attributes.replyBox = replyBox;
            msg.attributes.errorBox = replyBox;
          }

          this[boxPropName].send(msg);

          return ret;
        };
      }
    }
  ],
  methods: [
    function buildJavaClass(cls) {
      if ( ! this.javaSupport ) return;

      var name = this.name;
      var args = this.args;
      var boxPropName = foam.String.capitalize(this.boxPropName);
      var replyPolicyName = foam.String.capitalize(this.replyPolicyName);

      var code = `
foam.box.Message message = getX().create(foam.box.Message.class);
foam.box.RPCMessage rpc = getX().create(foam.box.RPCMessage.class);
rpc.setName("${name}");
Object[] args = { ${ args.map( a => a.name ).join(',') } };
rpc.setArgs(args);

message.setObject(rpc);`;

      if ( this.javaReturns && this.javaReturns !== "void" ) {
        code += `
foam.box.ReplyBox reply = getX().create(foam.box.ReplyBox.class);
foam.box.RPCReturnBox handler = getX().create(foam.box.RPCReturnBox.class);
reply.setDelegate(handler);

foam.box.SubBox export = (foam.box.SubBox)getRegistry().register(null, get${replyPolicyName}(), reply);
reply.setId(export.getName());

message.getAttributes().put("replyBox", export);
message.getAttributes().put("errorBox", export);

get${boxPropName}().send(message);

try {
  handler.getSemaphore().acquire();
} catch (InterruptedException e) {
  throw new RuntimeException(e);
}

Object result = handler.getMessage().getObject();
if ( result instanceof foam.box.RPCReturnMessage )
  return (${this.javaReturns})((foam.box.RPCReturnMessage)result).getData();

if ( result instanceof foam.box.RPCErrorMessage )
  throw new RuntimeException(((foam.box.RPCErrorMessage)result).getData().toString());

throw new RuntimeException("Invalid repsonse type: " + result.getClass());
`;
      } else {
        code += `get${boxPropName}().send(message);`;
      }

      this.javaCode = code;

      this.SUPER(cls);
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'StubAction',
  extends: 'Action',

  properties: [
    'replyPolicyName',
    'boxPropName',
    {
      name: 'stubMethod',
      factory: function() {
        return foam.core.StubMethod.create({
          name: this.name,
          replyPolicyName: this.replyPolicyName,
          boxPropName: this.boxPropName
        });
      }
    },
    {
      name: 'code',
      factory: function() {
        return function(ctx, action) {
          action.stubMethod.code.call(this);
        };
      }
    }
  ],
  methods: [
    function installInProto(proto) {
      proto[this.name] = this.stubMethod.code;
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'Stub',
  extends: 'Property',

  properties: [
    'of',
    {
      name: 'replyPolicyName',
      expression: function(name) {
        return name + 'ReplyPolicy'
      }
    },
    {
      class: 'StringArray',
      name: 'methods',
      factory: function() { return null; }
    },
    {
      name: 'methods_',
      expression: function(of, name, methods, replyPolicyName) {
        var cls = this.lookup(of);

        return (
          methods ?
            methods.map(function(m) { return cls.getAxiomByName(m); }) :
          cls.getAxiomsByClass(foam.core.Method).filter(function (m) { return cls.hasOwnAxiom(m.name); }) ).
          map(function(m) {
            var returns = foam.String.isInstance(m.returns) ? m.returns :
                m.returns && m.returns.typeName;
            if ( returns && returns !== 'Promise' ) {
              var id = returns.split('.');
              id[id.length - 1] = 'Promised' + id[id.length - 1];
              returns = id.join('.');
            }

            return foam.core.StubMethod.create({
              name: m.name,
              replyPolicyName: replyPolicyName,
              boxPropName: name,
              returns: returns
            });
          });
      }
    },
    {
      class: 'StringArray',
      name: 'actions',
      factory: function() { return null; }
    },
    {
      name: 'actions_',
      expression: function(of, name, actions, replyPolicyName) {
        var cls = this.lookup(of);

        return (
          actions ? actions.map(function(a) { return cls.getAxiomByName(a); }) :
          cls.getAxiomsByClass(foam.core.Action).filter(function(m) { return cls.hasOwnAxiom(m.name); }) ).
          map(function(m) {
            return foam.core.StubAction.create({
              name: m.name,
              isEnabled: m.isEnabled,
              replyPolicyName: replyPolicyName,
              boxPropName: name
            });
          });
      }
    },
    ['javaType', 'foam.box.Box'],
    ['javaInfoType', 'foam.core.AbstractFObjectPropertyInfo']
  ],

  methods: [
    function installInClass(cls) {
      var model = this.lookup(this.of);
      var propName = this.name;

      cls.installAxiom(foam.core.Object.create({
        name: this.replyPolicyName,
        javaType: 'foam.box.BoxService',
        hidden: true
      }));

      for ( var i = 0 ; i < this.methods_.length ; i++ ) {
        cls.installAxiom(this.methods_[i]);
      }

      for ( i = 0 ; i < this.actions_.length ; i++ ) {
        cls.installAxiom(this.actions_[i]);
      }

      [
        'foam.box.RPCReturnBox',
        'foam.box.ReplyBox',
        'foam.box.RPCMessage',
        'foam.box.Message'
      ].map(function(s) {
        var path = s.split('.');
        return foam.core.Requires.create({
          path: s,
          name: path[path.length - 1]
        });
      }).forEach(function(a) {
        cls.installAxiom(a);
      });

      cls.installAxiom(foam.core.Import.create({
        key: 'registry',
        name: 'registry',
        javaType: 'foam.box.BoxRegistry',
      }));
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'StubClass',

  axioms: [
    foam.pattern.Multiton.create({ property: 'of' })
  ],

  requires: [
    'foam.core.Model',
  ],

  properties: [
    {
      class: 'Class',
      name: 'of',
      required: true
    },
    {
      class: 'String',
      name: 'package',
      factory: function() { return this.of.package; }
    },
    {
      class: 'String',
      name: 'name',
      factory: function() { return `${this.of.name}Stub`; }
    },
    {
      class: 'String',
      name: 'id',
      factory: function() { return `${this.package}.${this.name}`; }
    },
    {
      class: 'FObjectProperty',
      of: 'Model',
      name: 'stubModel',
      factory: function() {
        return this.Model.create({
          package: this.package,
          name: this.name,

          properties: [
            {
              class: 'Stub',
              of: this.of.id,
              name: 'delegate'
            }
          ]
        });
      }
    },
    {
      name: 'stubCls',
      factory: function() {
        return this.buildClass_();
      }
    }
  ],

  methods: [
    function init() {
      this.validate();
      this.SUPER();
    },
    function buildClass_() {
      this.stubModel.validate();
      var cls = this.stubModel.buildClass();
      cls.validate();
      this.__subContext__.register(cls);
      foam.package.registerClass(cls);

      return this.stubModel.buildClass();
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'StubFactory',

  requires: [ 'foam.core.StubClass' ],

  methods: [
    function get(cls) {
      return this.StubClass.create({ of: cls }).stubCls;
    }
  ]
});


foam.CLASS({
  package: 'foam.core',
  name: 'StubFactorySingleton',
  extends: 'foam.core.StubFactory',

  axioms: [ foam.pattern.Singleton.create() ],
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.box',
  name: 'Box',

  methods: [
    {
      name: 'send',
      args: [
        'message'
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
  package: 'foam.box',
  name: 'RemoteException',
  properties: [
    {
      class: 'String',
      name: 'id'
    },
    {
      class: 'String',
      name: 'message'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.box',
  name: 'Skeleton',
  extends: 'foam.box.Box',
  documentation: 'Skeleton marker interface.',

  methods: [
    {
      name: 'setDelegateObject',
      args: [
        {
          name: 'obj',
          javaType: 'Object'
        }
      ]
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'PromisedBox',
  implements: [ 'foam.box.Box' ],

  properties: [
    {
      class: 'Promised',
      of: 'foam.box.Box',
      transient: true,
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ProxyBox',
  implements: ['foam.box.Box'],

  properties: [
    {
      class: 'Proxy',
      of: 'foam.box.Box',
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'Message',

  properties: [
    {
      class: 'Map',
      name: 'attributes',
      javaFactory: 'return new java.util.HashMap();'
    },
    {
      class: 'Object',
      name: 'object'
    },
    {
      class: 'Map',
      transient: true,
      name: 'localAttributes',
      javaFactory: 'return new java.util.HashMap();'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SubBoxMessage',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'Object',
      name: 'object'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'HelloMessage'
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SubBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.SubBoxMessage'
  ],

  properties: [
    {
      class: 'String',
      name: 'name'
    }
  ],

  methods: [
    {
      name: 'send',
      code: function(msg) {
        msg.object = this.SubBoxMessage.create({
          name: this.name,
          object: msg.object
        });
        this.delegate.send(msg);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'NameAlreadyRegisteredException',

  properties: [
    {
      class: 'String',
      name: 'name'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'NoSuchNameException',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'String',
      name: 'message',
      transient: true,
      expression: function(name) {
        return 'Could not find registration for ' + name;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.box',
  name: 'BoxRegistry',

  methods: [
    {
      name: 'doLookup',
      returns: 'foam.box.Box',
      javaReturns: 'foam.box.Box',
      args: [
        {
          name: 'name',
          javaType: 'String'
        }
      ]
    },
    {
      name: 'register',
      returns: 'foam.box.Box',
      javaReturns: 'foam.box.Box',
      args: [
        {
          name: 'name',
          javaType: 'String'
        },
        {
          name: 'service',
          javaType: 'foam.box.BoxService'
        },
        {
          name: 'box',
          javaType: 'foam.box.Box'
        }
      ],
    },
    {
      name: 'unregister',
      returns: '',
      javaReturns: 'void',
      args: [
        {
          name: 'name',
          javaType: 'String'
        }
      ]
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'LocalBoxRegistry',
  implements: [ 'foam.box.BoxRegistry' ],

  requires: [
    'foam.box.NoSuchNameException',
    'foam.box.SubBox'
  ],

  imports: [
    {
      name: 'me',
      key: 'me',
      javaType: 'foam.box.Box'
    }
  ],

  properties: [
    {
      class: 'Map',
      name: 'registry_',
      hidden: true,
      javaFactory: 'return new java.util.concurrent.ConcurrentHashMap();'
    }
  ],

  classes: [
    {
      name: 'Registration',
      properties: [
        {
          class: 'FObjectProperty',
          of: 'foam.box.Box',
          name: 'exportBox'
        },
        {
          class: 'FObjectProperty',
          of: 'foam.box.Box',
          name: 'localBox'
        }
      ]
    }
  ],

  methods: [
    {
      name: 'doLookup',
      returns: 'foam.box.Box',
      code: function doLookup(name) {
        if ( this.registry_[name] &&
             this.registry_[name].exportBox )
          return this.registry_[name].exportBox;

        throw this.NoSuchNameException.create({ name: name });
      },
      javaCode: `
Object registration = getRegistry_().get(name);
if ( registration == null ) {
  throw new RuntimeException("No such name");
}
return ((Registration)registration).getExportBox();
`
    },
    {
      name: 'register',
      returns: 'foam.box.Box',
      code: function(name, service, localBox) {
        name = name || foam.next$UID();

        var exportBox = this.SubBox.create({ name: name, delegate: this.me });
        exportBox = service ? service.clientBox(exportBox) : exportBox;

        this.registry_[name] = {
          exportBox: exportBox,
          localBox: service ? service.serverBox(localBox) : localBox
        };

        return this.registry_[name].exportBox;
      },
      javaCode: `
if ( name == null ) name = Integer.toString(foam.box.IdGenerator.nextId());

foam.box.SubBox exportBox = getX().create(foam.box.SubBox.class);
exportBox.setName(name);
exportBox.setDelegate(getMe());
Registration registration = getX().create(Registration.class);
registration.setExportBox(exportBox);
registration.setLocalBox(box);
// TODO(adamvy): Apply service policy

getRegistry_().put(name, registration);
return exportBox;
`
    },
    {
      name: 'unregister',
      returns: '',
      code: function(name) {
        if ( foam.box.Box.isInstance(name) ) {
          for ( var key in this.registry_ ) {
            // TODO(markdittmer): Should there be a specialized compare() should
            // be implemented by NamedBox (to cut out delegate) and
            // foam.util.compare()?
            if ( this.registry_[key].exportBox === name ) {
              delete this.registry_[key];
              return;
            }
          }
          return;
        }

        delete this.registry_[name];
      },
      javaCode: `
getRegistry_().remove(name);
`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'BoxRegistryBox',
  extends: 'foam.box.LocalBoxRegistry',

  implements: [ 'foam.box.Box' ],

  requires: [
    'foam.box.SubBoxMessage',
    'foam.box.Message',
    'foam.box.HelloMessage',
    'foam.box.SkeletonBox'
  ],

  properties: [
    {
      name: 'registrySkeleton',
      factory: function() {
        return this.SkeletonBox.create({ data: this });
      }
    }
  ],

  methods: [
    {
      name: 'send',
      code: function(msg) {
        if ( this.SubBoxMessage.isInstance(msg.object) ) {
          var name = msg.object.name;

          if ( this.registry_[name] && this.registry_[name].localBox ) {
            // Unpack sub box object... is this right?
            msg.object = msg.object.object;
            this.registry_[name].localBox.send(msg);
          } else {
            if ( msg.attributes.errorBox ) {
              msg.attributes.errorBox.send(
                this.Message.create({
                  object: this.NoSuchNameException.create({ name: name })
                }));
            }
          }
        } else if ( this.HelloMessage.isInstance(msg.object) ) {
        } else {
          this.registrySkeleton.send(msg);
        }
      },
      javaCode: `
Object obj = message.getObject();

if ( obj instanceof foam.box.SubBoxMessage ) {
  foam.box.SubBoxMessage sbm = (foam.box.SubBoxMessage)obj;
  String name = sbm.getName();

  Registration dest = (Registration)getRegistry_().get(name);

  if ( dest != null ) {
    message.setObject(sbm.getObject());
    dest.getLocalBox().send(message);
  } else if ( message.getAttributes().containsKey("errorBox") ) {
    foam.box.Box errorBox = (foam.box.Box)message.getAttributes().get("errorBox");
    foam.box.Message errorMessage = getX().create(foam.box.Message.class);
    errorMessage.setObject(getX().create(foam.box.NoSuchNameException.class));

    errorBox.send(errorMessage);
  }
}
`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

// TODO: Use ContextFactories to create these on demand.
foam.CLASS({
  package: 'foam.box',
  name: 'ClientBoxRegistry',

  properties: [
    {
      class: 'Stub',
      of: 'foam.box.BoxRegistry',
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'PromisedBoxRegistry',

  properties: [
    {
      class: 'Promised',
      of: 'foam.box.BoxRegistry',
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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

foam.INTERFACE({
  package: 'foam.box',
  name: 'RegistrySelector',

  documentation: `A function that selects a registry where a service should be
      registered, based on the requested name, service policy, box, and any
      state internal to the selector. RegistrySelectors are used by
      SelectorRegistries to route registration requests.

      NOTE: SelectorRegistry's delegation strategy expects registries returned
      by from RegistrySelectors to reside in a different foam.box.Context (with
      a different foam.box.Context.myname) than the SelectorRegistry.`,

  methods: [
    function select(name, service, box) {}
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SelectorRegistry',
  extends: 'foam.box.BoxRegistryBox',

  documentation: `A registry that routes registration requests to other
      registries according to its "selector".

      NOTE: SelectorRegistry's delegation strategy expects registries returned
      by "selector" to reside in a different foam.box.Context (with a different
      foam.box.Context.myname) than the SelectorRegistry.`,

  requires: [ 'foam.box.Box' ],
  exports: [ 'as registry' ],

  classes: [
    {
      name: 'Registration',

      documentation: `Mapping between a delegate registry and a box returned
          from registering with the delegate.`,

      properties: [
        {
          class: 'String',
          name: 'name',
          documentation: `Name under which registration was stored in
              SelectorRegistry.`
        },
        {
          class: 'FObjectProperty',
          of: 'foam.box.BoxRegistry',
          name: 'delegateRegistry',
          documentation: `The registry that SelectorRegistry delegated to for
              managed registration.`
        },
        {
          class: 'FObjectProperty',
          of: 'foam.box.Box',
          name: 'delegateRegisteredBox',
          documentation: `Box returned from register() on "delegateRegistry".`
        }
      ]
    }
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.RegistrySelector',
      name: 'selector',
      documentation: `A (potentially stateful) function that selects a delegate
          registry on a per-registration-request basis.`,
      required: true
    },
    {
      class: 'Array',
      // of: 'Registration',
      name: 'selectorRegistrations_',
      documentation: `Array of bindings:
          <selector-chosen-delegate, box-returned-from-register-in-delegate>.`
    }
  ],

  methods: [
    function register(name, service, box) {
      name = name || foam.next$UID();

      var delegate = this.selector.select(name, service, box);

      var delegateRegisteredBox = delegate.register(null, null, box);

      // Create relay to desired service name, but return box from delegate.
      // This creates a consistent namespace for clients of this registry while
      // also returning NamedBoxes that resolve to delegate Context names.
      this.SUPER(name, service, delegateRegisteredBox);

      this.selectorRegistrations_.push(this.Registration.create({
        name: name,
        delegateRegistry: delegate,
        delegateRegisteredBox: delegateRegisteredBox
      }));

      return delegateRegisteredBox;
    },
    function unregister(nameOrBox) {
      var delegateRegisteredBox;
      var inputIsBox = this.Box.isInstance(nameOrBox);
      if ( inputIsBox ) {
        delegateRegisteredBox = nameOrBox;
      } else {
        delegateRegisteredBox = this.registry_[nameOrBox].localBox;

        // When name is known, delete from this registry immediately.
        this.SUPER(nameOrBox);
      }

      var registrations = this.selectorRegistrations_;
      var delegateRegistry = null;
      for ( var i = 0; i < registrations.length; i++ ) {
        if ( registrations[i].delegateRegisteredBox !== delegateRegisteredBox )
          continue;

        delegateRegistry = registrations[i].delegateRegistry;

        // When name was not previously known, delete from this registry after
        // finding associated Registration.
        if ( inputIsBox ) delete this.registry_[registrations[i].name];
        break;
      }

      foam.assert(delegateRegistry,
                  'SelectorRegistry: Expected to find delegate registry');

      // TODO(markdittmer): See TODO in BoxRegistry.unregister();
      // unregistering remote boxes this way will not work unless something
      // more nuanced than object identity is used.
      delegateRegistry.unregister(delegateRegisteredBox);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'LookupBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.ClientBoxRegistry',
    'foam.box.LookupRetryBox'
  ],

  properties: [
    {
      name: 'name'
    },
    {
      name: 'parentBox'
    },
    {
      name: 'registry',
      transient: true,
      factory: function() {
        return this.ClientBoxRegistry.create({
          delegate: this.parentBox
        });
      }
    },
    {
      name: 'delegate',
      transient: true,
      factory: function() {
        return this.registry.doLookup(this.name);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'NamedBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.LookupBox',
  ],

  axioms: [
    foam.pattern.Multiton.create({ property: 'name' })
  ],

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      name: 'delegate',
      transient: true,
      factory: function() {
        // RetryBox(LookupBox(name, NamedBox(subName)))
        // TODO Add retry box
        return this.LookupBox.create({
          name: this.getBaseName(),
          parentBox: this.getParentBox()
        });
      }
    }
  ],

  methods: [
    function getParentBox() {
      return this.cls_.create({
        name: this.name.substring(0, this.name.lastIndexOf('/'))
      }, this);
    },

    function getBaseName() {
      return this.name.substring(this.name.lastIndexOf('/') + 1);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RetryBox',

  properties: [
    'attempts',
    'errorBox',
    'delegate',
    'message',
    {
      name: 'maxAttempts',
      value: 3
    }
  ],

  methods: [
    function send(msg) {
      if ( this.attempts == this.maxAttempts ) {
        this.errorBox && this.errorBox.send(msg);
        return;
      }

      this.delegate.send(this.message);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ReplyBox',
  extends: 'foam.box.ProxyBox',

  imports: [
    {
      name: 'registry',
      key: 'registry',
      javaType: 'foam.box.BoxRegistry'
    }
  ],

  properties: [
    {
      class: 'String',
      name: 'id',
      factory: function() {
        // TODO: Do these need to be long lived?
        // Someone could store a box for days and then use it
        // at that point the ID might no longer be valid.
        return foam.next$UID();
      }
    }
  ],

  methods: [
    {
      name: 'send',
      code: function send(msg) {
        this.registry.unregister(this.id);
        this.delegate.send(msg);
      },
      javaCode: `
getRegistry().unregister(getId());
getDelegate().send(message);
`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'FunctionBox',
  implements: ['foam.box.Box'],
  properties: [
    {
      class: 'Function',
      name: 'fn'
    }
  ],
  methods: [
    function send(m) {
      this.fn(m.object);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RPCReturnMessage',
  properties: [
    {
      class: 'Object',
      name: 'data'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RPCErrorMessage',
  properties: [
    {
      class: 'Object',
      name: 'data'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SubscribeMessage',
  properties: [
    {
      name: 'topic'
    },
    {
      name: 'destination'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RPCReturnBox',

  implements: ['foam.box.Box'],

  requires: [
    'foam.box.RPCReturnMessage',
    'foam.box.RPCErrorMessage'
  ],

  imports: [
    'warn'
  ],

  properties: [
    {
      name: 'promise',
      factory: function() {
        return new Promise(function(resolve, reject) {
          this.resolve_ = resolve;
          this.reject_ = reject;
        }.bind(this));
      }
    },
    {
      name: 'resolve_'
    },
    {
      name: 'reject_'
    },
    {
      class: 'Object',
      name: 'semaphore',
      javaType: 'java.util.concurrent.Semaphore',
      javaFactory: 'return new java.util.concurrent.Semaphore(0);'
    },
    {
      class: 'Object',
      name: 'message',
      javaType: 'foam.box.Message'
    }
  ],

  methods: [
    {
      name: 'send',
      code: function send(msg) {
        if ( this.RPCReturnMessage.isInstance(msg.object) ) {
          this.resolve_(msg.object.data);
          return;
        } else if ( this.RPCErrorMessage.isInstance(msg.object) ) {
          this.reject_(msg.object.data);
          return;
        }

        this.warn('Invalid message to RPCReturnBox.');
      },
      javaCode: `
setMessage(message);
getSemaphore().release();
`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RPCMessage',
  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'Array',
      name: 'args'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'BaseClientDAO',
  extends: 'foam.dao.AbstractDAO',

  properties: [
    {
      class: 'Stub',
      of: 'foam.dao.DAO',
      name: 'delegate',
      methods: [
        'put_',
        'remove_',
        'removeAll_',
        'select_',
        'listen_',
        'find_'
      ]
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'MergeBox',
  extends: 'foam.box.ProxyBox',
  properties: [
    {
      class: 'Int',
      name: 'delay',
      value: 100
    },
    {
      name: 'msg',
      transient: true
    },
    {
      class: 'Array',
      name: 'queue',
      transient: true
    }
  ],
  methods: [
    function send(m) {
      if ( ! this.timeout ) {
      }
    }
  ],
  listeners: [
    function doSend() {
      var queue = this.queue;
      this.queue = undefined;
      this.timeout = undefined;
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'ResetSink',
  extends: 'foam.dao.ProxySink',
  implements: [ 'foam.core.Serializable' ],
  methods: [
    {
      name: 'put',
      code: function(obj, sub) { this.reset(s); },
      javaCode: 'reset(sub);'
    },
    {
      name: 'remove',
      code: function(obj, sub) { this.reset(s); },
      javaCode: 'reset(sub);'
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'MergedResetSink',
  extends: 'foam.dao.ResetSink',
  implements: [ 'foam.core.Serializable' ],
  methods: [
    {
      name: 'reset',
      code: function(sub) { this.doReset(sub); },
      javaCode: `doReset(sub);`
    }
  ],
  listeners: [
    {
      name: 'doReset',
      isMerged: true,
      mergeDelay: 200,
      code: function(sub) {
        this.delegate.reset(sub);
      },
      javaCode: `
try {
  getDelegate().reset((foam.core.Detachable)event);
} catch(Exception e) {
  ((foam.core.Detachable)event).detach();
}
`
    }
  ]
});

foam.CLASS({
  package: 'foam.dao',
  name: 'ClientDAO',
  extends: 'foam.dao.BaseClientDAO',

  requires: [
    'foam.core.Serializable',
    'foam.dao.ClientSink',
    'foam.box.SkeletonBox'
  ],

  methods: [
    {
      name: 'put_',
      code:     function put_(x, obj) {
        return this.SUPER(null, obj);
      },
      javaCode: `
return super.put_(null, obj);
`
    },
    {
      name: 'remove_',
      code: function remove_(x, obj) {
        return this.SUPER(null, obj);
      },
      javaCode: `
return super.remove_(null, obj);
`
    },
    {
      name: 'find_',
      code:     function find_(x, key) {
        return this.SUPER(null, key);
      },
      javaCode: `
return super.find_(null, id);
`
    },
    {
      name: 'select_',
      code: function select_(x, sink, skip, limit, order, predicate) {
        if ( predicate === foam.mlang.predicate.True.create() ) predicate = null;
        if ( ! skip ) skip = 0;
        if ( foam.Undefined.isInstance(limit) ) limit = Number.MAX_SAFE_INTEGER;

        if ( ! this.Serializable.isInstance(sink) ) {
          var self = this;

          return this.SUPER(null, null, skip, limit, order, predicate).then(function(result) {
            var items = result.array;

            if ( ! sink ) return result;

            var sub = foam.core.FObject.create();
            var detached = false;
            sub.onDetach(function() { detached = true; });

            for ( var i = 0 ; i < items.length ; i++ ) {
              if ( detached ) break;

              sink.put(items[i], sub);
            }

            sink.eof();

            return sink;
          });
        }

        return this.SUPER(null, sink, skip, limit, order, predicate);
      },
      javaCode: `
return super.select_(null, sink, skip, limit, order, predicate);
`
    },

    {
      name: 'removeAll_',
      code: function removeAll_(x, skip, limit, order, predicate) {
        if ( predicate === foam.mlang.predicate.True.create() ) predicate = null;
        if ( ! skip ) skip = 0;
        if ( foam.Undefined.isInstance(limit) ) limit = Number.MAX_SAFE_INTEGER;

        return this.SUPER(null, skip, limit, order, predicate);
      },
      javaCode: `
super.removeAll_(null, skip, limit, order, predicate);
`
    },

    {
      name: 'listen_',
      code: function listen_(x, sink, predicate) {
        // TODO: This should probably just be handled automatically via a RemoteSink/Listener
        // TODO: Unsubscribe support.

        var skeleton = this.SkeletonBox.create({
          data: sink
        });

        var clientSink = this.ClientSink.create({
          delegate: this.__context__.registry.register(
            null,
            this.delegateReplyPolicy,
            skeleton
          )
        });

        clientSink = foam.dao.MergedResetSink.create({
          delegate: clientSink
        });

        this.SUPER(null, clientSink, predicate);
      },
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'EventlessClientDAO',
  extends: 'foam.dao.AbstractDAO',

  properties: [
    {
      class: 'Stub',
      of: 'foam.dao.DAO',
      name: 'delegate',
      methods: [
        'put_',
        'remove_',
        'select_',
        'removeAll_',
        'find_'
      ],
      eventProxy: false
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'PollingClientDAO',
  extends: 'foam.dao.ClientDAO',

  requires: [
    'foam.dao.ArraySink'
  ],

  methods: [
    function put_(x, obj) {
      var self = this;
      return this.SUPER(x, obj).then(function(o) {
        self.on.put.pub(o);
        return o;
      });
    },

    function remove_(x, obj) {
      var self = this;
      return this.SUPER(x, obj).then(function(o) {
        self.on.remove.pub(obj);
        return o;
      });
    },

    function removeAll_(x, skip, limit, order, predicate) {
      this.SUPER(x, skip, limit, order, predicate);
      this.on.reset.pub();
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'StreamingClientDAO',
  extends: 'foam.dao.BaseClientDAO',

  requires: [
    'foam.dao.ArraySink',
    'foam.dao.BoxDAOListener'
  ],
  imports: [ 'registry' ],

  classes: [
    {
      name: 'StreamingReplyBox',
      implements: [ 'foam.box.Box' ],

      imports: [ 'registry' ],

      properties: [
        {
          name: 'id',
          factory: function() { return foam.next$UID(); }
        },
        {
          class: 'FObjectProperty',
          of: 'foam.dao.Sink',
          name: 'sink'
        },
        {
          class: 'Boolean',
          name: 'detachOnEOF'
        },
        {
          name: 'promise',
          factory: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
              self.resolve_ = resolve;
              self.reject_ = reject;
            });
          }
        },
        {
          name: 'sinkSub',
          factory: function() {
            var sub = foam.core.FObject.create();
            // TODO(markdittmer): Notify remote DAO of detachment.
            sub.onDetach(this.unregisterSelf);
            return sub;
          }
        },
        'resolve_',
        'reject_'
      ],

      methods: [
        function send(msg) {
          // TODO(markdittmer): Error check message type.

          switch ( msg.object.name ) {
            case 'put':
              this.sink.put(msg.object.obj, this.sinkSub);
              break;
            case 'remove':
              this.sink.remove(msg.object.obj, this.sinkSub);
              break;
            case 'eof':
              this.sink.eof();
              this.resolve_(this.sink);
              if ( this.detachOnEOF ) this.sinkSub.detach();
              break;
            case 'reset':
              this.sink.reset();
              break;
          }
        }
      ],

      listeners: [
        function registerSelf() {
          return this.exportBox_ = this.registry.register(this.id, null, this);
        },
        function unregisterSelf() { this.registry.unregister(this.id); }
      ]
    }
  ],

  methods: [
    function put_(x, obj) { return this.SUPER(null, obj); },
    function remove_(x, obj) { return this.SUPER(null, obj); },
    function find_(x, key) { return this.SUPER(null, key); },
    function select_(x, sink, skip, limit, order, predicate) {
      var replyBox = this.StreamingReplyBox.create({
        sink: sink || this.ArraySink.create(),
        detachOnEOF: true
      });
      var promise = replyBox.promise;

      var registeredReplyBox = replyBox.registerSelf();

      // TODO(markdittmer): Shouldn't there be an annotation for an errorBox
      // somewhere here?
      this.SUPER(
          null, this.BoxDAOListener.create({ box: registeredReplyBox }),
          skip, limit, order, predicate)
              .catch(function(error) { replyBox.reject_(error); });
      return promise;
    },
    function listen_(x, sink, predicate) {
      var replyBox = this.StreamingReplyBox.create({
        sink: sink || this.ArraySink.create()
      });

      // TODO(markdittmer): Shouldn't there be an annotation for an errorBox
      // somewhere here?
      this.SUPER(null, this.BoxDAOListener.create({
        box: replyBox.registerSelf()
      }), predicate);

      return replyBox.sinkSub;
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.dao',
  name: 'RequestResponseClientDAO',
  extends: 'foam.dao.BaseClientDAO',

  requires: [
    'foam.core.Serializable'
  ],

  documentation: function() {/*A ClientDAO implementation which publishes its own events upon put/remove.
Suitable for usage against backends that don't support listen(), such as plain HTTP based servers.*/},

  methods: [
    function put_(x, obj) {
      var self = this;
      return this.SUPER(null, obj).then(function(obj) {
        self.on.put.pub(obj);
        return obj;
      });
    },

    function remove_(x, obj) {
      var self = this;
      return this.SUPER(null, obj).then(function(o) {
        self.on.remove.pub(obj);
        return o;
      });
    },

    function find_(x, key) {
      return this.SUPER(null, key);
    },

    function select_(x, sink, skip, limit, order, predicate) {
      if ( predicate === foam.mlang.predicate.True.create() ) predicate = null;
      if ( ! skip ) skip = 0;
      if ( ! limit ) limit = Number.MAX_SAFE_INTEGER;

      if ( ! this.Serializable.isInstance(sink) ) {
        var self = this;

        return this.SUPER(null, null, skip, limit, order, predicate).then(function(result) {
          var items = result.array;

          if ( ! sink ) return result;

          var sub = foam.core.FObject.create();
          var detached = false;
          sub.onDetach(function() { detached = true; });

          for ( var i = 0 ; i < items.length ; i++ ) {
            if ( detached ) break;

            sink.put(items[i], sub);
          }

          sink.eof();

          return sink;
        });
      }

      return this.SUPER(null, sink, skip, limit, order, predicate);
    },

    function removeAll_(x, skip, limit, order, predicate) {
      var self = this;
      return this.SUPER(null, skip, limit, order, predicate).then(function() {
        self.on.reset.pub();
        return;
      });
    },

    function listen_(x, sink, predicate) {
      return this.__context__.lookup('foam.dao.AbstractDAO').
        prototype.listen_.call(this, x, sink, predicate);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package :'foam.box',
  name: 'InvalidMessageException',

  properties: [
    'messageType'
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'EventMessage',

  properties: [
    {
      class: 'Array',
      name: 'args'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'EventDispatchBox',

  implements: ['foam.box.Box'],

  requires: [
    'foam.box.EventMessage',
    'foam.box.InvalidMessageException'
  ],

  properties: [
    {
      name: 'target'
    }
  ],

  methods: [
    function send(msg) {
      if ( ! this.EventMessage.isInstance(msg.object) ) {
        throw this.InvalidMessageException.create({
          messageType: message.cls_.id
        });
      }

      this.target.pub.apply(this.target, msg.object.args);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SkeletonBox',

  requires: [
    'foam.box.Message',
    'foam.box.RPCMessage',
    'foam.box.RPCReturnMessage',
    'foam.box.RPCErrorMessage',
    'foam.box.InvalidMessageException'
  ],

  properties: [
    {
      name: 'data'
    }
  ],

  methods: [
    function call(message) {
      var p;

      try {
        var method = this.data.cls_.getAxiomByName(message.object.name);
        var args = message.object.args.slice();

        // TODO: This is pretty hackish.  Context-Oriented methods should just be modeled.
        if ( method && method.args && method.args[0] && method.args[0].name == 'x' ) {
          var x = this.__context__.createSubContext({
            message: message
          });
          args[0] = x;
        }

        p = this.data[message.object.name].apply(this.data, args);
      } catch(e) {
        message.attributes.errorBox && message.attributes.errorBox.send(this.Message.create({
          object: this.RPCErrorMessage.create({ data: e.message })
        }));

        return;
      }

      var replyBox = message.attributes.replyBox;

      var self = this;

      if ( p instanceof Promise ) {
        p.then(
          function(data) {
            replyBox.send(self.Message.create({
              object: self.RPCReturnMessage.create({ data: data })
            }));
          },
          function(error) {
            message.attributes.errorBox && message.attributes.errorBox.send(self.Message.create({
              object: self.RPCErrorMessage.create({ data: error && error.toString() })
            }));
          });
      } else {
        replyBox && replyBox.send(this.Message.create({
          object: this.RPCReturnMessage.create({ data: p })
        }));
      }
    },

    function send(message) {
      if ( this.RPCMessage.isInstance(message.object) ) {
        this.call(message);
        return;
      }

      throw this.InvalidMessageException.create({
        messageType: message.cls_ && message.cls_.id
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'NullBox',

  implements: ['foam.box.Box'],

  methods: [
    {
      name: 'send',
      code: function() {}
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SocketBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.SocketConnectBox'
  ],

  axioms: [
    foam.pattern.Multiton.create({
      property: 'address'
    })
  ],

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      name: 'address'
    },
    {
      name: 'delegate',
      transient: true,
      factory: function() {
        return foam.box.SocketConnectBox.create({
          address: this.address
        }, this);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SocketBox2',

  imports: [
    'socketService',
  ],

  axioms: [
    foam.pattern.Multiton.create({
      property: 'address'
    })
  ],

  properties: [
    {
      class: 'String',
      name: 'address'
    },
    {
      name: 'promise',
      transient: true,
      factory: function() {
      }
    }
  ],

  methods: [
    function send(m) {
    }
  ],

  listeners: [
    function onConnect() {
      this.socketService.addSocket(this);
      this.send(this.RegisterSelfMessage.create({
        name: this.me.name
      }));
      this.connect.pub();
    },
    function onError() {
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SocketConnectBox',
  extends: 'foam.box.PromisedBox',

  requires: [
    'foam.net.node.Socket',
    'foam.box.RawSocketBox'
  ],

  properties: [
    {
      name: 'address'
    },
    {
      name: 'delegate',
      factory: function() {
        return this.Socket.create().connectTo(this.address).then(function(s) {
          return this.RawSocketBox.create({ socket: s });
        }.bind(this));
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RawSocketBox',

  properties: [
    'socket'
  ],

  methods: [
    function send(msg) {
      this.socket.write(msg);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'SendFailedError',
  extends: 'foam.box.Message',

  properties: [
    {
      name: 'original'
    },
    {
      name: 'error'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RegisterSelfMessage',
  extends: 'foam.box.Message',

  properties: [
    {
      class: 'String',
      name: 'name'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RawWebSocketBox',
  implements: ['foam.box.Box'],

  properties: [
    {
      class: 'Object',
      name: 'socket',
      javaType: 'org.java_websocket.WebSocket'
    }
  ],

  methods: [
    {
      name: 'send',
      code: function send(msg) {
        try {
          this.socket.send(msg);
        } catch(e) {
          if ( msg.errorBox ) msg.errorBox.send(foam.box.SendFailedError.create());
        }
      },
      javaCode: `
getSocket().send(getX().create(foam.lib.json.Outputter.class).stringify(message));
`
    }
  ]
});
foam.CLASS({
  package: 'foam.box',
  name: 'ReturnBox',
  documentation: 'A box that sends messages back over the connection it came in on.',
  implements: ['foam.box.Box'],
  methods: [
    {
      name: 'send',
      code: function(message) {
        this.__context__.returnBox.send(message);
      },
      javaCode: `
((foam.box.Box)getX().get("returnBox")).send(message);
`
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RawMessagePortBox',
  implements: [ 'foam.box.Box' ],

  requires: [ 'foam.json.Outputter' ],

  properties: [
    {
      name: 'port'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        // NOTE: Configuration must be consistent with parser in
        // foam.messageport.MessagePortService.
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],
  methods: [
    function send(m) {
      this.port.postMessage(this.outputter.stringify((m)));
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'WebSocketBox',

  requires: [
    'foam.net.web.WebSocket',
    'foam.box.Message',
    'foam.box.RegisterSelfMessage'
  ],

  imports: [
    'webSocketService',
    'me',
    'window'
  ],

  classes: [
    {
      name: 'JSONOutputter',
      extends: 'foam.json.Outputter',
      requires: [
        'foam.box.ReturnBox'
      ],
      imports: [
        'me'
      ],
      methods: [
        function output(o) {
          if ( o === this.me ) {
            return this.SUPER(this.ReturnBox.create());
          }
          return this.SUPER(o);
        }
      ]
    }
  ],

  axioms: [
    foam.pattern.Multiton.create({
      property: 'uri'
    })
  ],

  properties: [
    {
      name: 'uri',
    },
    {
      name: 'socket',
      factory: function() {
        var ws = this.WebSocket.create({
          uri: this.prepareURL(this.uri),
          outputter: this.JSONOutputter.create({
            pretty:               false,
            formatDatesAsNumbers: true,
            outputDefaultValues:  false,
            strict:               true,
            propertyPredicate: function(o, p) { return ! p.networkTransient; }
          })
        });

        return ws.connect().then(function(ws) {

          ws.disconnected.sub(function(sub) {
            sub.detach();
            this.socket = undefined;
          }.bind(this));

          ws.send(this.Message.create({
            object: this.RegisterSelfMessage.create({ name: this.me.name })
          }));

          this.webSocketService.addSocket(ws);

          return ws;
        }.bind(this));
      }
    }
  ],

  methods: [
    function prepareURL(url) {
      /* Add window's origin if url is not complete. */
      if ( this.window && url.indexOf(':') == -1 ) {
        return 'ws://' + this.window.location.hostname + ':' + ( Number.parseInt(this.window.location.port) + 1 ) + '/' + url;
      }

      return url;
    },

    function send(msg) {
      this.socket.then(function(s) {
        try {
          s.send(msg);
        } catch(e) {
          this.socket = undefined;
          if ( msg.errorBox ) {
            msg.errorBox.send(foam.box.SendFailedError.create());
          }
        }
      }.bind(this), function(e) {
        if ( msg.errorBox ) {
          msg.errorBox.send(e);
        }
        this.socket = undefined;
      }.bind(this));
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ClassWhitelistContext',
  exports: [
    'lookup'
  ],
  properties: [
    {
      class: 'StringArray',
      name: 'whitelist'
    },
    {
      name: 'whitelist_',
      expression: function(whitelist) {
        var w = {};
        for ( var i = 0 ; i < whitelist.length ; i++ ) {
          w[whitelist[i]] = true;
        }
        return w;
      }
    }
  ],
  methods: [
    {
      class: 'ContextMethod',
      name: 'lookup',
      code: function(X, id) {
        if ( ! this.whitelist_[id] ) {
          throw new Error('Class "' + id + '" is not whitelisted.');
        }
        return this.__context__.lookup.call(X, id);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'LoggedLookupContext',

  exports: [
    'lookup',
  ],

  properties: [
    {
      class: 'Map',
      name: 'record'
    }
  ],

  methods: [
    {
      class: 'ContextMethod',
      name: 'lookup',
      code: function(X, id) {
        this.record[id] = id;
        return this.__context__.lookup.call(X, id);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'Context',

  requires: [
    'foam.box.BoxRegistryBox',
    'foam.box.NamedBox',
    'foam.box.ClassWhitelistContext',
    'foam.box.LoggedLookupContext',
  ],

  exports: [
    'creationContext',
    'me',
    'messagePortService',
    'registry',
    'root',
    'socketService',
    'webSocketService'
  ],

  properties: [
    {
      name: 'messagePortService',
      hidden: true,
      factory: function() {
        var model = this.lookup('foam.messageport.MessagePortService', true);
        if ( model ) {
          return model.create({
            delegate: this.registry
          }, this);
        }
      }
    },
    {
      name: 'socketService',
      hidden: true,
      factory: function() {
        var model = this.lookup('foam.net.node.SocketService', true);
        if ( model ) {
          return model.create({
            port: Math.floor( 10000 + ( Math.random() * 10000 ) ),
            delegate: this.registry
          }, this);
        }
      }
    },
    {
      name: 'webSocketService',
      hidden: true,
      factory: function() {
        var model = this.lookup('foam.net.node.WebSocketService', true) ||
            this.lookup('foam.net.web.WebSocketService', true);

        if ( model ) {
          return model.create({
            delegate: this.registry
          }, this);
        }
      }
    },
    {
      name: 'registry',
      hidden: true,
      factory: function() {
        return this.BoxRegistryBox.create();
      }
    },
    {
      name: 'root',
      hidden: true,
      postSet: function(_, root) {
        foam.box.NamedBox.create({ name: '' }).delegate = root;
      }
    },
    {
      class: 'String',
      name: 'myname',
      hidden: true,
      factory: function() {
        return foam.isServer ?
          '/proc/' + require('process').pid + '/' + foam.uuid.randomGUID() :
          '/com/foamdev/anonymous/' + foam.uuid.randomGUID();
      }
    },
    {
      name: 'me',
      hidden: true,
      transient: true,
      factory: function() {
        var me = this.NamedBox.create({ name: this.myname });
        me.delegate = this.registry;
        return me;
      }
    },
    {
      class: 'Boolean',
      name: 'unsafe',
      value: true
    },
    {
      class: 'StringArray',
      name: 'classWhitelist'
    },
    {
      name: 'creationContext',
      documentation: `Provides required import for boxes that parse strings into
          FObjects.`,
      hidden: true,
      factory: function() {
        // TODO: Better way to inject the class whitelist.
        if ( this.unsafe ) {
          console.warn('**** Boxes are running in UNSAFE mode.  Turn this off before you go to production!');
          return this.LoggedLookupContext.create(null, this).__subContext__;
        }

        return this.ClassWhitelistContext.create({
          whitelist: this.classWhitelist
        }, this).__subContext__;
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'BoxService',

  properties: [
    {
      class: 'Class',
      name: 'server'
    },
    {
      class: 'Class',
      name: 'client'
    },
    {
      name: 'next'
    }
  ],

  methods: [
    function serverBox(box) {
      box = this.next ? this.next.serverBox(box) : box;
      return this.server.create({ delegate: box })
    },

    function clientBox(box) {
      box = this.client.create({ delegate: box });
      return this.next ?
        this.next.clientBox(box) :
        box;
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'HTTPReplyBox',
  implements: ['foam.box.Box'],

  imports: [
    // Optional import.
    //    'httpResponse'
  ],

  methods: [
    {
      name: 'send',
      code: function(m) {
        throw 'unimplemented';
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'AuthenticatedBox',
  extends: 'foam.box.ProxyBox',

  imports: [
    'idToken'
  ],

  methods: [
    function send(m) {
      m.attributes.idToken = this.idToken;
      this.SUPER(m);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'CheckAuthenticationBox',
  extends: 'foam.box.ProxyBox',

  imports: [
    'tokenVerifier'
  ],

  methods: [
    {
      name: 'send',
      code: function send() {
        throw new Error('Unimplemented.');
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
  package: 'foam.box',
  name: 'HTTPBox',

  implements: [ 'foam.box.Box' ],

  requires: [
    'foam.json.Outputter',
    'foam.json.Parser',
    'foam.net.web.HTTPRequest'
  ],

  imports: [
    'creationContext',
    {
      name: 'me',
      key: 'me',
      javaType: 'foam.box.Box'
    },
    'window'
  ],

  classes: [
    foam.core.InnerClass.create({
      generateJava: false,
      model: {
        name: 'JSONOutputter',
        extends: 'foam.json.Outputter',
        generateJava: false,
        requires: [
          'foam.box.HTTPReplyBox'
        ],
        imports: [
          'me'
        ],
        methods: [
          function output(o) {
            return this.SUPER(o == this.me ? this.HTTPReplyBox.create() : o);
          }
        ]
      }
    })
  ],

  properties: [
    {
      class: 'String',
      name: 'url'
    },
    {
      class: 'String',
      name: 'method',
      value: 'POST'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Parser',
      name: 'parser',
      generateJava: false,
      factory: function() {
        return this.Parser.create({
          strict:          true,
          creationContext: this.creationContext
        });
      }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      generateJava: false,
      factory: function() {
        return this.JSONOutputter.create({
          pretty:               false,
          formatDatesAsNumbers: true,
          outputDefaultValues:  false,
          strict:               true,
          propertyPredicate:    function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ],

  axioms: [
    {
      name: 'javaExtras',
      buildJavaClass: function(cls) {
        cls.extras.push(foam.java.Code.create({
          data: `
protected class Outputter extends foam.lib.json.Outputter {
  protected void outputFObject(StringBuilder out, foam.core.FObject o) {
    if ( o == getMe() ) {
      o = getX().create(foam.box.HTTPReplyBox.class);
    }
    super.outputFObject(out, o);
  }
}

protected class ResponseThread implements Runnable {
  protected java.net.URLConnection conn_;
  public ResponseThread(java.net.URLConnection conn) {
    conn_ = conn;
  }

  public void run() {
  }
}
`}));
      }
    }
  ],

  methods: [
    function prepareURL(url) {
      /* Add window's origin if url is not complete. */
      if ( this.window && url.indexOf(':') == -1 ) {
        return this.window.location.origin + '/' + url;
      }

      return url;
    },

    {
      name: 'send',
      code: function send(msg) {
        var req = this.HTTPRequest.create({
          url:     this.prepareURL(this.url),
          method:  this.method,
          payload: this.outputter.stringify(msg)
        }).send();

        req.then(function(resp) {
          return resp.payload;
        }).then(function(p) {
          var msg = this.parser.parseString(p);
          msg && this.me.send(msg);
        }.bind(this));
      },
      javaCode: `
java.net.HttpURLConnection conn;
try {
  java.net.URL url = new java.net.URL(getUrl());
  conn = (java.net.HttpURLConnection)url.openConnection();
  conn.setDoOutput(true);
  conn.setRequestMethod("POST");
  conn.setRequestProperty("Accept", "application/json");
  conn.setRequestProperty("Content-Type", "application/json");

  java.io.OutputStreamWriter output = new java.io.OutputStreamWriter(conn.getOutputStream(),
                                                                     java.nio.charset.StandardCharsets.UTF_8);


  output.write(new Outputter().stringify(message));
  output.close();


// TODO: There has to be a better way to do this.
byte[] buf = new byte[8388608];
java.io.InputStream input = conn.getInputStream();

int off = 0;
int len = buf.length;
int read = -1;
while ( len != 0 && ( read = input.read(buf, off, len) ) != -1 ) {
  off += read;
  len -= read;
}

if ( len == 0 && read != -1 ) {
  throw new RuntimeException("Message too large.");
}

String str = new String(buf, 0, off, java.nio.charset.StandardCharsets.UTF_8);

foam.core.FObject responseMessage = getX().create(foam.lib.json.JSONParser.class).parseString(str);

if ( responseMessage == null ) {
  throw new RuntimeException("Error parsing response.");
}

if ( ! ( responseMessage instanceof foam.box.Message ) ) {
  throw new RuntimeException("Invalid response type: " + responseMessage.getClass().getName() + " expected foam.box.Message.");
}

getMe().send((foam.box.Message)responseMessage);

} catch(java.io.IOException e) {
  // TODO: Error box?
  throw new RuntimeException(e);
}
`
    }
  ]
});

/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'MessagePortBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.RawMessagePortBox',
    'foam.box.RegisterSelfMessage',
    'foam.box.Message',
    'foam.json.Outputter'
  ],

  imports: [
    'me',
    'messagePortService'
  ],

  properties: [
    {
      name: 'target'
    },
    {
      name: 'delegate',
      factory: function() {
	var channel = new MessageChannel();
	this.messagePortService.addPort(channel.port1);

	this.target.postMessage(channel.port2, [ channel.port2 ]);

        channel.port1.postMessage(this.outputter.stringify(
            this.Message.create({
              object: this.RegisterSelfMessage.create({ name: this.me.name })
            })));

	return this.RawMessagePortBox.create({ port: channel.port1 });
      }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Outputter',
      name: 'outputter',
      factory: function() {
        // NOTE: Configuration must be consistent with parser in
        // foam.messageport.MessagePortService.
        return this.Outputter.create({
          pretty: false,
          formatDatesAsNumbers: true,
          outputDefaultValues: false,
          strict: true,
          propertyPredicate: function(o, p) { return ! p.networkTransient; }
        });
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ForwardedMessage',

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      name: 'destination'
    },
    {
      class: 'FObjectProperty',
      name: 'payload'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ForwardBox',
  extends: 'foam.box.ProxyBox',

  requires: [
    'foam.box.ForwardedMessage'
  ],

  properties: [
    {
      name: 'destination'
    }
  ],

  methods: [
    function send(m) {
      m.object = this.ForwardedMessage.create({
        destination: this.destination,
        payload: m.object
      });
      this.SUPER(m);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'ForwardingBox',
  implements: [ 'foam.box.Box' ],

  requires: [
    'foam.box.ForwardedMessage'
  ],

  methods: [
    function send(m) {
      if ( ! this.ForwardedMessage.isInstance(m.object) )
        throw foam.box.InvalidMessageException.create();

      var wrapper = m.object;
      m.object = wrapper.payload;

      wrapper.destination.describe();
      wrapper.destination.send(m);
    }
  ]
});

/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'Runnable',

  documentation: `An asynchronous computation that produces one or more outputs,
      and sends them to its outputBox, reporting any errors to errorBox.`,

  requires: [ 'foam.box.Message' ],

  properties: [
    {
      class: 'String',
      name: 'ioRelationshipType',
      documentation: 'The n:m relationship type of input-to-output.',
      value: '1:1'
    },
    {
      class: 'Class',
      documentation: 'Type of input parameter of run().',
      name: 'inputType',
      factory: function() { return foam.core.FObject; }
    },
    {
      class: 'Class',
      documentation: 'Type of input vaules produced by run().',
      name: 'outputType',
      factory: function() { return foam.core.FObject; }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      documentation: 'Box to send to for computation output(s).',
      name: 'outputBox'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      documentation: 'Box to send to for internal errors(s).',
      name: 'errorBox'
    }
  ],

  methods: [
    {
      name: 'run',
      documentation: 'Modeled computation for outputing to a box.',
      code: function() {}
    },
    {
      name: 'output',
      args: [
        {
          typeName: 'this.outputType',
          documentation: 'Helper function for outputing a value.',
        }
      ],
      code: function(value) {
        this.outputBox.send(this.Message.create({
          object: value
        }));
      }
    },
    {
      name: 'error',
      args: [
        {
          typeName: 'Error',
          documentation: 'Helper function for reporting an error.',
        }
      ],
      code: function(error) {
        this.errorBox.send(this.Message.create({
          object: error
        }));
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'LogBox',
  extends: 'foam.box.ProxyBox',

  documentation: 'Log input messages before passing to optional delegate.',

  requires: [ 'foam.log.LogLevel' ],

  imports: [
    'debug',
    'log',
    'info',
    'warn',
    'error'
  ],

  properties: [
    {
      class: 'String',
      name: 'name',
      factory: function() { return `LogBox${this.$UID}`; }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.log.LogLevel',
      name: 'logLevel',
      factory: function() { return this.LogLevel.INFO; }
    }
  ],

  methods: [
    function send(message) {
      var output = message.object;
      this[this.logLevel.consoleMethodName].apply(this, [
        this.name,
        output instanceof Error ? output.toString() :
          foam.json.Pretty.stringify(message)
      ]);
      this.delegate && this.delegate.send(message);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'BroadcastBox',
  implements: [ 'foam.box.Box' ],

  documentation: `Broadcast all messages to multiple delegate boxes.`,

  properties: [
    {
      class: 'FObjectArray',
      of: 'foam.box.Box',
      name: 'delegates'
    }
  ],

  methods: [
    function send(message) {
      var ds = this.delegates;
      for ( var i = 0; i < ds.length; i++ ) {
        ds[i].send(message);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box',
  name: 'RoundRobinBox',
  implements: [ 'foam.box.Box' ],

  documentation: 'Delegates messages to box workers using round robin strategy.',

  properties: [
    {
      class: 'Array',
      of: 'foam.box.Box',
      name: 'delegates',
    },
    {
      name: 'currentBoxId_',
      value: 0,
      preSet: function(_, val) {
        return val % this.delegates.length;
      }
    }
  ],

  methods: [
    function send(message) {
      this.delegates[this.currentBoxId_++].send(message);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box.pipeline',
  name: 'RunnableRPCBox',
  extends: 'foam.box.ProxyBox',

  documentation: 'A box that wraps input messages in Runnable.run() RPC calls.',

  requires: [
    'foam.box.Message',
    'foam.box.RPCMessage'
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      documentation: `Error box for routing errors when sending to
              runnable.`,
      name: 'errorBox'
    },
  ],

  methods: [
    function send(inputMessage) {
      return this.delegate && this.delegate.send(this.Message.create({
        object: this.RPCMessage.create({
          name: 'run',
          args: [ inputMessage.object ]
        }),
        attributes: { errorBox: this.errorBox }
      }));
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box.pipeline',
  name: 'PipelineNode',

  documentation: `foam.box.PipelineManager object that encapsulates data related
      to runnable.`,

  requires: [
    'foam.box.LogBox',
    'foam.box.PromisedBox',
    'foam.box.SkeletonBox',
    'foam.log.LogLevel'
  ],
  imports: [ 'defaultErrorBox?' ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.Runnable',
      name: 'runnable'
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      name: 'localInput',
      transient: true,
      expression: function(runnable) {
        return this.SkeletonBox.create({
          data: runnable
        });
      }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.PromisedBox',
      name: 'remoteInput',
      factory: function() { return this.PromisedBox.create(); }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      name: 'errorBox',
      documentation: 'Error box for RPC-related errors external to runnable.',
      factory: function() {
        return this.defaultErrorBox || this.LogBox.create({
          logLevel: this.LogLevel.ERROR
        });
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box.pipeline',
  name: 'PipelineManager',

  documentation: `A manager for composing pipelines of foam.box.Runnable
    instances. Pipelines may fork via multiple then()s. Manager's current
    runnables may be bound together with bind(); this can be used to merge
    pipelines. Pipelines may not contain cycles.

    Note that each runnable is registered as a service exactly once, even if
    a builder referring to pipeline stages is built multiple times.

    E.g.,

    var b = PipelineManager.create();
    var shared = b.then(sharedRunnable);

    shared.then(forkRunnable1);
    shared.then(forkRunnable2);

    var merge1Builder = PipelineManager.create().then(mergeRunnable1);
    var merge2Builder = PipelineManager.create().then(mergeRunnable1);
    merge1Builder.bind(shared);
    merge2Builder.bind(shared);

    var inputToMerge1Runnable = merge1Builder.build();
    var inputToMerge2Runnable = merge2Builder.build();
    // Yields input boxes for mergeRunnable1 and mergeRunnable2
    // on pipeline:
    //
    // mergeRunnable1 --                       -- forkRunnable1
    //                  >-- sharedRunnable -- <
    // mergeRunnable2 --                       -- forkRunnable2`,

  requires: [
    'foam.box.Box',
    'foam.box.BroadcastBox',
    'foam.box.LogBox',
    'foam.box.Message',
    'foam.box.RPCMessage',
    'foam.box.RPCReturnBox',
    'foam.box.pipeline.PipelineNode',
    'foam.box.pipeline.RunnableRPCBox'
  ],

  imports: [
    'registry',
    'defaultOutputBox? as ctxDefaultOutputBox'
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      name: 'defaultOutputBox',
      documentation: `Output box used for end-of-computation (when no
          next-to-run delegates bound to this step in the pipeline).`,
      factory: function() {
        return this.ctxDefaultOutputBox || this.LogBox.create();
      }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.pipeline.PipelineNode',
      name: 'pipeline',
      documentation: 'PipelineNode step for encapsulating runnable.',
      factory: function() { this.PipelineNode.create(); }
    },
    {
      class: 'FObjectArray',
      of: 'foam.box.pipeline.PipelineManager',
      name: 'delegates',
      documentation: `Immediate next step(s) in the pipeline after this runnable
          step.`,
      postSet: function(old, nu) {
        var pl = this.pipeline;

        if ( nu.length === 0 ) {
          // End of the line. Do not wrap RPCMessage around output box.
          pl.runnable.outputBox = this.defaultOutputBox;
        } else if ( this.delegates.length === 1 ) {
          // Just one delegate. Wrap RPCMessage around output value.
          pl.runnable.outputBox = this.RunnableRPCBox.create({
            delegate: nu[0].pipeline.remoteInput,
            errorBox: nu[0].pipeline.errorBox
          });
        } else {
          // Many delegates. Wrap RPCMessage around output value and pass along
          // to all delegates.
          pl.runnable.outputBox = this.BroadcastBox.create({
              delegates: nu.map(function(pipelineBuilder) {
                return this.RunnableRPCBox.create({
                  delegate: pipelineBuilder.pipeline.remoteInput,
                  errorBox: pipelineBuilder.pipeline.errorBox
                });
              }.bind(this))
          });
        }
      }
    },
    {
      class: 'FObjectArray',
      of: 'foam.box.pipeline.PipelineManager',
      name: 'parents',
      documentation: `Immediate previous step(s) in the pipeline before this
          runnable step.`,
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      name: 'builtInputBox_',
      documentation: `Input box that can be returned from building this
          builder. Accepts messages containing this runnable step's inputType.`,
      value: null
    }
  ],

  methods: [
    function init() {
      this.validate();
      foam.assert(this.Box.isInstance(this.registry),
                  'PipelineNode requires registry that implements Box');
      this.SUPER();
    },
    {
      name: 'then',
      returns: { typeName: 'foam.box.pipeline.PipelineManager' },
      args: [ { typeName: 'foam.box.Runnable' } ],
      documentation: `Append an immediate next step to pipeline.`,
      code: function(runnable) {
        var pl = this.pipeline;
        if ( ! pl ) {
          this.pipeline = this.PipelineNode.create({ runnable: runnable });
          return this;
        }

        var next = this.cls_.create({
          pipeline: this.PipelineNode.create({ runnable: runnable }),
          parents: [ this ]
        }, this.__subContext__);
        this.delegates = this.delegates.concat([ next ]);
        return next;
      }
    },
    {
      name: 'bind',
      args: [ { typeName: 'foam.box.pipeline.PipelineManager' } ],
      documentation: `Bind this pipeline manager's current runnable to
          parameter's current runnable. Not a continuation (no return value).`,
      code: function(pipelineBuilder) {
        this.delegates = this.delegates.concat([ pipelineBuilder ]);
        pipelineBuilder.parents = pipelineBuilder.parents.concat([ this ]);
      }
    },
    {
      name: 'build',
      documentation: `Build the entire pipeline, allowing multiple heads.`,
      returns: {
        typeName: 'Array[foam.box.Box]',
        documentation: `Input boxes accepting messages containing the inputTypes
            of each head's runnable. Boxes are in the order they first()ed to
            the merge points in the pipeline.`
      },
      code: function() {
        var ret = this.build_();
        if ( this.parents.length === 0 ) return ret;

        // Flatten arrays of heads build_()ing backwards in the pipeline.
        this.parents.map(function(parent) { return parent.build(); })
            .reduce(function(acc, v) { return acc.concat(v); }, []);

        return ret;
      }
    },
    function build_() {
      if ( this.builtInputBox_ ) return this.builtInputBox_;

      // Build forward, just in case build() was initiated in the middle of a
      // pipeline. NOTE: This is incompatible with circular pipelines.
      this.delegates.map(function(delegate) { return delegate.build_(); });

      if ( this.builtInputBox_ ) return this.builtInputBox_;

      var pl = this.pipeline;
      var onRegisteredBox = this.RPCReturnBox.create();
      var onRegisteredPromise = onRegisteredBox.promise;
      this.registry.send(this.Message.create({
        object: this.RPCMessage.create({
          name: 'register',
          args: [ null, null, pl.localInput ]
        }),
        attributes: {
          replyBox: onRegisteredBox,
          errorBox: pl.errorBox
        }
      }));
      pl.remoteInput.delegate = onRegisteredPromise;

      // Accept input objects as input; return box that will wrap them in RPCs
      // to runnable.
      return this.builtInputBox_ = this.RunnableRPCBox.create({
        delegate: pl.remoteInput,
        errorBox: pl.errorBox
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box.pipeline',
  name: 'PipelineBuilder',

  documentation: `Simplified builder pattern for constructing pipeliens.

    E.g.,

    var merge1 = PipelineBuilder.create().append(mergeRunnable1);
    var merge2 = PipelineBuilder.create().append(mergeRunnable2);
    var sharedAndF1 = PipelineBuilder.create().append(sharedRunnable);
    var f2 = sharedAndF1.fork(forkRunnable2);

    sharedAndF1.append(forkRunnable1);
    merge1.append(sharedAndF1);
    merge2.append(sharedAndF1);

    var inputBoxForMerge1 = merge1.build();
    var inputBoxForMerge2 = merge2.build();
    // Yields input boxes for mergeRunnable1 and mergeRunnable2
    // on pipeline:
    //
    // mergeRunnable1 --                       -- forkRunnable1
    //                  >-- sharedRunnable -- <
    // mergeRunnable2 --                       -- forkRunnable2`,

  requires: [
    'foam.box.Runnable',
    'foam.box.pipeline.PipelineManager'
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.box.pipeline.PipelineManager',
      name: 'head_',
      value: null
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.pipeline.PipelineManager',
      name: 'tail_',
      value: null
    }
  ],

  methods: [
    function append(o) {
      if ( this.Runnable.isInstance(o) )
        return this.appendRunnable_(o);
      else if ( this.cls_.isInstance(o) )
        return this.appendPipeline_(o);

      throw new Error('Pipeline: Do not know how to append ' + o.toString());
    },
    function fork(o) {
      var ret = this.cls_.create(null, this.__subContext__).append(o);
      this.tail_.bind(ret.head_);
      return ret;
    },
    function build() {
      return this.head_.build();
    },
    function appendRunnable_(runnable) {
      if ( ! this.head_ ) {
        this.head_ = this.tail_ = this.PipelineManager.create().then(runnable);
        return this;
      }

      this.tail_ = this.tail_.then(runnable);
      return this;
    },
    function appendPipeline_(pipeline) {
      this.tail_.bind(pipeline.head_);
      // Don't use clone(); shallow copy.
      return this.cls_.create({
        head_: this.head_ || pipeline.head_,
        tail_: pipeline.tail_
      }, this.__subContext__);
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

/**
Async functions compose other asynchronous functions that return promises.

<p>One key to using these functions is to note that they return a function
that does the real work, so calling foam.async.sequence(myFuncArray),
for instance, doesn't create a promise or call any of the functions passed
to it. It instead sets up and returns a function that will return a promise
and evaluate arguments as needed.

<p>To use the returned function, pass it to a Promise.then call:
<pre>Promise.resolve().then(foam.async.sequence( [ fn1, fn2 ] ));</pre>
<p>Or create a new promise:
<pre>var p = new Promise(foam.async.sequence( [ fn1, fn2 ] ));</pre>

<p>Async functions can also be nested:
<pre>
var seq = foam.async.sequence([
  foam.async.log("Starting..."),
  foam.async.repeat(10, foam.async.sequence([
    function(i) { console.log("iteration", i); }),
    foam.async.sleep(1000)
  ])
]);
Promise.resolve().then(seq).then(foam.async.log("Done!"));
</pre>
 */
foam.LIB({
  name: 'foam.async',

  methods: [
    function sequence(s) {
      /** Takes an array of functions (that may return a promise) and runs
        them one after anther. Functions that return a promise will have that
        promise chained, such that the next function will not run until the
        previous function's returned promise is resolved.

        <p>Errors are not handled, so chain any desired error handlers
        onto the promise returned.

        <p>You can use sequence's returned function directly in a then call:
        <pre>promise.then(foam.async.sequence(...));</pre>
        <p>Or call it directly:
        <pre>(foam.async.sequence(...))().then(...);</pre>

        @param {Array} s An array of functions that return Promises
        @returns {Function}  A function that returns a promise that will
                       resolve after the last function's return is resolved.
      */
      return function() {
        if ( ! s.length ) return Promise.resolve();

        var p = Promise.resolve();
        for ( var i = 0; i < s.length; ++i ) {
          p = p.then(s[i]);
        }
        return p;
      }
    },

    function repeat(times, fn) {
      /** Takes a function (that may return a promise) and runs it multiple
        times. A function that returns a promise will have that
        promise chained, such that the next call will not run until the
        previous call's returned promise is resolved. The function passed in
        will be called with one argument, the number of the iteration, from
        0 to times - 1.

        <p>Errors are not handled, so chain any desired error handlers
        onto the promise returned.

        <p>You can use repeat's returned function directly in a then call:
        <pre>promise.then(foam.async.repeat(...));</pre>
        <p>Or call it directly:
        <pre>(foam.async.repeat(...))().then(...);</pre>

        @param {Number} times number of times to repeat in sequence.
        @param {Function} fn Function that returns a Promise.
        @returns {Function}  A function that returns a Promise that will resolve
                       after the last repetition's return resolves.
      */
      return function() {
        var p = Promise.resolve();
        var n = 0;
        for ( var i = 0; i < times; ++i ) {
          p = p.then(function() { return fn(n++); });
        }
        return p;
      };
    },

    /**
      Takes a function (that may return a promise) and runs it multiple
      times in parallel. A function that returns a promise will have that
      promise chained, such that the entire group will not resolve until
      all returned promises have resolved (as in the standard Promise.all);
      The function passed in
      will be called with one argument, the number of the iteration, from
      0 to times - 1.

      <p>Errors are not handled, so chain any desired error handlers
      onto the promise returned.

      <p>You can use repeatParallel's returned function directly in a then call:
      <pre>promise.then(foam.async.repeatParallel(...));</pre>
      <p>Or call it directly:
      <pre>(foam.async.repeatParallel(...))().then(...);</pre>


      @param {Number} times number of times to repeat in sequence.
      @param {Function} fn Function that returns a Promise.
      @returns {Function}  A function that returns a Promise that will resolve
                   after every repetition's return resolves
    */
    function repeatParallel(times, fn) {
      return function() {
        var promises = [];
        for ( var i = 0; i < times; ++i ) {
          promises[i] = fn(i); // TODO: what if not returned a promise?
        }
        return Promise.all(promises);
      };
    },

    function log() {
      /** Returns a function you can pass to a .then call, or other foam.async
        functions. Takes variable arguments that are passed to console.log. */
      var args = arguments;
      return function() {
        console.log.apply(console, args);
        return Promise.resolve();
      };
    },

    function sleep(/* Number */ time) {
      /** Returns a function that returns a promise that delays by the given
        time before resolving. */
      return function() {
        return new Promise(function(resolve, reject) {
          setTimeout(function() { resolve(); }, time);
        });
      };
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.dao',
  name: 'ClientSink',
  implements: [ 'foam.dao.Sink' ],
  properties: [
    {
      class: 'Stub',
      of: 'foam.dao.Sink',
      name: 'delegate'
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.comics',
  name: 'DAOController',

  topics: [
    'finished'
  ],

  properties: [
    {
      name: 'data',
      hidden: true
    },
    {
      name: 'predicate',
      view: { class: 'foam.u2.view.ReciprocalSearch' }
    },
    {
      name: 'filteredDAO',
      view: { class: 'foam.u2.view.ScrollTableView' },
      expression: function(data, predicate) {
        return predicate ? data.where(predicate) : data;
      }
    },
    {
      name: 'relationship'
    },
    {
      name: 'selection',
      hidden: true
    },
    {
      class: 'Boolean',
      name: 'createEnabled',
      documentation: 'True to enable the create button.',
      value: true
    },
    {
      class: 'Boolean',
      name: 'editEnabled',
      documentation: 'True to enable the edit button',
      value: true
    },
    {
      class: 'Boolean',
      name: 'selectEnabled',
      documentation: 'True to enable the select button.',
      value: false
    },
    {
      class: 'Boolean',
      name: 'addEnabled',
      documentation: 'True to enable the Add button for adding to a relationship',
      value: false
    }
  ],

  actions: [
    {
      name: 'create',
      isAvailable: function(createEnabled) { return createEnabled; },
      code: function() { }
    },
    {
      name: 'edit',
      isEnabled: function(selection) { return !! selection; },
      isAvailable: function(editEnabled) { return editEnabled; },
      code: function() {
        this.pub('edit', this.selection.id);
      }
    },
    {
      name: 'findRelatedObject',
      label: 'Add',
      isAvailable: function(relationship, addEnabled) {
        // Only enable the Add button if we're not already trying to choose a selected item for a relationship.
        return !! ( relationship && relationship.junctionDAO ) && ! addEnabled;
      },
      code: function() { }
    },
    {
      name: 'addSelection',
      label: 'Add',
      isAvailable: function(addEnabled) { return addEnabled; },
      code: function() {
        var self = this;
        this.relationship.add(this.selection).then(function() {
          self.finished.pub();
        });
      }
    },
    {
      name: 'select',
      isAvailable: function(selectEnabled) { return selectEnabled; },
      isEnabled: function(selection) { return !! selection; },
      code: function() {
        this.pub('select', this.selection.id);
        this.finished.pub();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.comics',
  name: 'DAOCreateController',

  topics: [
    'finished'
  ],

  properties: [
    {
      name: 'dao'
    },
    {
      class: 'Boolean',
      name: 'inProgress'
    },
    {
      name: 'exception'
    },
    {
      name: 'data',
      view: { class: 'foam.u2.DetailView' },
      factory: function() {
        return this.dao ? this.dao.of.create() : null;
      }
    }
  ],

  actions: [
    {
      name: 'save',
      isEnabled: function(dao, data$errors_, inProgress) { return !! dao && ! inProgress && ! data$errors_; },
      code: function() {
        this.inProgress = true;
        this.clearProperty('exception');
        var self = this;
        this.dao.put(this.data.clone()).then(function() {
          self.inProgress = false;
          self.finished.pub();
        }, function(e) {
          self.inProgress = false;
          self.exception = e;
        });
      }
    },
    {
      name: 'cancel',
      code: function() {
        this.finished.pub();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.comics',
  name: 'DAOUpdateController',

  topics: [
    'finished'
  ],

  properties: [
    {
      name: 'dao'
    },
    {
      name: 'data'
    },
    {
      name: 'obj',
      view: { class: 'foam.u2.DetailView', showActions: true },
      factory: function() {
        var self = this;
        this.dao.find(this.data).then(function(obj) {
          self.obj = obj.clone();
        });
        return null;
      }
    }
  ],

  actions: [
    function cancel() {
      this.finished.pub();
    },
    {
      name: 'save',
      isEnabled: function(obj) { return !! obj; },
      code: function() {
        var self = this;
        this.dao.put(this.obj.clone()).then(function() {
          self.finished.pub();
        }, function(e) {
          // TODO: Display error in view.
          console.error(e);
        });
      }
    },
    {
      name: 'delete',
      isEnabled: function(obj) { return !! obj; },
      code: function() {
        var self = this;
        this.dao.remove(this.obj).then(function() {
          self.finished.pub();
        }, function(e) {
          // TODO: Display error in view.
          console.error(e);
        });
      }
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  refines: 'foam.box.SocketBox2',
  properties: [
    {
      name: 'socket',
      transient: true,
      factory: function() {
        return new require('net').Socket();
      },
      postSet: function(_, socket) {
        socket.on('connect', this.onConnect);
        socket.on('error', this.onError);
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.box.node',
  name: 'ForkBox',
  extends: 'foam.box.PromisedBox',

  documentation: `A PromisedBox that resolves to a RawSocketBox connected to
      a newly forked child process.`,

  requires: [
    'foam.box.Message',
    'foam.box.ReplyBox',
    'foam.box.SocketBox',
    'foam.box.SubBox'
  ],
  imports: [
    'me',
    'registry',
    'socketService'
  ],

  // TODO(markdittmer): Turn these into static methods.
  constants: {
    // Outputter compatible with ForkBox.PARSER_FACTORY().
    OUTPUTTER_FACTORY: function() {
      return foam.json.Outputter.create({
        pretty: false,
        formatDatesAsNumbers: true,
        outputDefaultValues: false,
        useShortNames: false,
        strict: true,
        propertyPredicate: function(o, p) { return ! p.networkTransient; }
      });
    },
    // Parser compatible with ForkBox.OUTPUTTER_FACTORY().
    PARSER_FACTORY: function(creationContext) {
      return foam.json.Parser.create({
        strict: true,
        creationContext: creationContext
      });
    },
    // Static method for use by forked script to connect to parent process.
    // NOTE: context "ctx" should be a sub-context of a foam.box.Context.
    CONNECT_TO_PARENT: function(ctx) {
      ctx.socketService.listening$.sub(function(sub, _, __, slot) {
        if ( ! slot.get() ) return;

        sub.detach();
        var stdin = require('process').stdin;
        var buf = '';
        stdin.on('data', function(data) {
          buf += data.toString();
        });
        stdin.on('end', function() {
          var parser = foam.box.node.ForkBox.PARSER_FACTORY(
              ctx.creationContext);
          parser.parseString(buf, ctx).send(foam.box.Message.create({
            // TODO(markdittmer): RegisterSelfMessage should handle naming. Is
            // "name:" below necessary?
            object: foam.box.SocketBox.create({
              name: ctx.me.name,
              address: `0.0.0.0:${ctx.socketService.port}`
            })
          }));
        });
      });
    }
  },

  properties: [
    {
      class: 'Boolean',
      documentation: `Whether child process should be detached from parent
          (https://nodejs.org/api/child_process.html#child_process_options_detached).`,
      name: 'detached'
    },
    {
      class: 'String',
      name: 'nodePath',
      documentation: 'The path to the Node JS binary.',
      value: 'node'
    },
    {
      class: 'Array',
      of: 'String',
      name: 'nodeParams',
      documentation: `Parameters passed to Node JS before naming the top-level
          script to run.`
    },
    {
      class: 'String',
      name: 'childScriptPath',
      documentation: `The top-level script of the forked process.`
    },
    {
      class: 'FObjectProperty',
      of: 'foam.box.Box',
      documentation: `Box used for child's SocketBox reply.`,
      name: 'replyBox_'
    },
    {
      name: 'child_',
      documentation: 'The Node ChildProcess object of the forked child process.'
    }
  ],

  methods: [
    function init() {
      this.validate();
      this.SUPER();

      this.delegate = new Promise(function(resolve, reject) {
        this.replyBox_ = this.ReplyBox.create({
          delegate: {
            send: function(message) {
              if ( ! this.SocketBox.isInstance(message.object) ) {
                reject(new Error('ForkBox failed to bind to child socket'));
              }
              resolve(message.object);
            }.bind(this)
          }
        });
      }.bind(this));
      this.registry.register(this.replyBox_.id, null, this.replyBox_);

      this.child_ = require('child_process').spawn(
          this.nodePath,
          this.nodeParams.concat([ this.childScriptPath ]),
          { detached: this.detached });

      var process = require('process');
      this.child_.stdout.pipe(process.stdout);
      this.child_.stderr.pipe(process.stderr);

      this.socketService.listening$.sub(this.onSocketListening);
    }
  ],

  listeners: [
    function onSocketListening(sub, _, __, slot) {
      if ( ! slot.get() ) return;

      sub.detach();
      var outputter = this.OUTPUTTER_FACTORY();
      this.child_.stdin.end(
          outputter.stringify(this.SubBox.create({
            name: this.replyBox_.id,
            // TODO(markdittmer): RegisterSelfMessage should handle naming. Is
            // "name:" below necessary?
            delegate: this.SocketBox.create({
              name: this.me.name,
              address: `0.0.0.0:${this.socketService.port}`
            })
          }),
          'utf8',
          function() {
            this.child_.unref();
          }.bind(this)));
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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
  package: 'foam.net',
  name: 'HTTPMethod',
  extends: 'foam.core.Method',

  documentation: `
  A method that is configured to call a service over HTTP.
  No code or function body is required here, as the actual body is generated to
  call the remote service. This will always return a promise that supplies the
  return value of the service call.

  <p>Overriding by an HTTPMethod is not supported. You can override an
  HTTPMethod with a normal one.
  `,

  requires: [
    'foam.net.HTTPArgument',
    'foam.core.Imports'
  ],

  constants: {
    OUTPUTTER: {
      __proto__: foam.json.Strict,
      outputDefaultValues: false,
      outputClassNames: false
    }
  },

  properties: [
    {
      /** The path prefix. Parameters may add to the path */
      name: 'path'
    },
    {
      name: 'httpMethod',
      value: 'GET',
    },
    {
      /** The args to call with, in order */
      class: 'FObjectArray',
      name: 'args',
      of: 'foam.net.HTTPArgument',
      factory: function() { return []; }
    },
    {
      /** If the request should build a request body object and fill in the
        supplied args, the request object's Class is specified here. */
      class: 'Class',
      name: 'buildRequestType',
    },
    {
      /** HTTPMethods will always return a Promise, but the Promise will pass
        along a parameter of the type specified here. */
      name: 'promisedType',
      of: 'foam.core.Argument'
    },
    [ 'returns', 'Promise' ],
    {
      /** The name of the HTTP factory to import at run time. Instances of
        HTTPMethod on a class will cause the class to import this name, and
        when called will call hostInstance.yourHttpFactoryName.create() to
        create a partially filled request object. */
      name: 'HTTPRequestFactoryName',
      value: 'HTTPRequestFactory'
    },
    {
      name: 'code',
      required: false,
      transient: true,
      expression: function(args) {
        // set up function with correct args, pass them into the
        // actual implementation, callRemote_()
        var axiom = this;
        // Get list of argument names
        var argNames = args.map(axiom.HTTPArgument.NAME.f);
        // load named values into opt_args object and pass to the generic callRemote_()
        return function() {
          var opt_args = {};
          for ( var i = 0; i < arguments.length && i < argNames.length; i ++ ) {
            opt_args[argNames[i]] = arguments[i];
          }
          return axiom.callRemote_(opt_args, this);
        }

      }
    }
  ],

  methods: [
    function installInClass(c) {
      // add an import for the HTTPRequestFactory on our host class

      // May have many HTTPMethods in a host class, but only do service import once.
      var existing = c.getAxiomByName(this.HTTPRequestFactoryName);
      foam.assert( existing,
        "HTTPMethod installInClass did not find an import or property", this.HTTPRequestFactoryName, ".",
        "Provide one, or set HTTPMethod.HTTPRequestFactoryName to the name of your request factory function.");
    },

    function installInProto(p) {
      // set code on proto
      p[this.name] = this.code;
    },

    function callRemote_(opt_args, host) {
      foam.assert( typeof host[this.HTTPRequestFactoryName] === 'function',
        "HTTPMethod call can't find HTTPRequestFactory",
        this.HTTPRequestFactoryName, "on", host);

      // 'this' is the axiom instance
      var self = this;
      var path = this.path;
      var query = "";
      var request = host[this.HTTPRequestFactoryName]();

      // if building a request object, start with an empty instance
      var requestObject = self.buildRequestType ?
        self.buildRequestType.create(undefined, foam.__context__) : null;

      // add on args passed as part of the path or query
      self.args.forEach(function(param) {
        var val = opt_args[param.name];
        if ( typeof val === 'undefined' ) return; // skip missing args // TODO: assert non-optional

        // put the dot back if we removed one from the name
        var pname = param.name.replace('__dot__','.');
        if ( param.location === 'body' ) {
          // set the request body content
          // TODO: assert it's the first param, no more than one body
          if ( requestObject ) {
            throw "Can't set both RequestObject " +
              self.buildRequestType + " and param.location==body for " + pname;
          }
          request.payload = self.OUTPUTTER.stringify(val);
        } else if ( param.location === 'path' ) {
          // find the placeholder and replace it
          path = path.replace("{"+pname+"}", val.toString());
          if ( requestObject ) requestObject[pname] = val;
        } else if ( param.location === 'query' ) {
          // add to query string
          query += "&" + pname + "=" + val.toString();
          if ( requestObject ) requestObject[pname] = val;
        }
      });
      path = path + ( query ? "?" + query.substring(1) : "" );
      request.path += path;
      request.method = self.httpMethod;
      if ( requestObject ) {
        request.payload = self.OUTPUTTER.stringify(requestObject);
      }

      return request.send().then(function(response) {
        if ( response.status >= 400 ) {
          throw "HTTP error status: " + response.status;
        }
        foam.assert(response.responseType === 'json', "HTTPMethod given a request not configured to return JSON", request);
        return response.payload.then(function(json) {
          if ( ! self.promisedType ) {
            // no return
            return;
          }
          if ( ! self.promisedType.type ) { // TODO: should not need this check. Getter in Arg.type?
            self.promisedType.type = this.lookup(self.promisedType.typeName, true);
          }
          if ( self.promisedType.type ) {
            // a modelled return type
            return self.promisedType.type.create(json, host);
          }
          // else return raw json
          return json;
        });
      });
    }
  ]
});


foam.CLASS({
  package: 'foam.net',
  name: 'HTTPArgument',
  extends: 'foam.core.Argument',

  properties: [
    {
      /** The location to put this value in the request: 'query', 'path', or 'body' */
      name: 'location',
      value: 'query',
    }
  ]
});
/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
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

(function() {
  var pkg = 'foam.net.' + (foam.isServer ? 'node' : 'web');
  var clss = [
    'BaseHTTPRequest',
    'HTTPRequest',
    'HTTPResponse',
    'WebSocket',
    'WebSocketService'
  ];

  // For each class with a "web" (browser) and "node" (Node JS)
  // implementation, register "foam.net.[environment].[class]" as
  // "foam.net.[class]".
  //
  // TODO: This should be provided via a sort of "ContextFactory" or similar.
  for ( var i = 0; i < clss.length; i++ ) {
    foam.register(foam.lookup(pkg + '.' + clss[i]), 'foam.net.' + clss[i]);
  }
})();
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.net',
  name: 'RetryHTTPRequest',
  extends: 'foam.net.BaseHTTPRequest',

  documentation: `HTTP request for retrying requests that fail at the service
      level; e.g., network timeout, connection reset. This class does not check
      HTTP status codes, it simply retries requests that reject-on-send().`,

  requires: [ 'foam.net.BaseHTTPRequest' ],
  imports: [ 'error', 'warn' ],

  properties: [
    {
      class: 'Int',
      name: 'numTries',
      value: 4
    },
    {
      class: 'Proxy',
      of: 'foam.net.BaseHTTPRequest',
      name: 'delegate',
      factory: function() {
        return this.BaseHTTPRequest.create(this);
      }
    },
    {
      class: 'Int',
      name: 'currentTry_'
    }
  ],

  methods: [
    function send() {
      return this.delegate.send().catch(this.onError);
    }
  ],

  listeners: [
    function onError(error) {
      this.currentTry_++;
      this.warn('RetryHTTPRequest: Try #' + this.currentTry_ +
                ' failed on ' + error);
      if ( this.currentTry_ < this.numTries ) {
        return this.send();
      } else {
        this.error('RetryHTTPRequest: Max tries reached');
        throw new Error('RetryHTTPRequest: Max tries reached');
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.net.auth',
  name: 'TokenBearerCredential',

  documentation: `Data class for "Authorization: Bearer <access token>"-style
      authentication.`,

  properties: [
    {
      class: 'String',
      documentation: `Token used for "Authorization: Bearer <token>"-style HTTP
          request authentication.`,
      name: 'accessToken'
    },
    {
      class: 'Int',
      documentation: `date.getTime()-style time stamp of "accessToken"
          expiration.`,
      name: 'expiry'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.net.auth',
  name: 'AuthAwareHTTPRequest',
  extends: 'foam.net.BaseHTTPRequest',

  documentation: 'Abstract class for HTTP requests that require authorization.',

  requires: [ 'foam.net.BaseHTTPRequest' ],
  imports: [ 'authAgent? as ctxAuthAgent' ],

  properties: [
    {
      class: 'Proxy',
      of: 'foam.net.BaseHTTPRequest',
      name: 'delegate',
      factory: function() {
        return this.BaseHTTPRequest.create(this);
      }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.net.auth.AuthAgent',
      name: 'authAgent',
      factory: function() { return this.ctxAuthAgent || null; }
    }
  ],

  methods: [
    function send() {
      var send = this.delegate.send.bind(this.delegate);
      if ( ! this.authAgent ) return send();
      if ( ! this.authAgent.requiresAuthorization(this) ) return send();

      return this.authAgent.getCredential().then(this.onGetCredential)
          .then(send).then(this.onAuthorizedResponse);
    }
  ],

  listeners: [
    {
      name: 'onGetCredential',
      documentation: 'Prepare request using credential from "authAgent".',
      code: function() {
        throw new Error("Abstract AuthAwareHTTPRequest doesn't understand " +
            'credentials');
      }
    },
    {
      name: 'onAuthorizedResponse',
      documentation: `Check response on authorized request for HTTP 401, in
          which case, retry.`,
      code: function(response) {
        if ( response.status !== 401 ) return response;

        var send = this.delegate.send.bind(this.delegate);
        return this.authAgent.refreshCredential().then(this.onGetCredential)
            .then(send).then(this.onRetryResponse);
      }
    },
    {
      name: 'onRetryResponse',
      documentation: `Check response on authorized request for HTTP 401, in
          which case, throw: forced  credential refresh didn't work.`,
      code: function(response) {
        if ( response.status !== 401 ) return response;

        throw new Error('Authorization failed: Request rejected after forced credential refresh');
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.net.auth',
  name: 'TokenBearerHTTPRequest',
  extends: 'foam.net.auth.AuthAwareHTTPRequest',

  documentation: `Auth-aware HTTP request that uses the TOKEN_BEARER
      CredentialType for "Authorization: Bearer <access token>"-style
      authorization.`,

  listeners: [
    function onGetCredential(credential) {
      this.delegate.headers['Authorization'] =
          'Bearer ' + credential.accessToken;
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
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
  package: 'foam.net.auth',
  name: 'AuthAgent',

  documentation: `An agent that is able to authenticate on application's behalf
      for HTTP requests that require authorization. Implementations must do the
      following:

      (0) Export self as "authAgent" (already done in base class);
      (1) Register an auto-authenticating HTTPRequest as 'foam.net.HTTPRequest'
          in agents' sub-contexts;
      (2) Implement getCredential() and refreshCredential().

      Clients instantiating agents must provide a requiresAuthorization(request)
      implementation; this allows authenticating HTTPRequests to determine
      whether or not to authenticate before attempting a request.`,

  exports: [ 'as authAgent' ],

  properties: [
    {
      class: 'Function',
      documentation: `Determine whether or not a URL requires authorization
          via an authentication step managed by this agent. This procedure is
          treated as data rather than a method because it is typically injected
          for an agent at runtime. E.g., a particular Google 2LO agent would be
          bound to particular URLs and particular scopes.`,
      name: 'requiresAuthorization',
      required: true
    },
  ],

  methods: [
    function init() {
      this.validate();
      this.SUPER();
    },
    function validate() {
      this.SUPER();
      foam.assert(
          this.__context__.lookup('foam.net.BaseHTTPRequest') !==
              this.__subContext__.lookup('foam.net.HTTPRequest'),
          'AuthAgent implementation must register its HTTPRequest decorator ' +
              'as foam.net.HTTPRequest');
    },
    {
      name: 'getCredential',
      documentation: 'Aynchronously get an unexpired credential.',
      code: function() {
        return Promise.reject(new Error('Unable to get credential'));
      }
    },
    {
      name: 'refreshCredential',
      documentation: 'Aynchronously get a new credential.',
      code: function() {
        return Promise.reject(new Error('Unable to refresh credential'));
      }
    }
  ]
});
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
  package: 'foam.net.node',
  name: 'Handler',

  documentation: `Abstract Handler class; handle() returns true if handled,
      false if the server should keep looking.`,

  imports: [
    'warn',
    'error'
  ],

  methods: [
    function handle() {
      this.warn('Abstract Handler.handle() call');
      return false;
    },

    function send(res, status, body) {
      res.statusCode = status;
      res.write(body, 'utf8');
      res.end();
    },

    function sendJSON(res, status, json) {
      res.setHeader('Content-type', 'application/json');
      this.send(res, status, JSON.stringify(json));
    },

    function sendStringAsHTML(res, status, str) {
      res.setHeader('Content-type', 'text/html; charset=utf-8');
      this.send(res, status, foam.parsers.html.escapeString(str));
    },

    function send400(req, res, error) {
      this.sendMessage(req, res, 400, 'Bad request');
      this.reportErrorMsg(req, ' Bad request: ' + error);
    },

    function send404(req, res) {
      this.sendMessage(req, res, 404, 'File not found: ' + req.url);
    },

    function send500(req, res, error) {
      this.sendMessage(req, res, 500, 'Internal server error');
      this.reportErrorMsg(req, 'Internal server error: ' + error);
    },
    function sendMessage(req, res, status, msg) {
      if ( req.headers.accept &&
          req.headers.accept.indexOf('application/json') !== -1 ) {
        this.sendJSON(res, status, { message: msg });
      } else {
        this.sendStringAsHTML(res, status, msg);
      }
    },
    function reportWarnMsg(req, msg) {
      this.warn(req.socket.remoteAddress, msg);
    },
    function reportErrorMsg(req, msg) {
      this.error(req.socket.remoteAddress, msg);
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.net.node',
  name: 'FileHandler',
  extends: 'foam.net.node.Handler',

  documentation: 'HTTP(S) server handler for a single file.',

  imports: [ 'info' ],

  properties: [
    {
      class: 'String',
      name: 'urlPath',
      documentation: 'Path part of URL to map to file.',
      required: true
    },
    {
      class: 'String',
      name: 'filePath',
      documentation: 'File location.',
      required: true
    },
    {
      name: 'mimeTypes',
      factory: function() {
        return {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.html': 'text/html',
          __default: 'application/octet-stream'
        };
      }
    },
    {
      name: 'fs',
      factory: function() { return require('fs'); }
    },
    {
      name: 'path',
      factory: function() { return require('path'); }
    }
  ],

  methods: [
    function handle(req, res) {
      if ( req.url !== this.urlPath ) return false;

      // Ensure that file exists.
      if ( ! this.fs.existsSync(this.filePath) ) {
        this.send404(req, res);
        this.reportWarnMsg(req, 'File not found: ' + this.filePath);
        return true;
      }

      // Ensure that file is not a directory.
      var stats = this.fs.statSync(this.filePath);
      if ( stats.isDirectory() ) {
        this.send404(req, res);
        this.reportWarnMsg(req, 'Attempt to read directory: ' + this.filePath);
        return true;
      }

      // Lookup mime type and set header accordingly.
      var ext = this.path.extname(this.filePath);
      var mimetype = this.mimeTypes[ext] || this.mimeTypes.__default;
      res.statusCode = 200;
      res.setHeader('Content-type', mimetype);

      this.fs.createReadStream(this.filePath).pipe(res);
      this.info('200 OK ' + this.urlPath + ' => ' + this.filePath);

      return true;
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.net.node',
  name: 'StaticFileHandler',
  extends: 'foam.net.node.Handler',

  documentation: `HTTP(S) server handler for an entire directory.

      All files in the directory will be served according to their relative
      path name.

      E.g.,

      /foo/bar
      /foo/bar/baz
      /foo/bar/baz/alpha.html
      /foo/bar/quz/beta.js
      /foo/bar/quz/charlie.xyz

     Suppose dir=/foo/bar and urlPath=/frobinator

     This exposes URLs (relative to the server's root):

     /frobinator/baz/alpha.html as an html document
     /frobinator/quz/beta.js as a client-runnable script
     /frobinator/quz/charlie.xyz as a document resource`,

  imports: [
    'log',
    'info'
  ],

  properties: [
    {
      class: 'String',
      name: 'dir',
      documentation: 'Directory under which to serve files.',
      preSet: function(old, nu) {
        return this.path.resolve(process.cwd(), nu);
      },
      factory: function() { return process.cwd(); }
    },
    {
      class: 'String',
      name: 'urlPath',
      documentation: 'URL path prefix. Stripped before searching "dir".'
    },
    {
      name: 'mimeTypes',
      factory: function() {
        return {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.html': 'text/html',
          __default: 'application/octet-stream'
        };
      }
    },
    {
      name: 'path',
      factory: function() { return require('path'); }
    },
    {
      name: 'fs',
      factory: function() { return require('fs'); }
    }
  ],

  methods: [
    function handle(req, res) {
      // Try to serve a static file.
      if ( ! this.dir ) return false;

      // Check the URL for the prefix.
      var target = req.url;
      if ( target.indexOf(this.urlPath) !== 0 ) return false;

      target = target.substring(this.urlPath.length);

      // Check and strip the prefix off the URL.
      if ( target.indexOf('?') >= 0 )
        target = target.substring(0, target.indexOf('?'));
      if ( target.indexOf('#') >= 0 )
        target = target.substring(0, target.indexOf('#'));

      this.log('Matched prefix, target file: ' + target);

      // String a leading slash, if any.
      if ( target[0] === '/' ) target = target.substring(1);

      target = this.path.resolve(this.dir, target);
      this.log('Target resolved to: ' + target);
      var rel = this.path.relative(this.dir, target);
      this.log('Relative path: ' + target);

      // The relative path can't start with .. or it's outside the dir.
      if ( rel.startsWith('..') ) {
        this.send404(req, res);
        this.reportWarnMsg(
          req, 'Attempt to read static file outside directory: ' + target);
        return true;
      }

      // Now we have a legal filename within our subdirectory.
      // We try to stream the file to the other end.
      if ( ! this.fs.existsSync(target) ) {
        this.send404(req, res);
        this.reportWarnMsg(req, 'File not found: ' + target);
        return true;
      }

      var stats = this.fs.statSync(target);
      if ( stats.isDirectory() ) {
        this.send404(req, res);
        this.reportWarnMsg(req, 'Attempt to read directory: ' + target);
        return true;
      }

      var ext = this.path.extname(target);
      var mimetype = this.mimeTypes[ext] || this.mimeTypes.__default;
      if ( mimetype === this.mimeTypes.__default ) {
        this.info('Unknown MIME type: ' + ext);
      }
      res.statusCode = 200;
      res.setHeader('Content-type', mimetype);

      // Open the file as a stream.
      var stream = this.fs.createReadStream(target);
      stream.pipe(res);
      this.info('200 OK ' + target);

      return true;
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.net.node',
  name: 'RestDAOHandler',
  extends: 'foam.net.node.Handler',

  requires: [ 'foam.json.Parser' ],

  imports: [
    'creationContext',
    'info'
  ],

  properties: [
    {
      class: 'String',
      name: 'urlPath',
      documentation: 'URL path prefix.',
      required: true
    },
    {
      class: 'foam.dao.DAOProperty',
      name: 'dao',
      transient: true,
      required: true
    },
    {
      name: 'url',
      factory: function() {  return require('url'); }
    },
    {
      class: 'FObjectProperty',
      of: 'foam.json.Parser',
      name: 'parser',
      factory: function() {
        // NOTE: Configuration must be consistent with outputters in
        // corresponding foam.dao.RestDAO.
        return this.Parser.create({
          strict: true,
          creationContext: this.creationContext
        });
      }
    }
  ],

  methods: [
    function handle(req, res) {
      // Check the URL for the prefix.
      var url = this.url.parse(req.url, true);
      var target = url.pathname;
      if ( target.indexOf(this.urlPath) !== 0 ) return false;

      // Look past prefix.
      target = target.substring(this.urlPath.length);
      // Any suffix should be "/"- or ":"-separated from prefix. Otherwise,
      // it's not really a match.
      var sep = target.charAt(0);
      if ( target.length > 0 && sep !== '/' && sep !== ':' ) return false;
      // Look past any separator. Store it for detecting find()/select() URLs.
      target = target.substring(1);

      var send400 = this.send400.bind(this, req, res);
      var send500 = this.send500.bind(this, req, res);
      var self = this;
      var id;
      var payload;
      var data;
      if ( req.method === 'PUT' ) {

        //
        // put()
        //

        // No suffix on put() requests.
        if ( target !== '' ) {
          self.send404(req, res);
          self.reportWarnMsg(req, 'Attempt to put() with path suffix');
          return true;
        }

        self.getPayload_(req).then(function(o) {
          return self.dao.put(o);
        }).then(function(o) {
          self.sendJSON(res, 200, self.fo2o_(o));
          self.info('200 OK: put() ' + o.id);
        }).catch(send500);
      } else if ( req.method === 'DELETE' ) {

        //
        // remove()
        //

        try {
          id = JSON.parse(decodeURIComponent(target));
        } catch (error) {
          send500(error);
          return true;
        }

        self.dao.find(id).then(function(o) {
          payload = self.fo2o_(o);
          return self.dao.remove(o);
        }).then(function() {
          self.sendJSON(res, 200, payload);
          self.info('200 OK: remove() ' + id);
        }).catch(send500);
      } else if ( req.method === 'GET' ) {
        if ( sep === '/' && target !== '' ) {
          // Extra fragment: "/<id>" => find().

          //
          // find()
          //

          try {
            id = JSON.parse(decodeURIComponent(target));
          } catch (err) {
            send500(err);
            return true;
          }

          self.dao.find(id).then(function(o) {
            self.sendJSON(res, 200, self.fo2o_(o));
            self.info('200 OK: find() ' + id);
          }).catch(send500);
        } else {
          self.send404(req, res);
          self.reportWarnMsg(
            req, 'Unrecognized DAO GET URL fragment: '  + sep + target);
        }
      } else if ( req.method === 'POST' ) {
        if ( sep === ':' && target === 'select' ) {
          // Extra fragment: ":select" => select().

          //
          // select()
          //

          self.getPayload_(req).then(function(data) {
            var sink = data.sink;
            var skip = data.skip;
            var limit = data.limit;
            var order = data.order;
            var predicate = data.predicate;
            self.dao.select_(self.dao.__context__, sink, skip, limit, order, predicate)
                .then(function(sink) {
                  // Prevent caching of select() responses.
                  var dateString = new Date().toUTCString();
                  res.setHeader('Expires', dateString);
                  res.setHeader('Last-Modified', dateString);
                  res.setHeader(
                      'Cache-Control',
                      'max-age=0, no-cache, must-revalidate, proxy-revalidate');

                  self.sendJSON(res, 200, self.fo2o_(sink));
                  self.info('200 OK: select()');
                }).catch(send500);
          });
        } else if ( sep === ':' && target === 'removeAll' ) {

          //
          // removeAll()
          //

          self.getPayload_(req).then(function(data) {
            var skip = data.skip;
            var limit = data.limit;
            var order = data.order;
            var predicate = data.predicate;
            return self.dao.removeAll_(self.dao.__context__, skip, limit, order, predicate);
          }).then(function() {
            self.sendJSON(res, 200, '{}');
            self.info('200 OK: removeAll()');
          }).catch(send500);
        } else {
          self.send404(req, res);
          self.reportWarnMsg(req, 'Unknown POST request: ' + target);
        }
      } else {
        self.send404(req, res);
        self.reportWarnMsg(req, 'Method not supported: '  + req.method);
      }

      return true;
    },
    {
      name: 'fo2o_',
      documentation: "Transform FOAM object to JSON.stringify'able object.",
      code: function(o) {
        return foam.json.Network.objectify(o);
      }
    },
    function getPayload_(req) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var payload = '';
        req.on('data', function (chunk) {
          payload += chunk.toString();
        });
        req.on('end', function () {
          try {
            resolve(self.parser.parseString(payload));
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.net.node',
  name: 'Server',

  documentation: `An modeled HTTP server implementation.

      The server stores an array of "handlers" for handling
      requests. Handlers are given the chance to handle requests in the order
      they appear in the array. The server starts listening on its "port"
      when start() is invoked. Listening ceases on shutdown().`,

  requires: [
    'foam.dao.ArrayDAO',
    'foam.net.node.FileHandler',
    'foam.net.node.RestDAOHandler',
    'foam.net.node.StaticFileHandler'
  ],

  imports: [
    'creationContext? as creationContextFromCtx',
    'info',
    'log'
  ],
  exports: [ 'creationContext' ],

  properties: [
    {
      class: 'FObjectArray',
      of: 'foam.net.node.Handler',
      name: 'handlers'
    },
    {
      type: 'Int',
      name: 'port',
      value: 8000
    },
    {
      name: 'creationContext',
      factory: function() {
        return this.creationContextFromCtx || this.__subContext__;
      }
    },
    {
      name: 'server',
      documentation: 'The Node JS HTTP Server object.',
      value: null
    },
    {
      name: 'http',
      factory: function() { return require('http'); }
    }
  ],

  methods: [
    function start() {
      if ( this.server ) return Promise.resolve(this.server);

      this.server = this.http.createServer(this.onRequest);

      var self = this;
      return new Promise(function(resolve, reject) {
        self.server.listen(self.port, function() {
        self.info(
          self.handlers.length + ' handlers listening on port ' + self.port);
          resolve(self.server);
        });
      });
    },

    function shutdown() {
      if ( ! this.server ) return Promise.resolve(null);

      var self = this;
      return new Promise(function(resolve, reject) {
        self.server.close(function() {
          self.server = null;
          resolve(null);
        });
      });
    },

    function addHandler(handler) {
      this.handlers.push(handler);
    },

    function exportDAO(dao, urlPath) {
      this.addHandler(this.RestDAOHandler.create({
        dao: dao,
        urlPath: urlPath
      }));

      this.log('Export DAO to ' + urlPath);
    },

    function exportFile(urlPath, filePath) {
      this.handlers.push(this.FileHandler.create({
        urlPath: urlPath,
        filePath: filePath
      }));

      this.log('Export File ' + filePath + ' to ' + urlPath);
    },

    function exportDirectory(urlPath, dir) {
      this.handlers.push(
        this.StaticFileHandler.create({
          dir: dir,
          urlPath: urlPath
        }));

      this.log('Export directory ' + dir + ' to ' + urlPath);
    }
  ],

  listeners: [
    function onRequest(req, res) {
      for ( var i = 0 ; i < this.handlers.length ; i++ ) {
        if ( this.handlers[i].handle(req, res) ) break;
      }
      if ( i === this.handlers.length ) {
        res.statusCode = 404;
        res.write('File not found: ' + req.url, 'utf8');
        res.end();
      }
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

(function() {
  // By decree of:
  // http://xahlee.info/js/html5_non-closing_tag.html
  var selfClosingNodeNames = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  // By decree of:
  // http://www.theukwebdesigncompany.com/articles/entity-escape-characters.php
  var unescapeMap = {
    '#100': 'd',
    '#101': 'e',
    '#102': 'f',
    '#103': 'g',
    '#104': 'h',
    '#105': 'i',
    '#106': 'j',
    '#107': 'k',
    '#108': 'l',
    '#109': 'm',
    '#110': 'n',
    '#111': 'o',
    '#112': 'p',
    '#113': 'q',
    '#114': 'r',
    '#115': 's',
    '#116': 't',
    '#117': 'u',
    '#118': 'v',
    '#119': 'w',
    '#120': 'x',
    '#121': 'y',
    '#122': 'z',
    '#123': '{',
    '#124': '|',
    '#125': '}',
    '#126': '~',
    '#160': ' ',
    '#161': '¡',
    '#162': '¢',
    '#163': '£',
    '#164': '¤',
    '#165': '¥',
    '#166': '¦',
    '#167': '§',
    '#168': '¨',
    '#169': '©',
    '#170': 'ª',
    '#171': '«',
    '#172': '¬',
    '#174': '®',
    '#175': '¯',
    '#176': '°',
    '#177': '±',
    '#178': '²',
    '#179': '³',
    '#180': '´',
    '#181': 'µ',
    '#182': '¶',
    '#183': '·',
    '#184': '¸',
    '#185': '¹',
    '#186': 'º',
    '#187': '»',
    '#188': '¼',
    '#189': '½',
    '#19': 'Å',
    '#190': '¾',
    '#191': '¿',
    '#192': 'À',
    '#193': 'Á',
    '#194': 'Â',
    '#195': 'Ã',
    '#196': 'Ä',
    '#198': 'Æ',
    '#199': 'Ç',
    '#200': 'È',
    '#201': 'É',
    '#202': 'Ê',
    '#203': 'Ë',
    '#204': 'Ì',
    '#205': 'Í',
    '#206': 'Î',
    '#207': 'Ï',
    '#208': 'Ð',
    '#209': 'Ñ',
    '#210': 'Ò',
    '#211': 'Ó',
    '#212': 'Ô',
    '#213': 'Õ',
    '#214': 'Ö',
    '#215': '×',
    '#216': 'Ø',
    '#217': 'Ù',
    '#218': 'Ú',
    '#219': 'Û',
    '#220': 'Ü',
    '#221': 'Ý',
    '#222': 'Þ',
    '#223': 'ß',
    '#224': 'à',
    '#225': 'á',
    '#226': 'â',
    '#227': 'ã',
    '#228': 'ä',
    '#229': 'å',
    '#23': 'í',
    '#230': 'æ',
    '#231': 'ç',
    '#232': 'è',
    '#233': 'é',
    '#234': 'ê',
    '#235': 'ë',
    '#236': 'ì',
    '#238': 'î',
    '#239': 'ï',
    '#240': 'ð',
    '#241': 'ñ',
    '#242': 'ò',
    '#243': 'ó',
    '#244': 'ô',
    '#245': 'õ',
    '#246': 'ö',
    '#247': '÷',
    '#248': 'ø',
    '#249': 'ù',
    '#250': 'ú',
    '#251': 'û',
    '#252': 'ü',
    '#253': 'ý',
    '#254': 'þ',
    '#255': 'ÿ',
    '#256': 'Ā',
    '#257': 'ā',
    '#258': 'Ă',
    '#259': 'ă',
    '#260': 'Ą',
    '#261': 'ą',
    '#262': 'Ć',
    '#263': 'ć',
    '#264': 'Ĉ',
    '#265': 'ĉ',
    '#266': 'Ċ',
    '#267': 'ċ',
    '#268': 'Č',
    '#269': 'č',
    '#27': 'ĕ',
    '#270': 'Ď',
    '#271': 'ď',
    '#272': 'Đ',
    '#273': 'đ',
    '#274': 'Ē',
    '#275': 'ē',
    '#276': 'Ĕ',
    '#278': 'Ė',
    '#279': 'ė',
    '#280': 'Ę',
    '#281': 'ę',
    '#282': 'Ě',
    '#283': 'ě',
    '#284': 'Ĝ',
    '#285': 'ĝ',
    '#286': 'Ğ',
    '#287': 'ğ',
    '#288': 'Ġ',
    '#289': 'ġ',
    '#290': 'Ģ',
    '#291': 'ģ',
    '#292': 'Ĥ',
    '#293': 'ĥ',
    '#294': 'Ħ',
    '#295': 'ħ',
    '#296': 'Ĩ',
    '#297': 'ĩ',
    '#298': 'Ī',
    '#299': 'ī',
    '#300': 'Ĭ',
    '#301': 'ĭ',
    '#302': 'Į',
    '#303': 'į',
    '#304': 'İ',
    '#305': 'ı',
    '#306': 'Ĳ',
    '#307': 'ĳ',
    '#308': 'Ĵ',
    '#309': 'ĵ',
    '#31': 'Ľ',
    '#310': 'Ķ',
    '#311': 'ķ',
    '#312': 'ĸ',
    '#313': 'Ĺ',
    '#314': 'ĺ',
    '#315': 'Ļ',
    '#316': 'ļ',
    '#318': 'ľ',
    '#319': 'Ŀ',
    '#32': ' ',
    '#320': 'ŀ',
    '#321': 'Ł',
    '#322': 'ł',
    '#323': 'Ń',
    '#324': 'ń',
    '#325': 'Ņ',
    '#326': 'ņ',
    '#327': 'Ň',
    '#328': 'ň',
    '#329': 'ŉ',
    '#33': '!',
    '#330': 'Ŋ',
    '#331': 'ŋ',
    '#332': 'Ō',
    '#333': 'ō',
    '#334': 'Ŏ',
    '#335': 'ŏ',
    '#336': 'Ő',
    '#337': 'ő',
    '#338': 'Œ',
    '#339': 'œ',
    '#34': '"',
    '#340': 'Ŕ',
    '#340': 'Ŕ',
    '#341': 'ŕ',
    '#341': 'ŕ',
    '#342': 'Ŗ',
    '#342': 'Ŗ',
    '#343': 'ŗ',
    '#343': 'ŗ',
    '#344': 'Ř',
    '#344': 'Ř',
    '#345': 'ř',
    '#345': 'ř',
    '#346': 'Ś',
    '#346': 'Ś',
    '#347': 'ś',
    '#347': 'ś',
    '#348': 'Ŝ',
    '#348': 'Ŝ',
    '#349': 'ŝ',
    '#349': 'ŝ',
    '#35': '#',
    '#35': 'ť',
    '#350': 'Ş',
    '#350': 'Ş',
    '#351': 'ş',
    '#351': 'ş',
    '#352': 'Š',
    '#352': 'Š',
    '#353': 'š',
    '#353': 'š',
    '#354': 'Ţ',
    '#354': 'Ţ',
    '#355': 'ţ',
    '#355': 'ţ',
    '#356': 'Ť',
    '#356': 'Ť',
    '#358': 'Ŧ',
    '#358': 'Ŧ',
    '#359': 'ŧ',
    '#359': 'ŧ',
    '#36': '$',
    '#360': 'Ũ',
    '#360': 'Ũ',
    '#361': 'ũ',
    '#361': 'ũ',
    '#362': 'Ū',
    '#362': 'Ū',
    '#363': 'ū',
    '#363': 'ū',
    '#364': 'Ŭ',
    '#364': 'Ŭ',
    '#365': 'ŭ',
    '#365': 'ŭ',
    '#366': 'Ů',
    '#366': 'Ů',
    '#367': 'ů',
    '#367': 'ů',
    '#368': 'Ű',
    '#368': 'Ű',
    '#369': 'ű',
    '#369': 'ű',
    '#37': '%',
    '#37': 'Ź',
    '#370': 'Ų',
    '#370': 'Ų',
    '#371': 'ų',
    '#371': 'ų',
    '#372': 'Ŵ',
    '#372': 'Ŵ',
    '#373': 'ŵ',
    '#373': 'ŵ',
    '#374': 'Ŷ',
    '#374': 'Ŷ',
    '#375': 'ŷ',
    '#375': 'ŷ',
    '#376': 'Ÿ',
    '#376': 'Ÿ',
    '#377': 'Ź',
    '#378': 'ź',
    '#378': 'ź',
    '#379': 'Ż',
    '#379': 'Ż',
    '#38': '&',
    '#380': 'ż',
    '#380': 'ż',
    '#381': 'Ž',
    '#381': 'Ž',
    '#382': 'ž',
    '#382': 'ž',
    '#383': 'ſ',
    '#383': 'ſ',
    '#39': '\'',
    '#40': '(',
    '#41': ')',
    '#42': '*',
    '#43': '+',
    '#44': ',',
    '#45': '-',
    '#46': '.',
    '#47': '/',
    '#48': '0',
    '#49': '1',
    '#50': '2',
    '#51': '3',
    '#52': '4',
    '#53': '5',
    '#54': '6',
    '#55': '7',
    '#56': '8',
    '#57': '9',
    '#577': 'ť',
    '#58': ':',
    '#59': ';',
    '#60': '<',
    '#61': '=',
    '#62': '>',
    '#63': '?',
    '#64': '@',
    '#65': 'A',
    '#66': 'B',
    '#67': 'C',
    '#68': 'D',
    '#69': 'E',
    '#70': 'F',
    '#71': 'G',
    '#72': 'H',
    '#73': 'I',
    '#74': 'J',
    '#75': 'K',
    '#76': 'L',
    '#77': 'M',
    '#78': 'N',
    '#79': 'O',
    '#80': 'P',
    '#81': 'Q',
    '#82': 'R',
    '#83': 'S',
    '#84': 'T',
    '#8482': '™',
    '#85': 'U',
    '#86': 'V',
    '#87': 'W',
    '#88': 'X',
    '#89': 'Y',
    '#90': 'Z',
    '#91': '[',
    '#92': '\\',
    '#93': ']',
    '#94': '^',
    '#95': '_',
    '#96': '`',
    '#97': 'a',
    '#98': 'b',
    '#99': 'c',
    '&#173;': '',
    'AElig': 'Æ',
    'Aacute': 'Á',
    'Acirc': 'Â',
    'Agrave': 'À',
    'Aring': 'Å',
    'Atilde': 'Ã',
    'Auml': 'Ä',
    'Ccedil': 'Ç',
    'ETH': 'Ð',
    'Eacute': 'É',
    'Ecirc': 'Ê',
    'Egrave': 'È',
    'Euml': 'Ë',
    'Iacute': 'Í',
    'Icirc': 'Î',
    'Igrave': 'Ì',
    'Iuml': 'Ï',
    'Ntilde': 'Ñ',
    'Oacute': 'Ó',
    'Ocirc': 'Ô',
    'Ograve': 'Ò',
    'Oslash': 'Ø',
    'Otilde': 'Õ',
    'Ouml': 'Ö',
    'THORN': 'Þ',
    'Uacute': 'Ú',
    'Ucirc': 'Û',
    'Ugrave': 'Ù',
    'Uuml': 'Ü',
    'Yacute': 'Ý',
    'aacute': 'á',
    'acirc': 'â',
    'acute': '´',
    'aelig': 'æ',
    'agrave': 'à',
    'amp': '&',
    'aring': 'å',
    'atilde': 'ã',
    'auml': 'ä',
    'brvbar': '¦',
    'ccedil': 'ç',
    'cedil': '¸',
    'cent': '¢',
    'copy': '©',
    'curren': '¤',
    'deg': '°',
    'divide': '÷',
    'eacute': 'é',
    'ecirc': 'ê',
    'egrave': 'è',
    'eth': 'ð',
    'euml': 'ë',
    'euro': '€',
    'frac12': '½',
    'frac14': '¼',
    'frac34': '¾',
    'gt': '>',
    'iacute': 'í',
    'icirc': 'î',
    'iexcl': '¡',
    'igrave': 'ì',
    'iquest': '¿',
    'iuml': 'ï',
    'lt': '<',
    'macr': '¯',
    'micro': 'µ',
    'middot': '·',
    'nbsp': ' ',
    'nbsp': '',
    'not': '¬',
    'ntilde': 'ñ',
    'oacute': 'ó',
    'ocirc': 'ô',
    'ograve': 'ò',
    'ordf': 'ª',
    'ordm': 'º',
    'oslash': 'ø',
    'otilde': 'õ',
    'ouml': 'ö',
    'para': '¶',
    'plusmn': '±',
    'pound': '£',
    'quot': '"',
    'raquo': '»',
    'reg': '®',
    'sect': '§',
    'shy': '',
    'sup1': '¹',
    'sup2': '²',
    'sup3': '³',
    'szlig': 'ß',
    'thorn': 'þ',
    'times': '×',
    'uacute': 'ú',
    'ucirc': 'û',
    'ugrave': 'ù',
    'uml': '¨',
    'uuml': 'ü',
    'yacute': 'ý',
    'yen': '¥',
  };
  var escapeMap = {};
  for ( var key in unescapeMap ) {
    if ( unescapeMap.hasOwnProperty(key) ) escapeMap[unescapeMap[key]] = key;
  }

  // FUTURE: Lazily instantiate RegExp to save memory.
  var unescapeKeys = Object.keys(unescapeMap).map(function(key) {
    return `&${key};`;
  });
  var escapeSequenceRegExp = RegExp(`(?=(${unescapeKeys.join('|')}))\\1`, 'g');
  var escapeKeys = Object.keys(escapeMap).map(function(escapeChar) {
    return `[${escapeChar}]`;
  });
  var escapableCharRegExp = RegExp(`(?=(${escapeKeys.join('|')}))\\1`, 'g');

  foam.LIB({
    name: 'foam.parsers.html',

    methods: [
      function getHtmlEscapeChar(id) {
        if ( ! unescapeMap.hasOwnProperty(id) ) return '';
        return unescapeMap[id];
      },
      function getHtmlEscapeSequence(c) {
        if ( ! escapeMap.hasOwnProperty(c) ) return '';
        return escapeMap[c];
      },
      function isSelfClosing(nodeName) {
        return selfClosingNodeNames[nodeName];
      },
      function unescapeString(str) {
        if ( ! foam.String.isInstance(str) ) return '';

        return str.replace(escapeSequenceRegExp, function(m) {
          // m is in the form of &id; We drop first and last character.
          var id = m.slice(1, -1);
          return unescapeMap[id];
        });
      },
      function escapeString(str) {
        if ( ! foam.String.isInstance(str) ) return '';

        return str.replace(escapableCharRegExp, function(id) {
          return `&${escapeMap[id]};`;
        });
      }
    ]
  });
})();
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.parsers.html',
  name: 'Attribute',

  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'String',
      name: 'value'
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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

foam.ENUM({
  package: 'foam.parsers.html',
  name: 'TagType',

  values: [
    { name: 'OPEN',       label: 'Open' },
    { name: 'CLOSE',      label: 'Close' },
    { name: 'OPEN_CLOSE', label: 'Open & Close' }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.parsers.html',
  name: 'Tag',

  properties: [
    {
      class: 'Enum',
      of: 'foam.parsers.html.TagType',
      name: 'type',
      factory: function() { return foam.parser.html.TagType.OPEN; }
    },
    {
      class: 'String',
      name: 'nodeName',
      value: 'div'
    },
    {
      class: 'FObjectArray',
      of: 'foam.parsers.html.Attribute',
      name: 'attributes',
    }
  ]
});
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
  package: 'foam.parsers.html',
  name: 'HTMLLexer',

  documentation: `Parse an HTML string into a flat sequence of tags and
      strings.`,

  requires: [
    'foam.parse.ImperativeGrammar',
    'foam.parse.Parsers',
    'foam.parse.StringPS',
    'foam.parsers.html.Attribute',
    'foam.parsers.html.Tag',
    'foam.parsers.html.TagType'
  ],

  axioms: [
    foam.pattern.Singleton.create()
  ],

  properties: [
    {
      name: 'lib',
      factory: function() { return foam.parsers.html; }
    },
    {
      name: 'symbolsFactory',
      value: function(
          seq1, sym, seq, repeat, alt, optional, str, plus, notChars, repeat0,
          not, anyChar, range, literalIC) {

        return {
          START: seq1(1, optional(sym('header')), sym('html')),

          html: repeat(sym('htmlPart')),

          htmlPart: alt(
              sym('cdata'),
              sym('comment'),
              sym('closeTag'),
              sym('openTag'),
              sym('text')),

          openTag: seq(
              '<',
              sym('tagName'),
              sym('whitespace'),
              sym('attributes'),
              sym('whitespace'),
              optional('/'),
              '>'),

          closeTag: seq1(1,
                       '</',
                       sym('tagName'),
                       sym('whitespace'),
                       '>'),

          header: seq(
            sym('whitespace'),
            optional(sym('langTag')),
            sym('whitespace'),
            optional(sym('doctype')),
            sym('whitespace')),

          langTag: seq('<?', repeat0(notChars('?')), '?>'),

          doctype: seq('<!', literalIC('DOCTYPE'), sym('whitespace'),
                       repeat0(sym('doctypePart')), '>'),

          doctypePart: alt(plus(notChars('[>', anyChar())),
                           seq('[', repeat0(notChars(']', anyChar())), ']')),

          cdata: seq1(1,
                      '<![CDATA[', str(repeat(not(']]>', anyChar()))), ']]>'),

          comment: seq('<!--', repeat0(not('-->', anyChar())), '-->'),

          attributes: repeat(sym('attribute'), sym('whitespace')),

          label: str(plus(notChars(' =/\t\r\n<>'))),

          tagName: sym('label'),

          text: str(plus(not(alt(sym('closeTag'), sym('openTag')),
                  anyChar()))),

          attribute: seq(sym('label'), optional(
              seq1(3, sym('whitespace'), '=', sym('whitespace'),
                   sym('value')))),

          value: str(alt(
              plus(notChars('\'" \t\r\n<>')),
              seq1(1, '"', repeat(notChars('"', anyChar())), '"'),
              seq1(1, "'", repeat(notChars("'", anyChar())), "'"))),

          whitespace: repeat0(alt(' ', '\t', '\r', '\n'))
        };
      }
    },
    {
      name: 'symbols',
      factory: function() {
        return foam.Function.withArgs(
          this.symbolsFactory,
          this.Parsers.create(),
          this
        );
      }
    },
    {
      name: 'actions',
      factory: function() {
        var self  = this;
        var lib   = self.lib;
        var Tag   = self.Tag;
        var Attribute = self.Attribute;
        var OPEN  = self.TagType.OPEN;
        var CLOSE = self.TagType.CLOSE;
        var OPEN_CLOSE = self.TagType.OPEN_CLOSE;

        return {
          openTag: function(v) {
            return Tag.create({
              type: v[5] || lib.isSelfClosing(v[1]) ? OPEN_CLOSE : OPEN,
              nodeName: v[1],
              attributes: v[3],
            });
          },

          closeTag: function(v) {
            return Tag.create({ type: CLOSE, nodeName: v });
          },

          // TODO(markdittmer): Do something with these values.
          header: function(v) { return null; },
          langTag: function(v) { return null; },
          doctype: function(v) { return null; },
          doctypePart: function(v) { return null; },
          cdata: function(v) { return null; },
          comment: function(v) { return null; },
          attribute: function(v) {
            return Attribute.create({ name: v[0], value: v[1] || null });
          },
        };
      }
    },
    {
      name: 'grammar',
      factory: function() {
        var grammar = this.ImperativeGrammar.create({symbols: this.symbols});
        grammar.addActions(this.actions);
        return grammar;
      }
    },
    {
      name: 'ps',
      factory: function() {
        return this.StringPS.create();
      }
    }
  ],

  methods: [
    function parseString(str, opt_name) {
      opt_name = opt_name || 'START';

      this.ps.setString(str);
      var start = this.grammar.getSymbol(opt_name);
      foam.assert(start, 'No symbol found for', opt_name);

      return start.parse(this.ps, this.grammar);
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.dao.history',
  name: 'PropertyUpdate',
  documentation: `Model containing the name of the property
    being updated, the old value, and the new value`,
  properties: [
    {
      class: 'String',
      name: 'name'
    },
    {
      class: 'Object',
      name: 'oldValue'
    },
    {
      class: 'Object',
      name: 'newValue'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.dao.history',
  name: 'HistoryRecord',

  documentation: 'Contains an array of property updates',
  ids: [ 'objectId', 'seqNo' ],
  
  properties: [
    {
      class: 'Long',
      name: 'seqNo'
    },
    {
      class: 'Object',
      name: 'objectId'
    },
    {
      class: 'String',
      name: 'user'
    },
    {
      class: 'DateTime',
      name: 'timestamp'
    },
    {
      class: 'FObjectArray',
      of: 'foam.dao.history.PropertyUpdate',
      name: 'updates'
    }
  ]
});
/**
 * @license
 * Copyright 2017 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.INTERFACE({
  package: 'foam.mop',
  name: 'MOP',

  documentation: 'MOP Interface',

  methods: [
    {
      name: 'get',
      returns: 'Promise',
      args: [ 'x' ]
    },
    {
      name: 'setProperty',
      returns: 'Promise',
      args: [ 'x', 'name', 'value' ]
    },
    {
      name: 'setProperties',
      returns: 'Promise',
      args: [ 'x', 'values' ]
    }
  ]
});
