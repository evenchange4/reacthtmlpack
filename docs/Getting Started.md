## Getting Started

The simplest example is [SimpleScript](https://github.com/tomchentw/reacthtmlpack/tree/master/examples/SimpleScript). It takes **4** steps to build them up.


### 1 - Generate HTML Template with React

Create an [`index.html.js`](https://github.com/tomchentw/reacthtmlpack/blob/master/examples/SimpleScript/scripts/index.html.js) file that exports your html template as react elements.

```js
export default (
  <html>
    <head>
    // omitted ...
    </body>
  </html>
);
```

#### Notice

* This file will be `require`d and evaluated in **node** context. Be sure to only use components that don't contain browser stuff.
* The default export is a *instance* of `ReactElement`. Exporting the *class* of `React.Component` (or `React.createClass`) is **NOT** supported.
* You have to import `React` in your code since JSX transformer in babel will need it present in the local scope.


### 2 - Put <WebpackScriptEntry> Component(s) in the Template

Inside the `<body>` of [`index.html.js`](https://github.com/tomchentw/reacthtmlpack/blob/master/examples/SimpleScript/scripts/index.html.js), add `<WebpackScriptEntry>`.

```js
    // omitted ...
    <WebpackScriptEntry
      chunkName="assets/client"
      chunkFilepath="./scripts/client.js"
      configFilepath="../SimpleScript.webpackConfig.js"
    />
    </body>
  </html>
);
```

The `WebpackScriptEntry` specified your webpack entry point for the application. It will be replaced to `<script>` after webpack compiles. There are three required props: `chunkName`, `chunkFilepath` and `configFilepath`:

#### `(string) chunkName`

The **key** part of [`entry` object property in the webpack config file](http://webpack.github.io/docs/configuration.html#entry).

#### `(string/array<string>) chunkFilepath`

The **value** part of [`entry` object property in the webpack config file](http://webpack.github.io/docs/configuration.html#entry).

#### `(string) configFilepath`

The **relative filepath** from this template to your webpack config file. The webpack config will be responsible for generating the entry.

#### Notice

* Unlike webpack config, `chunkName` is always required for explicity.
* The filepath in `chunkFilepath` should be relative to your [webpack context](http://webpack.github.io/docs/configuration.html#context). To reduce debugging time, you should set the `context` property in the webpack config file.


### 3 - Setting up Webpack Config File

Create [the webpack config file](https://github.com/tomchentw/reacthtmlpack/blob/master/examples/SimpleScript/SimpleScript.webpackConfig.js). Please don't include `entry` property in the config since we already specify it using `<WebpackScriptEntry>`. If you do, they will be replaced by *reacthtmlpack* and thus has **NO** effect.

```js
module.exports = {
  context: __dirname,
  output: {
    path: Path.resolve(__dirname, "../../public"),
    filename: "[name].js",
  },
  module: {
    loaders: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        loaders: ["babel"],
      },
    ],
  },
  // ... omitted
};
```

#### Notice

* To reduce debugging time, you should set [the `context` property in the webpack config file](http://webpack.github.io/docs/configuration.html#context).


### 4 - Build up the Assets

```sh
cd examples/SimpleScript
npm install
npm run dev # reacthtmlpack buildToDir ../../public ./scripts/*.html.js
```
