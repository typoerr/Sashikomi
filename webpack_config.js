var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    background: "./ext/src/bg/index.js",
    inject: "./ext/src/inject/index.js"
  },
  output: {
    path: "./ext/src/dist",
    filename: "[name].bundle.js"
  },

  resolve: {
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new WebpackNotifierPlugin({title: 'Webpack'})
  ]
};