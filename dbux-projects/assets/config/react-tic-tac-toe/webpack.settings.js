const path = require('path');

module.exports = function (project) {
  const projectRoot = project.projectPath;

  return {
    entry: {
      index: 'src/index.js',
      // vendor: ['todomvc-app-css/index.css'],
    },
    webpackConfig: {
      alias: {
        /**
         * Enforce development (instead of obfuscated production) build.
         */
        // eslint-disable-next-line quote-props
        'react': 'react/cjs/react.development.js',
        'react-dom': 'react-dom/cjs/react-dom.development.js'
        // eslint-disable-next-line quote-props
        // 'react': 'react/umd/react.development.js',
        // 'react-dom': 'react-dom/umd/react-dom.development.js'
      },
      babelInclude: {
        packageWhitelist: '^react(?:[-].+)?$' // NOTE: must be string -> regexp serialization NYI
      },
      babelOptions: {
        cacheDirectory: true,
        presets: [
          '@babel/preset-react'
        ]
      },
      devServer: {
        devMiddleware: {
          publicPath: '/'
        },
        static: [
          {
            directory: path.resolve(projectRoot, 'dist'),
            publicPath: '/'
          },
          {
            directory: path.resolve(projectRoot, 'public'),
            publicPath: '/'
          }
        ]
      }
    },
    websitePort: 3843
  };
};