const path = require('path');

module.exports = (ProjectRoot, env, argv) => {
  return {
    // contentBase: [
    //   projectRoot
    // ],
    quiet: false,
    //host: '0.0.0.0',
    // host:
    hot: true,
    port: env.PORT,
    // publicPath: outputFolder,
    writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    // filename: outFile,

    contentBase: [
      path.join(ProjectRoot, 'dist')
    ],
    // publicPath: outputFolder
  };
};