const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'postcss-loader',
      ]
    }, {
      test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
      use: ['url-loader']
    }]
  },
  mode: "production",
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      favicon: 'assets/favicon.ico'
    }),
    new HtmlWebpackPlugin({
      filename: 'privacy.html',
      template: 'src/privacy.html'
    }),
    new HtmlWebpackPlugin({
      filename: 'documentation.html',
      template: 'src/documentation.html'
    }),
    new MiniCssExtractPlugin({
      filename: "main.css"
    }),
    new CopyWebpackPlugin([
      { from: 'assets' }
    ]),
    new WorkboxPlugin.InjectManifest({
      importWorkboxFrom: 'local',
      swSrc: './src/sw.js',
      swDest: 'sw.js'
    })
  ]
};
