import {
  default as React,
} from "react";

import {
  WebpackScriptEntry,
  WebpackStyleEntry,
  ReactRenderToStringEntry,
} from "../../../lib/entry";

function unsupportedIconsFeature () {
  if (!!WebpackScriptEntry.abcdefgblabla) {
    // These features aren't supported atm.
    return [
      /* Apple iOS devices and Google Android Devices */
      <link rel="apple-touch-icon-precomposed" href="/path/to/a-hashtag-152-211218.png" />,
      /* IE 10 Metro Tile Icon */
      <meta name="msapplication-TileColor" content="#ffffff" />,
      <meta name="msapplication-TileImage" content="/path/to/a-hashtag-144-211218.png" />,
      /* Everything Else */
      <link rel="apple-touch-icon-precomposed" sizes="152x152" href="/path/to/a-hashtag-152-211218.png" />,
      <link rel="apple-touch-icon-precomposed" sizes="144x144" href="/path/to/a-hashtag-144-211218.png" />,
      <link rel="apple-touch-icon-precomposed" sizes="120x120" href="/path/to/a-hashtag-120-211218.png" />,
      <link rel="apple-touch-icon-precomposed" sizes="114x114" href="/path/to/a-hashtag-114-211218.png" />,
      <link rel="apple-touch-icon-precomposed" sizes="72x72" href="/path/to/a-hashtag-72-211218.png" />,
      <link rel="apple-touch-icon-precomposed" href="/path/to/a-hashtag-57-211218.png" />,
      <link rel="icon" href="/path/to/a-hashtag-32-211218.png" sizes="32x32" />,
      /* end of icons */
    ];
  } else {
    return null;
  }
}

export default (
  <html>
    <head>
      <title>React Google Maps | tomchentw</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <meta charSet="UTF-8" />
      {/* http://www.freefavicon.com/freefavicons/objects/iconinfo/a-hashtag-152-211218.html */}
      <link href="favicon.ico" rel="shortcut icon" />
      {unsupportedIconsFeature()}
      <WebpackStyleEntry
        chunkName="client"
        chunkFilepath="./scripts/client.js"
        configFilepath="../Client.webpackConfig.js"
      />
      <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing" />
    </head>
    <body>
      <ReactRenderToStringEntry
        id="react-container"
        tagName="div"
        chunkName="server"
        chunkFilepath="./scripts/ReactRoot.js"
        configFilepath="../Server.webpackConfig.js"
      />
      <WebpackScriptEntry
        chunkName="client"
        chunkFilepath="./scripts/client.js"
        configFilepath="../Client.webpackConfig.js"
      />
    </body>
  </html>
);
