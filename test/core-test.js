import {
  resolve as resolvePath,
} from "path";

import {
  default as sinon,
} from "sinon";

import {
  default as chai,
} from "chai";

import {
  default as dirtyChai,
} from "dirty-chai";

import {
  default as Rx,
  Observable,
} from "rx";

import {
  filepathToBabelResult$,
  fromBabelCodeToReactElement,
  extractWebpackConfigFilepathList$,
} from "../src/core";

import {
  readFileAsContent,
} from "./util";

chai.use(dirtyChai);
chai.should();

describe("core", () => {

  describe("filepathToBabelResult$ ", () => {

    it("should be exported", () => {
      filepathToBabelResult$ .should.exist();
    });

    it("should transform a filepath object into a babel-result stream", (done) => {
      const callback = sinon.spy();

      filepathToBabelResult$(
        resolvePath(__dirname, "./fixture/file/es6-fixture.js")
      )
        .tapOnNext(callback)
        .subscribe(({filepath, code}) => {

          const es6Filepath = resolvePath(__dirname, "./fixture/file/es6-fixture.js");
          const es5Fixture = readFileAsContent(resolvePath(__dirname, "./fixture/file/es5-fixture.js"));

          filepath.should.equal(es6Filepath);
          code.should.equal(es5Fixture);

        }, done, () => {
          callback.calledOnce.should.be.true();

          done();
        });
    });

  });

  describe("fromBabelCodeToReactElement", () => {

    it("should be exported", () => {
      fromBabelCodeToReactElement.should.exist();
    });

    it("should transform a babel-result object into a ReactElement object", () => {
      const {filepath, element} = fromBabelCodeToReactElement({
        filepath: resolvePath(__dirname, "./fixture/file/es6-fixture.js"),
        code: readFileAsContent(resolvePath(__dirname, "./fixture/file/es5-fixture.js")),
      });

      filepath.should.equal(resolvePath(__dirname, "./fixture/file/es6-fixture.js"));
      element.abc.should.be.a("function");
      element.resolvePath.should.equal(resolvePath);
    });

  });

  describe("extractWebpackConfigFilepathList$", () => {

    it("should be exported", () => {
      extractWebpackConfigFilepathList$.should.exist();
    });

    it("should transform a ReactElement object into a chunk stream", (done) => {
      const callback = sinon.spy();
      
      extractWebpackConfigFilepathList$({
        filepath: resolvePath(__dirname, "./fixture/html/single-entry-single-config-fixture.html.js"),
        element: require("./fixture/html/single-entry-single-config-fixture.html.js"),
      })
        .tapOnNext(callback)
        .subscribe(({filepath, element, chunkName, chunkFilepath, webpackConfigFilepath}) => {

          const expectedHtmlFilepath = resolvePath(__dirname, "./fixture/html/single-entry-single-config-fixture.html.js");
          const expectedWebpackConfigFilepath = resolvePath(__dirname, "./fixture/html/configFilepath-fixture.config.js");

          filepath.should.equal(expectedHtmlFilepath);

          element.type.should.equal("html");
          const head = element.props.children;
          const title = head.props.children[0];
          const entry = head.props.children[1];

          head.type.should.equal("head");
          title.type.should.equal("title");

          entry.type.name.should.equal("TestEntry");
          entry.props.should.eql({
            chunkName: "chunkName-fixture",
            chunkFilepath: "chunkFilepath-fixture.js",
            configFilepath: "configFilepath-fixture.config.js",
          });

          chunkName.should.equal("chunkName-fixture");
          chunkFilepath.should.equal("chunkFilepath-fixture.js");
          webpackConfigFilepath.should.equal(expectedWebpackConfigFilepath);

        }, done, () => {
          callback.calledOnce.should.be.true();

          done();
        });
    });

    it("should transform a ReactElement with multiple entries stream into a chunk stream", (done) => {
      const callback = sinon.spy();
      
      const chunk$ = extractWebpackConfigFilepathList$({
        filepath: resolvePath(__dirname, "./fixture/html/multi-entry-single-config-fixture.html.js"),
        element: require("./fixture/html/multi-entry-single-config-fixture.html.js"),
      });
      
      chunk$.subscribe(callback, done, () => {
          callback.calledTwice.should.be.true();
        });

      function commonPartsForChunks (filepath, webpackConfigFilepath, element) {
        const expectedHtmlFilepath = resolvePath(__dirname, "./fixture/html/multi-entry-single-config-fixture.html.js");
        const expectedWebpackConfigFilepath = resolvePath(__dirname, "./fixture/html/configFilepath-fixture.config.js");

        filepath.should.equal(expectedHtmlFilepath);
        webpackConfigFilepath.should.equal(expectedWebpackConfigFilepath);

        element.type.should.equal("html");
        const head = element.props.children[0];
        const title = head.props.children[0];

        head.type.should.equal("head");
        title.type.should.equal("title");
      }

      chunk$.take(1)
        .subscribe(({filepath, element, chunkName, chunkFilepath, webpackConfigFilepath}) => {

          commonPartsForChunks(filepath, webpackConfigFilepath, element);

          const head = element.props.children[0];
          const entry = head.props.children[1];

          entry.type.name.should.equal("TestEntry");
          entry.props.should.eql({
            chunkName: "chunkName-fixture",
            chunkFilepath: "chunkFilepath-fixture.js",
            configFilepath: "configFilepath-fixture.config.js",
          });

          chunkName.should.equal("chunkName-fixture");
          chunkFilepath.should.equal("chunkFilepath-fixture.js");

        }, done);

      chunk$.skip(1)
        .subscribe(({filepath, element, chunkName, chunkFilepath, webpackConfigFilepath}) => {

          commonPartsForChunks(filepath, webpackConfigFilepath, element);

          const entry = element.props.children[1];

          entry.type.name.should.equal("TestEntry");
          entry.props.should.eql({
            chunkName: "chunkName-2-fixture",
            chunkFilepath: "chunkFilepath-2-fixture.js",
            configFilepath: "configFilepath-fixture.config.js",
          });

          chunkName.should.equal("chunkName-2-fixture");
          chunkFilepath.should.equal("chunkFilepath-2-fixture.js");

        }, done, done);
    });

  });
});
