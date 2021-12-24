const path = require('path');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const { copyPlugin } = buildWebpackConfig;
const ProjectRoot = path.resolve(__dirname);

const customCfg = {
  target: 'web',
  src: ['src', 'dbux-examples'],
  // plugins: [
  //   // new HtmlWebpackPlugin({
  //   //   template: './index.html',
  //   //   inject: 'head',
  //   // }),
  //   copyPlugin(ProjectRoot, ['examples', 'css', 'lib', 'fonts', 'images', 'languages', 'dbux-examples/*.html'])
  // ]
};

/*const overrides = (env, arg) => {
  return {
    // context: ProjectRoot,

  }; 
}*/

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg/* , overrides */);

module.exports = resultCfg;