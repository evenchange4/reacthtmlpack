import {
  dirname as toDirname,
  resolve as resolvePath,
} from "path";

import {
  default as Rx,
  Subject,
  Observable,
} from "rx";

import {
  default as R,
} from "ramda";

// http://ramdajs.com/docs/#map
const RxSelectMany = R.curry((f, obs) =>
  obs.selectMany(f)
);

const RxGroupBy = R.curry((g, obs) =>
  obs.groupBy(g)
);


import {
  comp,
  map,
  filter,
  identity,
} from "transducers-js";

Rx.config.longStackSupport = true;

// Note babel-core/index.js is NOT a ES6 module
const babel = require("babel-core");

import {
  default as evaluateAsModule,
} from "eval-as-module";

import {
  default as React,
  Children,
} from "react";

import {
  default as webpack,
} from "webpack";

import {
  default as entryPropTypeKeyList,
} from "./entry/entryPropTypeKeyList";

const transformFile = Observable.fromNodeCallback(babel.transformFile);

/**
 * @public
 */
export const filepath$ToBabelResult$ = RxSelectMany(filepath => {
  return R.map(({code}) => ({filepath, code}), transformFile(filepath));
});

/**
 * @public
 */
export const babelResult$ToReactElement$ = R.map(fromBabelCodeToReactElement);

/**
 * @public
 */
export const reactElement$ToChunkList$ = RxSelectMany(extractWebpackConfigFilepathList);

/**
 * @public
 */
export function chunkList$ToWebpackConfig$ (chunkList$) {
  // return R.pipe(...[
  //   RxGroupBy(it => it.webpackConfigFilepath),
  //   RxSelectMany(groupedObsToWebpackConfig),
  // ], chunkList$);
  return chunkList$
    .groupBy(it => it.webpackConfigFilepath)
    .selectMany(groupedObsToWebpackConfig);
}

/**
 * @package
 */
export const xfFilepath$ToWebpackConfig$ = comp(...[
  map(filepath$ToBabelResult$),
  map(babelResult$ToReactElement$),
  map(reactElement$ToChunkList$),
  map(chunkList$ToWebpackConfig$),
]);

/**
 * @package
 */
export function webpackConfig$ToWebpackCompiler$ (webpackConfig$) {
  return webpackConfig$
    .reduce((acc, {webpackConfig}) => {
      // Your Client config should always be first
      if (webpackConfig.reacthtmlpackDevServer) {
        return [webpackConfig].concat(acc);
      } else {
        return acc.concat(webpackConfig);
      }
    }, [])
    .first()
    .tap(webpackConfig => {
      const notMultipleConfig = 2 > webpackConfig.length;
      if (notMultipleConfig) {
        return;
      }
      const [{reacthtmlpackDevServer, output: {path: outputPath}}] = webpackConfig;
      const notInDevServerMode = !reacthtmlpackDevServer;
      if (notInDevServerMode) {
        return;
      }
      // In devServer command, you have to keep all output.path the same.
      const theyDontHaveTheSameOutputPath = webpackConfig.some(it => it.output.path !== outputPath);
      if (theyDontHaveTheSameOutputPath) {
        const message = `Some of your output.path is different than others in 
all of your webpack config files. This may cause unexpected behaviour when 
using them with webpack-dev-server. The base path serving your assets may 
change according to these commits:
0. https://github.com/webpack/webpack-dev-server/blob/f6b3bcb4a349540176bacc86df0df8e4109d0e3f/lib/Server.js#L53
1. https://github.com/webpack/webpack-dev-middleware/blob/42e5778f44939cd45fedd36d7b201b3eeb357630/middleware.js#L140
2. https://github.com/webpack/webpack/blob/8ff6cb5fedfc487665bb5dd8ecedf5d4ea306b51/lib/MultiCompiler.js#L51-L63
request goes from webpack-dev-server (0.) > webpack-dev-middleware (1.) > webpack/MultiCompiler (2.)`

        console.warn(message);
      }
    })
    // The webpackCompiler should be an instance of MultiCompiler
    .map(webpackConfig => webpack(webpackConfig));
}

/**
 * @package
 */
export function webpackCompiler$ToWebpackStats$ (webpackCompiler$) {
  return webpackCompiler$
    .selectMany(runWebpackCompiler)
    .selectMany(stats =>
      // See MultiCompiler - MultiStats
      Observable.fromArray(stats.stats)
        .map(stats => ({stats, statsJson: stats.toJson()}))
    );
}

/**
 * @public
 */
export function webpackConfig$ToChunkList$ (webpackConfig$) {
  return Observable.of(webpackConfig$)
    .map(webpackConfig$ToWebpackCompiler$)
    .map(webpackCompiler$ToWebpackStats$)
    .selectMany(mergeWebpackStats$ToChunkList$WithWebpackConfig$(webpackConfig$));
}

/**
 * @public
 */
export function chunkList$ToStaticMarkup$ (chunkList$) {
  return chunkList$
    .groupBy(it => it.filepath)
    .selectMany(groupedObsToStaticMarkup);
}

/**
 * @package
 */
export function evaluateAsES2015Module (code, filepath) {
  const cjsModule = evaluateAsModule(code, filepath);
  if (cjsModule.exports && cjsModule.__esModule) {
    return cjsModule.exports;
  } else {
    return {
      "default": cjsModule.exports,
    };
  };
}

