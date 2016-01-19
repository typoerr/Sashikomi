var WebpackNotifierPlugin = require('webpack-notifier');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    background: "./src/bg/index.js",
    inject: "./src/inject/js/index.js"
  },
  output: {
    path: "./ext/dist",
    filename: "[name].bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader?minimize")
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader?minimize!sass-loader")
      },
      {
        test: /\.md$/,
        loader: "raw"
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css', '.scss'],
    alias: {
      'react': 'react-lite',
      'react-dom': 'react-lite'
    }
  },
  plugins: [
    new WebpackNotifierPlugin({ title: 'Webpack' }),
    new ExtractTextPlugin("inject.bundle.css")
  ]
};