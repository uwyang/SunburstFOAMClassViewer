

var flags = {'web':true,'debug':true,'js':true};
var files = '../tools/files.js';
var src = '../src/main/js/';
var bin;
var verbose = false;

function usage(message) {
    console.error(message);
    throw new Error('usage: '+process.argv[1].split('/').pop()+' flags=web,debug,js|java[,_only_] files=../tools/files.js src=../src/main/js/ bin=../build/foo-bin.js [verbose]');
}

process.argv.map(function(arg) {
    var parts = arg.split('=');
    if (parts && parts.length > 1) {
        var cmd = parts[0];
        var args = parts[1];
        switch(cmd) {
        case 'flags':
            flags = {};
            args.split(',').forEach(function(flag)  {
                flags[flag] = true;
            });
            break;
        case 'files':
            files = args;
            break;
        case 'src':
            src = args;
            break;
        case 'bin':
            bin = args;
            break;
        default:
            usage('unsupported cmd=args: '+cmd+'='+args);
        }
    } else if (parts && parts == 'verbose') {
        verbose = true;
    }
});

if (! bin) {
    usage('bin required');
}

if (verbose) {
    console.log('\n');
    console.log('flags=',flags);
    console.log('files=',files);
    console.log('src=',src);
    console.log('bin=',bin);
}

var filterFiles = function(files, payload) {
    payload = payload?payload:" ";
    files.filter(function(f) {
        var match = f.flags && f.flags.filter(function(flag) {
            //console.log('flag',flag);
            return flags[flag] || false;
        }).length > 0;
        if (match) {
            return match;
        } else if (flags['_only_']) {
            return false;
        } else {
            return ! f.flags;
        }
    }).map(function(f) {
        if (verbose) console.log('include', f);
        return f.name;
    }).forEach(function(f) {
        var data = require('fs').readFileSync(__dirname + '/'+ src + f + '.js').toString();
        payload += data;
    });
    return payload;
};

var env = {
    FOAM_FILES: function(files) {
        require('fs').writeFileSync(bin, filterFiles(files));
    }
};

var data = require('fs').readFileSync(__dirname + '/' + files);

with (env) {
    eval(data.toString());
}
