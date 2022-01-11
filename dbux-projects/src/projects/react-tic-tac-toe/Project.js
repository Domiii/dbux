import path from 'path';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Project from '../../projectLib/Project';


export default class ReactProject extends Project {
  gitRemote = 'real-world-debugging/react-tutorial-solutions';
  // gitCommit = 'tags/v17.0.2';


  makeBuilder() {
    const projectRoot = this.projectPath;
    return new WebpackBuilder({
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
    });
  }

  async afterInstall() {
  }

  loadExerciseConfigs() {
    return [
      {
        label: 'Baseline',
        // patch: 'error1',
        runArgs: []
      }
    ];
  }

  decorateExerciseForRun(bug) {
  }

  async runCommand(bug, cfg) {
    // nothing to do yet
    // TODO: run tests?
  }
}