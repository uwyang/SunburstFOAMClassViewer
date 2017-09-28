var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: "./src/main/js/entry.js",
    output: {
        path: __dirname,
        filename: './public/bundle.js'
    },

    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    externals: {
        fs: '{}',
        tls: '{}',
        net: '{}',
        dgram: '{}',
        dns: '{}',
      },

      devtool: 'source-map',

};
