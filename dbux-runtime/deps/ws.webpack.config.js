/**
 * Babel `ws` so it works with older node versions.
 * 
 * @file
 */

const path = require('path');
const { getDependencyRoot } = require('@dbux/cli/lib/dbux-folders');
const nodeExternals = require('webpack-node-externals');
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

const ProjectRoot = path.join(__dirname, '..');
const DependencyRoot = getDependencyRoot(); // ProjectRoot;
const nodeVersions = [5, 6, 7, 8];

function makeBabelOptions(nodeVersion) {
  return {
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
}

const wsPath = path.resolve(DependencyRoot, 'node_modules', 'ws');


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

  return nodeVersions.map(nodeVersion => {
    // ###########################################################################
    // entry
    // ###########################################################################

    // const entry = fromEntries(nodeVersions.map(v =>
    //   [`ws.${v}`, path.join(wsPath, 'index.js')]
    // ));

    const entry = {
      [`ws.${nodeVersion}`]: path.join(wsPath, 'index.js')
    };

    // ###########################################################################
    // final result
    // ###########################################################################
    return {
      mode: mode,
      entry,
      target: 'node',
      devtool: 'source-map',
      context: ProjectRoot,
      output: {
        filename: `[name].js`,
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
            options: makeBabelOptions(nodeVersion)
          }
        ]
      },
      node: {
        __dirname: true,
        __filename: true
      },
      externals
    };
  });
};