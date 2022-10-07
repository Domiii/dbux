const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const { copyPlugin } = buildWebpackConfig;
const ProjectRoot = path.resolve(__dirname);

const customCfg = {
  target: 'web',
  src: ['js'],
  plugins: [
    // new HtmlWebpackPlugin({
    //   template: './index.html',
    //   inject: 'head',
    // }),
  ]
};

/*const overrides = (env, arg) => {
  return {
    // context: ProjectRoot,

  }; 
}*/

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg/* , overrides */);

module.exports = resultCfg;
