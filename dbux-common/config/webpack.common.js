/*
npm i -D webpack webpack-cli webpack-bundle-analyzer babel-loader style-loader eslint-loader css-loader
*/

const path = require('path');


module.exports = function(rootPath) {
  const outputFolderName = 'dist';
  const buildMode = 'development';
  //const buildMode = 'production';

  const outputPath = path.join(rootPath, outputFolderName);
  const srcPath = path.join(rootPath, 'src');
  const nodeModulesPath = path.join(rootPath, 'node_modules');

  const plugins = require(__dirname + '/webpack.plugins')();


  return {
    //watch: true,
    mode: buildMode,
    devtool: 'source-map',
    //devtool: 'inline-source-map',
    watchOptions: {
      aggregateTimeout: 5000,
      poll: 5000
    },
    plugins,
    context: srcPath,
    entry: './index.js',
    output: {
      library: 'dbux-babel-plugin',
      libraryTarget: 'umd',
      path: outputPath,
      publicPath: `/${outputFolderName}`,
      filename: '[name].js',
      globalObject: 'this'
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        // TODO: enable eslint once babel-eslint supports optional chaining
        //    see: https://github.com/babel/babel-eslint/issues/511
        // {
        //   loader: "eslint-loader",
        //   enforce: "pre",
        //   test: /\.jsx?$/,
        //   exclude: /node_modules/,
        //   include: srcPath
        // },
        {
          test: /\.css$/,
          include: [
            srcPath,
            nodeModulesPath
          ],
          use: ['style-loader', 'css-loader']
        },
        {
          loader: 'babel-loader',
          test: /\.jsx?$/,
          exclude: /node_modules/,
          include: srcPath
        },
        // {
        //   test: /\.json$/,
        //   loader: 'json-loader'
        // }
      ],
    }
  };
};