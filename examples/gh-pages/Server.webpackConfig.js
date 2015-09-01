import {
  resolve as resolvePath,
} from "path";

import {
  default as webpack,
} from "webpack";

let PRODUCTION_PLUGINS;

if ("production" === process.env.NODE_ENV) {
  PRODUCTION_PLUGINS = [
    // Safe effect as webpack -p
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
  ];
} else {
  PRODUCTION_PLUGINS = [];
}

const externals = [
  require("./package.json").dependencies,
  require("../../package.json").dependencies,
].reduce((acc, dependencies) => {
  return acc.concat(
    Object.keys(dependencies)
      .map(key => new RegExp(`^${ key }(/\\S+)?$`)
  );
}, []);

export default {
  context: __dirname,
  output: {
    path: resolvePath(__dirname, "../../public/assets"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  target: "node",
  externals: externals,
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: "null",
      },
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        loader: "babel",
      },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin("NODE_ENV"),
    ...PRODUCTION_PLUGINS,
  ],
};
