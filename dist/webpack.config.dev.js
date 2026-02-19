"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var webpack = require('webpack'),
    path = require('path'),
    fileSystem = require('fs-extra'),
    env = require('./utils/env'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    TerserPlugin = require('terser-webpack-plugin');

var _require = require('clean-webpack-plugin'),
    CleanWebpackPlugin = _require.CleanWebpackPlugin;

var ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

var ReactRefreshTypeScript = require('react-refresh-typescript')["default"];

var ASSET_PATH = process.env.ASSET_PATH || '/';
var alias = {}; // load the secrets

var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');
var fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var isDevelopment = process.env.NODE_ENV !== 'production';
var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    app: path.join(__dirname, 'src', 'pages', 'App', 'index.tsx'),
    newtab: path.join(__dirname, 'src', 'pages', 'Newtab', 'index.jsx'),
    options: path.join(__dirname, 'src', 'pages', 'Options', 'index.tsx'),
    popup: path.join(__dirname, 'src', 'pages', 'Popup', 'index.tsx'),
    background: path.join(__dirname, 'src', 'pages', 'Background', 'index.ts'),
    contentScript: path.join(__dirname, 'src', 'pages', 'Content', 'index.ts'),
    devtools: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.ts'),
    panel: path.join(__dirname, 'src', 'pages', 'Panel', 'index.tsx'),
    injected: path.join(__dirname, 'src', 'pages', 'Injected', 'index.tsx'),
    openDfpConsole: path.join(__dirname, 'src', 'pages', 'Injected', 'openDfpConsole.ts')
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background', 'contentScript', 'devtools']
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH
  },
  module: {
    rules: [// {
    //   test: /\.(css|scss)$/,
    //   use: [
    //     'style-loader',
    //     'css-loader',
    //     {
    //       loader: 'sass-loader',
    //       options: {
    //         implementation: require('sass'),
    //         sourceMap: true,
    //       },
    //     },
    //   ],
    // },
    {
      test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
      type: 'asset/resource',
      exclude: /node_modules/ // loader: 'file-loader',
      // options: {
      //   name: '[name].[ext]',
      // },

    }, {
      test: /\.html$/,
      loader: 'html-loader',
      exclude: /node_modules/
    }, {
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [{
        loader: require.resolve('ts-loader'),
        options: {
          getCustomTransformers: function getCustomTransformers() {
            return {
              before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean)
            };
          },
          transpileOnly: isDevelopment
        }
      }]
    }, {
      test: /\.(js|jsx)$/,
      use: [{
        loader: 'source-map-loader'
      }, {
        loader: require.resolve('babel-loader'),
        options: {
          plugins: [isDevelopment && require.resolve('react-refresh/babel')].filter(Boolean)
        }
      }],
      exclude: /node_modules/
    }]
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions.map(function (extension) {
      return '.' + extension;
    }).concat(['.js', '.jsx', '.ts', '.tsx', '.css'])
  },
  plugins: [isDevelopment && new ReactRefreshWebpackPlugin(), new CleanWebpackPlugin({
    verbose: true
  }), new webpack.ProgressPlugin(), // expose and write the allowed env consts on the compiled bundle
  new webpack.EnvironmentPlugin(['NODE_ENV']), new CopyWebpackPlugin({
    patterns: [{
      from: 'src/manifest.json',
      // to: path.join(__dirname, 'build'),
      to: 'manifest.json',
      force: true,
      transform: function transform(content, path) {
        var manifest = JSON.parse(content.toString());
        return Buffer.from(JSON.stringify(_objectSpread({}, manifest, {
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          action: _objectSpread({}, manifest.action, {
            default_icon: 'assets/img/icon-34.png'
          }),
          icons: _objectSpread({}, manifest.icons, {
            128: 'assets/img/icon-128.png'
          })
        }), null, 2));
      }
    }, {
      from: 'src/assets/img/icon-128.png',
      to: 'assets/img/icon-128.png',
      force: true,
      noErrorOnMissing: false
    }, {
      from: 'src/assets/img/icon-34.png',
      to: 'assets/img/icon-34.png',
      force: true,
      noErrorOnMissing: false
    }]
  }), new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'pages', 'Newtab', 'index.html'),
    filename: 'newtab.html',
    chunks: ['newtab'],
    cache: false
  }), new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'pages', 'Options', 'index.html'),
    filename: 'options.html',
    chunks: ['options'],
    cache: false
  }), new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'pages', 'Popup', 'index.html'),
    filename: 'popup.html',
    chunks: ['popup'],
    cache: false
  }), new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.html'),
    filename: 'devtools.html',
    chunks: ['devtools'],
    cache: false
  }), new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'pages', 'Panel', 'index.html'),
    filename: 'panel.html',
    chunks: ['panel'],
    cache: false
  })].filter(Boolean),
  infrastructureLogging: {
    level: 'info'
  }
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [new TerserPlugin({
      extractComments: false
    })]
  };
}

module.exports = options;