const path = require('path');
const buildWebpackConfig = require('./webpack.config.dbux.base');
const originalWebpackConfig = require('./webpack.config');

const ProjectRoot = path.resolve(__dirname);
const resultCfg = buildWebpackConfig(ProjectRoot, { src: 'app' }, originalWebpackConfig, {

});

module.exports = resultCfg;