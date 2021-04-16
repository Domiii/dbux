const path = require('path');
const webpack = require('webpack');
const buildWebpackConfig = require('./dbux.webpack.config.base');
const CopyPlugin = require('copy-webpack-plugin');

const ProjectRoot = path.resolve(__dirname);

const customCfg = {
  target: 'web',
  src: ['js'],
  devServer: {
    // hot: false,
    // inline: false
  }
};

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg, (env, arg) => {
  return {
    context: ProjectRoot,

    plugins: [
      // new HtmlWebpackPlugin({
      //   template: './index.html',
      //   inject: 'head',
      // }),

      new CopyPlugin({
        patterns: [
          {
            force: true,
            from: path.join(ProjectRoot, 'index.html'),
            to: path.join(ProjectRoot, 'dist/index.html')
          },
          {
            force: true,
            from: path.join(ProjectRoot, 'style'),
            to: path.join(ProjectRoot, 'dist/style')
          }
        ]
      }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify("development")
        }
      })
    ],
    externals: [
      {
        // fs: 'console.error("required fs")',
        // tls: 'console.error("required tls")'
      }
    ]
  };
});

module.exports = resultCfg;