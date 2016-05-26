const webpack = require('webpack');
var WebpackNotifierPlugin = require('webpack-notifier');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const basePath = path.join(__dirname, 'src');

const common = {
  context: basePath,
  entry: {
    background: './bg/index.js',
    inject: "./inject/js/index.js",
  },
  output: {
    path: "./ext/dist",
    filename: "[name].bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react'],
        },
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader"),
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader"),
      },
      {
        test: /\.md$/,
        loader: "raw",
      },
      {
        test: /\.json/,
        loader: 'json-loader',
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css', '.scss'],
  },
  plugins: [
    new WebpackNotifierPlugin({ title: 'Webpack' }),
    new ExtractTextPlugin("inject.bundle.css"),
  ],
};

const dev = {
  devtool: 'inline-source-map',
};

const prod = {
  resolve: {
    alias: {
      react: 'react-lite',
      'react-dom': 'react-lite',
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),

    // ライブラリ間で依存しているモジュールが重複している場合、二重に読み込まないようにする
    new webpack.optimize.DedupePlugin(),
    // ファイルを細かく分析し、まとめられるところはできるだけまとめてコードを圧縮する
    new webpack.optimize.AggressiveMergingPlugin(),
  ],
};


module.exports = (() => {
  const TARGET = process.env.npm_lifecycle_event;
  let conf = common;
  if (TARGET === 'prod') {
    conf = Object.assign(common, prod);
  } else {
    conf = Object.assign(common, dev);
  }

  return conf;
})();
