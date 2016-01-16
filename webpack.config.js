var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    background: "./ext/src/bg/index.js",
    inject: "./ext/src/inject/index.js"
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
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new WebpackNotifierPlugin({title: 'Webpack'})
  ]
};