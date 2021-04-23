const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');
// const originalWebpackConfig = require('./webpack.config');

const settings = {
  src: [
    'bin',
    'lib',
    'webpack-cli/packages/webpack-cli/bin',
    'webpack-cli/packages/webpack-cli/lib'
  ],
  preLoaders: [
    // see https://github.com/JavascriptIsMagic/shebang-loader/blob/master/index.js
    // allowHashbang
    {
      // see https://github.com/JavascriptIsMagic/shebang-loader/blob/master/index.js
      loader: './hashbangLoader'
    }
  ]
};

const ProjectRoot = path.resolve(__dirname);
const resultCfg = buildWebpackConfig(ProjectRoot, settings, (env, argv) => {
  return {
    resolve: {
      symlinks: true,
    }
  };
});

module.exports = resultCfg;