import {
  resolve as resolvePath,
} from "path";

import {
  default as Rx,
  Observable,
} from "rx";

import {
  default as _,
} from "lodash";

import {
  createGlobResult,
  globResultToFile,
  addCodeToFile,
  addElementToFile,
  addEntryListToFile,
  groupedEntryListToWebpackConfig,
  webpackConfigReducer,
  webpackConfigArrayInspector,
  webpackConfigArrayToWebpackCompiler,
  webpackMultiCompilerToMultiStats,
  webpackMultiStatsToWebpackSingleStatsArray,
  withOutputAssetsFileToMarkupFile,
  // Watch
  webpackCompilerRunWithWatchToSingleStatsWithIndex,
  // DevServer
  webpackMultiCompilerRunWithDevServerToSingleStatsArray,
} from "./core/index";

import {
  mkdirp,
  writeFile,
  markupFileToWriteFileCreator,
  entryListFileToEntry,
  webpackConfigArrayToIndexFilepathMap,
  indexFilepathMapAndSingleStatsArrayCombiner,
  entryListFileAndFilepathWebpackStatsMapCombiner,
  // DevServer
  addDevServerToWebpackConfigCreator,
} from "./util/index";

/**
 * @private
 */
export function createEntryListFile (srcPatternList) {
  return Observable.from(srcPatternList)
    .selectMany(createGlobResult)
    .selectMany(globResultToFile)
    .selectMany(addCodeToFile)
    .map(addElementToFile)
    .map(addEntryListToFile)
}

/**
 * @private
 */
export function createWebpackConfigArray (entryListFile, devServerConfigFilepath) {
  return entryListFile
    .selectMany(entryListFileToEntry)
    .groupBy(entry => entry.configFilepath)
    .selectMany(groupedEntryListToWebpackConfig)
    .map(addDevServerToWebpackConfigCreator(devServerConfigFilepath))
    .reduce(webpackConfigReducer, [])
}

/**
 * @private
 */
export function createWebpackConfigFilepathByIndex (webpackConfigArray) {
  return webpackConfigArray
    .map(webpackConfigArrayToIndexFilepathMap);
}

/**
 * @public
 */
export function buildToDir (destDir, srcPatternList) {

  const entryListFileStream = createEntryListFile(srcPatternList);

  const webpackConfigArrayStream = createWebpackConfigArray(entryListFileStream);

  const webpackConfigFilepathByIndexStream = createWebpackConfigFilepathByIndex(webpackConfigArrayStream);

  const webpackSingleStatsArrayStream = webpackConfigArrayStream
    .map(webpackConfigArray => webpackConfigArray.map(({webpackConfig}) => webpackConfig))
    .tap(webpackConfigArrayInspector)
    .map(webpackConfigArrayToWebpackCompiler)
    .selectMany(webpackMultiCompilerToMultiStats)
    .map(webpackMultiStatsToWebpackSingleStatsArray)

  const webpackStatsByFilepathStream = Observable.combineLatest(
    webpackConfigFilepathByIndexStream,
    webpackSingleStatsArrayStream,
    indexFilepathMapAndSingleStatsArrayCombiner
  )

  const writeToFileResultStream = Observable.combineLatest(
    entryListFileStream,
    webpackStatsByFilepathStream,
    entryListFileAndFilepathWebpackStatsMapCombiner
  )
    .map(withOutputAssetsFileToMarkupFile)
    .selectMany(markupFileToWriteFileCreator(destDir));

  writeToFileResultStream.subscribe(
    it => console.log(`Next: ${ it }`),
    error => {throw error},
    () => console.log(`Done!`)
  );
}

/**
 * @public
 */
export function watchAndBuildToDir (destDir, srcPatternList) {

  const entryListFileStream = createEntryListFile(srcPatternList);

  const webpackConfigArrayStream = createWebpackConfigArray(entryListFileStream);

  const webpackConfigFilepathByIndexStream = createWebpackConfigFilepathByIndex(webpackConfigArrayStream);

  const webpackSingleStatsArrayStream = webpackConfigArrayStream
    .map(webpackConfigArray => webpackConfigArray.map(({webpackConfig}) => webpackConfig))
    .tap(webpackConfigArrayInspector)
    .selectMany(function webpackConfigArrayRunWithWatchToSingleStatsArray (webpackConfigArray) {
      // Why selectMany? Because watch could be repeative.
      // Instead of wrapping one value, now a series of values are emitted.
      return Observable.from(webpackConfigArray)
        .map(webpackConfigArrayToWebpackCompiler)
        .selectMany(webpackCompilerRunWithWatchToSingleStatsWithIndex)
        .scan((acc, it) => {
          acc = [...acc];
          const {index, ...rest} = it;

          acc[index] = rest;

          return acc;
        }, new Array(webpackConfigArray.length))
        .takeWhile(webpackSingleStatsArray => webpackSingleStatsArray.every(_.identity));
    });

  const webpackStatsByFilepathStream = Observable.combineLatest(
    webpackConfigFilepathByIndexStream,
    webpackSingleStatsArrayStream,
    indexFilepathMapAndSingleStatsArrayCombiner
  )

  const writeToFileResultStream = Observable.combineLatest(
    entryListFileStream,
    webpackStatsByFilepathStream,
    entryListFileAndFilepathWebpackStatsMapCombiner
  )
    .map(withOutputAssetsFileToMarkupFile)
    .selectMany(markupFileToWriteFileCreator(destDir));

  writeToFileResultStream.subscribe(
    it => console.log(`Next: ${ it }`),
    error => {throw error},
    () => console.log(`Done!`)
  );
}

/**
 * @public
 */
export function devServer (relativeDevServerConfigFilepath, destDir, srcPatternList) {

  const devServerConfigFilepath = resolvePath(process.cwd(), relativeDevServerConfigFilepath);

  const entryListFileStream = createEntryListFile(srcPatternList);

  const webpackConfigArrayStream = createWebpackConfigArray(entryListFileStream, devServerConfigFilepath);

  const webpackConfigFilepathByIndexStream = createWebpackConfigFilepathByIndex(webpackConfigArrayStream);

  const webpackSingleStatsArrayStream = webpackConfigArrayStream
    .map(webpackConfigArray => webpackConfigArray.map(({webpackConfig}) => webpackConfig))
    .tap(webpackConfigArrayInspector)
    .map(webpackConfigArrayToWebpackCompiler)
    // Why selectMany? Because devServer just like watch could be repeative.
    // Instead of wrapping one value, now a series of values are emitted.
    .selectMany(webpackMultiCompilerRunWithDevServerToSingleStatsArray)

  const webpackStatsByFilepathStream = Observable.combineLatest(
    webpackConfigFilepathByIndexStream,
    webpackSingleStatsArrayStream,
    indexFilepathMapAndSingleStatsArrayCombiner
  )

  const writeToFileResultStream = Observable.combineLatest(
    entryListFileStream,
    webpackStatsByFilepathStream,
    entryListFileAndFilepathWebpackStatsMapCombiner
  )
    .map(withOutputAssetsFileToMarkupFile)
    .selectMany(markupFileToWriteFileCreator(destDir));

  writeToFileResultStream.subscribe(
    it => console.log(`Next: ${ it }`),
    error => {throw error},
    () => console.log(`Done!`)
  );
}
