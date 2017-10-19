const path = require("path");
const Webpack = require("webpack");

module.exports = {
  entry: `${__dirname}/src/js/main.js`,
  output: {
    path: `${__dirname}/dist/scripts`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        query: {
          presets: ["env"]
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new Webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false }
    })
  ]
};
