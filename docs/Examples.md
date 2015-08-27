## Examples

The examples list below is sorted from simple to complex.

### SimpleScript

https://github.com/tomchentw/reacthtmlpack/tree/master/examples/SimpleScript

* One script entry
* Zero style entry
* Zero require("*.css") in JavaScript
* One webpack config
* Smallest webpack.config.js
* One "scripts" command in package.json
  - `npm run dev` # Build your assets in development mode and output to public folder

**Notice** You could use `cd public && python -m SimpleHTTPServer 8080` to start a simple http server to serve compiled `index.html` and `assets/client.js`.

### SimpleStyle

https://github.com/tomchentw/reacthtmlpack/tree/master/examples/SimpleStyle

* One script entry
* Multiple style entry
* Zero require("*.css") in JavaScript
* One webpack config
* Smallest webpack.config.js with style support
* Two "scripts" command in package.json
  - `npm run dev`
  - `npm run watch` # Watch and build your assets in development mode and output to public folder

### SimpleAssets

https://github.com/tomchentw/reacthtmlpack/tree/master/examples/SimpleAssets

* One script entry
* One style entry (via require("*.css"))
* One require("*.css") in JavaScript
* One webpack config
* Medium sized webpack.config.js
  - NODE_ENV=production/development
* Three "scripts" command in package.json
  - `npm run dev`
  - `npm run watch`
  - `npm run build` # Build your assets in production mode and output to public folder

### AssetsWithDevServer

https://github.com/tomchentw/reacthtmlpack/tree/master/examples/AssetsWithDevServer

* One script entry
* One style entry (via require("*.css"))
* One require("*.css") in JavaScript
* One webpack config
* Large sized webpack.config.js
  - style support
  - NODE_ENV=production/development
  - react-hot-loader
  - filename with `[chunkhash]`
  - devServer
* Three "scripts" command in package.json
  - `npm run dev`
  - `npm run build`
  - `npm start` # Start webpack-dev-server with HMR support and use public folder to serve `index.html`

### gh-pages

https://github.com/tomchentw/reacthtmlpack/tree/master/examples/gh-pages

* One script entry
* One style entry (via require("*.css"))
* One require("*.css") in JavaScript
* Two webpack config
  - One for normal client-side assets bundling
  - The other compiles stuff for server-rendering
* **Server-rendering**
* Large sized webpack.config.js
  - style support
  - NODE_ENV=production/development
  - react-hot-loader
  - filename with `[chunkhash]`
  - devServer
  - Bundling for server-render support
* Three "scripts" command in package.json
  - `npm run dev`
  - `npm run build`
  - `npm start`

Why server-render bundling? This worth another blog post...(TBC)
