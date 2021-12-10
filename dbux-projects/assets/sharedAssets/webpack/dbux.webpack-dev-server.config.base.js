const path = require('path');

module.exports = (ProjectRoot, cfg, argv) => {
  if (!cfg.port) {
    throw new Error(`env has not provided port`);
  }

  return {
    //host: '0.0.0.0',
    // host:
    hot: true,
    port: cfg.port,

    devMiddleware: {
      writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
      // publicPath: outputFolder,
      // filename: outFile,
      // index: 'index.html',
    },

    // static: [
    //   {
    //     directory: path.join(ProjectRoot, 'public'),
    //     publicPath: '/'
    //   },
    //   {
    //     directory: path.join(ProjectRoot, 'dist'),
    //     publicPath: '/'
    //   }
    //   // {
    //   //   directory: path.join(ProjectRoot, 'node_modules'),
    //   //   publicPath: '/node_modules'
    //   // }
    // ]
    // publicPath: outputFolder
  };
};