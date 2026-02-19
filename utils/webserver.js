// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';
import devcert from 'devcert';
import WebpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import config from '../webpack.config.js';
import env from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const httpsOptions = await devcert.certificateFor('localhost');
var options = config.chromeExtensionBoilerplate || {};
var excludeEntriesToHotReload = options.notHotReload || [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hot=true&hostname=localhost&port=${env.PORT}`,
    ].concat(config.entry[entryName]);
  }
}

delete config.chromeExtensionBoilerplate;

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    https: httpsOptions,
    hot: true,
    liveReload: false,
    client: {
      webSocketTransport: 'sockjs',
      // webSocketURL: {
      //   protocol: 'wss',
      //   hostname: 'localhost',
      //   port: env.PORT,
      //   pathname: '/ws',
      // },
    },
    webSocketServer: 'sockjs',
    host: 'localhost',
    port: env.PORT,
    static: {
      directory: path.join(__dirname, '../build'),
    },
    devMiddleware: {
      publicPath: `http://localhost:${env.PORT}/`,
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
  },
  compiler
);

(async () => {
  await server.start();
})();
