process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';
var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');
delete config.chromeExtensionBoilerplate;
config.mode = 'production';
var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);
webpack(config, (err, stats) => {
  if (err) {
    console.error("Webpack Error:", err.stack || err);
    if (err.details) {
      console.error("Webpack Error Details:", err.details);
    }
    process.exit(1);
  }
  if (stats.hasErrors()) {
    console.error(stats.toString({ colors: true }));
    process.exit(1);
  } else {
    console.log(stats.toString({ colors: true }));
    console.log(`\n✅ Build complete! Zip file created at: zip/${packageInfo.name}-${packageInfo.version}.zip\n`);
  }
});
