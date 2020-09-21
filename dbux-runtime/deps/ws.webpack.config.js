/**
 * Babel `ws` so it works with older node versions.
 * 
 * @file
 */

const path = require('path');
const { getDependencyRoot } = require('@dbux/cli/lib/dbux-folders');
const nodeExternals = require('webpack-node-externals');

const ProjectRoot = path.join(__dirname, '..');
const DependencyRoot = getDependencyRoot(); // ProjectRoot;
const nodeVersion = 7;

const babelOptions = {
  // see https://github.com/webpack/webpack/issues/11510#issuecomment-696027212
  sourceType: "unambiguous",
  sourceMaps: true,
  retainLines: true,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: nodeVersion
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ]
};

const wsPath = path.resolve(DependencyRoot, 'node_modules', 'ws');

// ###########################################################################
// entry
// ###########################################################################

const entry = {
  ws: path.join(wsPath, 'index.js')
};

// ###########################################################################
// resolve.modules
// ###########################################################################

const modules = [
  path.join(DependencyRoot, 'node_modules'),
  path.join(wsPath, 'lib'),
  path.join(wsPath, 'node_modules')
];

// ###########################################################################
// externals
// ###########################################################################

const externals = [
  nodeExternals({
    additionalModuleDirs: [
      path.join(DependencyRoot, 'node_modules'),
      path.join(ProjectRoot, 'node_modules')
    ],
    allowlist: ['ws']
  })
];


// ###########################################################################
// final result
// ###########################################################################

module.exports = (env, argv = {}) => {
  const mode = argv.mode || 'development';

  return {
    mode: mode,
    entry,
    target: 'node',
    devtool: 'source-map',
    context: ProjectRoot,
    output: {
      filename: `[name].${nodeVersion}.js`,
      path: path.resolve(ProjectRoot, 'dist'),
      publicPath: 'dist',
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    resolve: {
      modules
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: [
            path.join(wsPath, 'lib')
          ],
          options: babelOptions
        }
      ]
    },
    node: {
      __dirname: true,
      __filename: true
    },
    externals
  };
};