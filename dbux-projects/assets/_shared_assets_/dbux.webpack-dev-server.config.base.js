const path = require('path');

module.exports = (ProjectRoot, env, argv) => {
  if (!env.port) {
    throw new Error(`env has not provided port`);
  }

  return {
    // contentBase: [
    //   projectRoot
    // ],
    quiet: false,
    //host: '0.0.0.0',
    // host:
    hot: true,
    port: env.port,
    // publicPath: outputFolder,
    writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    // filename: outFile,

    // index: 'index.html',

    contentBase: [
      path.join(ProjectRoot, 'dist'),
      // ProjectRoot
    ],
    // publicPath: outputFolder
  };
};