/**
 * @private
 */
export function fromBabelCodeToReactElement ({filepath, code}) {
  const ComponentModule = evaluateAsES2015Module(code, filepath);
  const element = ComponentModule.default;
  const doctypeHTML = ComponentModule.doctypeHTML || "<!DOCTYPE html>";

  return {
    filepath,
    element,
    doctypeHTML,
  };
}

/**
 * @private
 */
export function isEntryType (type) {
  return entryPropTypeKeyList.every(key => {
    return type.propTypes && type.propTypes[key];
  });
}

/**
 * @private
 */
export function entryWithConfigReducer (children) {
  const acc = [];

  Children.forEach(children, child => {
    if (!React.isValidElement(child)) {
      return;
    }
    if (isEntryType(child.type)) {
      const {
        chunkName,
        chunkFilepath,
        configFilepath,
      } = child.props;

      acc.push({
        chunkName,
        chunkFilepath,
        configFilepath,
      });
    }
    acc.push(...entryWithConfigReducer(child.props.children));
  });

  return acc;
}

/**
 * @private
 */
export function extractWebpackConfigFilepathList ({filepath, element, doctypeHTML}) {
  const entryWithConfigList = entryWithConfigReducer(element.props.children);

  return Observable.fromArray(entryWithConfigList)
    .map(({chunkName, chunkFilepath, configFilepath}) => {
      return {
        filepath,
        element,
        doctypeHTML,
        chunkName,
        chunkFilepath,
        webpackConfigFilepath: resolvePath(toDirname(filepath), configFilepath),
      };
    });
}

/**
 * @private
 */
export function toEntryReducer(acc, item) {
  const {chunkName, chunkFilepath} = item;
  if (!acc.entry.hasOwnProperty(chunkName)) {
    acc.entry[chunkName] = chunkFilepath;
    acc.chunkList.push(item);
  }
  return acc;
}

/**
 * @private
 */
export function groupedObsToWebpackConfig (groupedObservable) {
  // http://requirebin.com/?gist=fe2c7d8fe7083d8bcd2d
  const {key: webpackConfigFilepath} = groupedObservable;

  return groupedObservable.reduce(toEntryReducer, {entry: {}, chunkList: []})
    .first()
    .selectMany(function ({entry, chunkList}) {
      return transformFile(webpackConfigFilepath)
        .map(({code}) => {
          const WebpackConfigModule = evaluateAsES2015Module(code, webpackConfigFilepath);
          const webpackConfig = WebpackConfigModule.default;

          return {
            webpackConfigFilepath,
            chunkList,
            webpackConfig: {
              ...webpackConfig,
              entry: {
                ...webpackConfig.reacthtmlpackExtraEntry,
                ...entry,
              },
            },
          }
        });
    });
}

/**
 * @private
 */
export function runWebpackCompiler (compiler) {
  return Observable.fromNodeCallback(::compiler.run)();
}

/**
 * @package
 */
export function mergeWebpackStats$ToChunkList$WithWebpackConfig$ (webpackConfig$) {
  return webpackStats$ => {
    return Observable.zip(
      webpackStats$,
      webpackConfig$,
      ({stats, statsJson}, {chunkList}) => ({chunkList, stats, statsJson})
    )
    .selectMany(chunkListWithStats);
  };
}

/**
 * @private
 */
export function chunkListWithStats ({chunkList, stats, statsJson}) {
  return Observable.fromArray(chunkList)
    .map((it) => {
      const outputAssetList = [].concat(statsJson.assetsByChunkName[it.chunkName])
        .map(assetName => {
          return {
            rawAsset: stats.compilation.assets[assetName],
            publicFilepath: `${ statsJson.publicPath }${ assetName }`,
          };
        });

      return {
        ...it,
        outputAssetList,
      };
    });
}

/**
 * @private
 */
export function entryWithOutputMapper (children, outputAssetListByChunkName) {
  return Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return child;
    }
    const {
      chunkName,
      children,
    } = child.props;

    const extraProps = {
      children: entryWithOutputMapper(children, outputAssetListByChunkName),
    };

    if (isEntryType(child.type)) {
      extraProps.outputAssetList = outputAssetListByChunkName[chunkName];
    }

    return React.cloneElement(child, extraProps);
  });
}

/**
 * @private
 */
export function groupedObsToStaticMarkup (groupedObservable) {
  // http://requirebin.com/?gist=fe2c7d8fe7083d8bcd2d
  return groupedObservable.reduce((acc, item) => {
    const {chunkName, outputAssetList} = item;

    acc.outputAssetListByChunkName[chunkName] = outputAssetList;
    acc.filepath = item.filepath;
    acc.element = item.element;
    acc.doctypeHTML = item.doctypeHTML;

    return acc;
  }, {outputAssetListByChunkName: {}})
    .first()
    .map(({outputAssetListByChunkName, filepath, element, doctypeHTML}) => {
      const clonedElement = React.cloneElement(element, {
        children: entryWithOutputMapper(element.props.children, outputAssetListByChunkName),
      });

      const reactHtmlMarkup = React.renderToStaticMarkup(clonedElement);
      const markup = `${ doctypeHTML }${ reactHtmlMarkup }`;

      return {
        filepath,
        markup,
      };
    });
}

