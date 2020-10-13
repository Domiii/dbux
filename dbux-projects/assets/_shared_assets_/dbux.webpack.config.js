const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');
const originalWebpackConfig = require('./webpack.config');

const ProjectRoot = path.resolve(__dirname);
const resultCfg = buildWebpackConfig(ProjectRoot, {}, originalWebpackConfig);

module.exports = resultCfg;