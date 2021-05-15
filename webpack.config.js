// TODO: use parallel-webpack to run this together with dbux-code
// (see https://github.com/trivago/parallel-webpack)
/* eslint no-console: 0 */


const path = require('path');
const fs = require('fs');
const mergeWith = require('lodash/mergeWith');
const isArray = require('lodash/isArray');
const { isFunction } = require('lodash');

const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const webpackCommon = require('./config/webpack.config.common');

const {
  getDependenciesPackageJson,
  makeResolve,
  makeAbsolutePaths
} = require('./dbux-cli/lib/package-util');

// NOTE: we use this for bundling `debug` as "browser", which is used by `socket.io-client
require('process').type = 'renderer';

// ###########################################################################
// utilities
// ###########################################################################

function arrayMerge(dst, src) {
  if (isArray(dst)) {
    return dst.concat(src);
  }
  return undefined;
}
function mergeWithArrays(dst, src) {
  return mergeWith(dst, src, arrayMerge);
}


module.exports = (env, argv) => {
  try {
    const MonoRoot = path.resolve(__dirname);

    const targets = [
      ["dbux-babel-plugin", (resolve) => {
        return {
          target: 'node',
          externals: [
            // /^fs$/,
            // /^process$/,
            // /^path$/,

            // NOTE: these are part of experiments for https://github.com/Domiii/dbux/issues/513
            // /(semver|@babel|module\\-alias|prettier)\//,

            nodeExternals({
              allowlist: [
                ...Object.keys(resolve.alias).map(name => new RegExp(`^${name}/src/.*`))
                // (...args) => {
                //   console.error(...args);
                //   return true;
                // }
              ]
            })
          ]
        };
      }],
      ["dbux-runtime", {
        resolve: {
          // fix for https://github.com/websockets/ws/issues/1538
          mainFields: ['main'],

          // fix for https://github.com/websockets/ws/issues/1538
          alias: {
            // ws: path.resolve(path.join(MonoRoot, 'dbux-runtime', 'node_modules', 'ws', 'index.js'))
          },

          fallback: {
            tty: false,
            util: false
          }
        },

        externals: [
          nodeExternals()
          // (info, callback) => {
          //   // eslint-disable-next-line no-shadow
          //   const { request, context } = info;
          //   if (/^util|debug/.test(request)) {
          //     console.error(request, context, new Error().stack);
          //   }
          //   callback();
          // }
        ]
      }]
    ];


    // const outputFolderName = 'dist';
    // const outFile = 'bundle.js';
    const defaultEntryPoint = 'src/index.js';

    // TODO: add `src` alias to every build
    // resolve.alias.src = 

    // alias['socket.io-client'] = path.resolve(path.join(root, 'dbux-runtime/node_modules', 'socket.io-client', 'socket.io.js' ));
    // console.warn(resol);

    const mode = argv.mode || 'development';

    const {
      DBUX_VERSION,
      DBUX_ROOT
    } = webpackCommon('main', mode);

    // const entry = fromEntries(targets.map(target => [target, path.resolve(path.join(target, defaultEntryPoint))]));

    // `context` is the path from which any relative paths are resolved
    const context = MonoRoot;


    // ###########################################################################
    // plugins
    // ###########################################################################

    const webpackPlugins = [
      new webpack.EnvironmentPlugin({
        NODE_ENV: mode,
        DBUX_VERSION,
        DBUX_ROOT
      })
    ];


    // ###########################################################################
    // output
    // ###########################################################################

    // const context = path.join(root, target);
    // const entry = {
    //   bundle: './src/index.js'
    // };
    const output = {
      // path: path.join(context, outputFolderName),
      path: context,
      library: '[name]',     // see https://github.com/webpack/webpack/tree/master/examples/multi-part-library
      // library: target
      libraryTarget: 'umd',
      libraryExport: 'default',
      publicPath: 'dbux',
      filename: '[name]/dist/index.js',
      sourceMapFilename: '[name]/dist/index.js.map',

      // see: https://gist.github.com/jarshwah/389f93f2282a165563990ed60f2b6d6c
      devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',  // map to source with absolute file path not webpack:// protocol

      // hackfix for bug: https://medium.com/@JakeXiao/window-is-undefined-in-umd-library-output-for-webpack4-858af1b881df
      // globalObject: '(typeof self !== "undefined" ? self : this)',
      globalObject: '(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this))'
    };


    // ###########################################################################
    // stats
    // ###########################################################################

    const stats = {
      errorDetails: true
    };

    // ###########################################################################
    // buildConfig
    // ###########################################################################

    // eslint-disable-next-line no-inner-declarations
    function buildConfig([target, configOverrides]) {
      const targetRoot = path.join(MonoRoot, target);

      const entry = {
        [target]: path.join(targetRoot, defaultEntryPoint)
      };

      // find all dbux depencies in target, so we can resolve their `src` folders
      const dependencyPattern = /^@dbux\/.*/;

      // look up dependency by package name
      const dependencyLinks = getDependenciesPackageJson(targetRoot/* , target */, dependencyPattern).
        map(depName => path.join(MonoRoot, 'node_modules', depName));

      // look up folders of each dependency
      const dependencyFolderNames = dependencyLinks.map(
        // link => fs.realpathSync(link).replace(MonoRoot, '')
        link => path.relative(MonoRoot, fs.realpathSync(link))
      );
      dependencyFolderNames.push(target);

      // resolve
      const resolve = makeResolve(MonoRoot, dependencyFolderNames);
      // resolve.alias['@'] = src;

      // add `src` folders to babel-loader
      const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyFolderNames);
      const includeSrcs = absoluteDependencies.map(r => path.join(r, 'src'));

      let cfg = {
        watchOptions: {
          poll: true,
          ignored: /node_modules/
        },
        mode,

        // https://github.com/webpack/webpack/issues/2145
        // devtool: 'inline-module-source-map',
        devtool: 'source-map',
        // devtool: 'inline-source-map',
        plugins: webpackPlugins,
        context,
        entry,
        output,
        stats,
        resolve,
        module: {
          rules: [
            {
              // test(resource) {
              //   // see: https://stackoverflow.com/a/46769010
              //   console.debug('[TEST]\n  ', resource);
              //   return true;
              // },
              loader: 'babel-loader',
              include: includeSrcs,
              options: {
                babelrcRoots: absoluteDependencies
              }
            },
            {
              use: ['source-map-loader'],
              include: absoluteDependencies.map(r => path.join(r, 'dist')),
              test: /\.js$/,
              enforce: 'pre'
            }
          ],
        },

        // see: https://webpack.js.org/guides/code-splitting/
        // optimization: {
        //   splitChunks: {
        //     chunks: 'all',
        //   },
        // },
        // externals: [{
        //   fs: 'commonjs fs',
        //   net: 'commonjs net',
        //   // tls: 'commonjs tls',

        //   // NOTE: `ws` is externalized for `@dbux/runtime` because we don't need it for running in the browser
        //   ws: 'commonjs ws',

        //   util: 'commonjs util',
        //   // util: (target === 'dbux-runtime') ? 'commonjs util'
        // },

        // see: https://www.npmjs.com/package/webpack-node-externals
        // NOTE: `node-externals` does not bundle `node_modules`
        // nodeExternals({
        //   allowlist: [
        //     'perf_hooks',
        //     ...Object.keys(resolve.alias).map(name => new RegExp(`^${name}/src/.*`))
        //   ],
        //   // (...args) {
        //   //   console.debug('nodeExternals', ...args);
        //   //   return true;
        //   // }
        //   // [
        //   //   'perf_hooks',

        //   //   // quote from the docs: "Important - if you have set aliases in your webpack config with the exact same names as modules in node_modules, you need to whitelist them so Webpack will know they should be bundled."
        //   //   ...Object.keys(resol.alias)
        //   // ]
        // }),
        // 'fs', 'net'   // debug library complains about these
      };

      configOverrides = isFunction(configOverrides) ? configOverrides(resolve) : configOverrides;
      cfg = mergeWithArrays(cfg, configOverrides);

      return cfg;
    }

    // ###########################################################################
    // other configs
    //  (WARNING: add node configs only! don't mix targets with webpack; it doesn't like it.)
    // ###########################################################################

    const otherWebpackConfigPaths = [
      // `./dbux-runtime/deps/ws.webpack.config`,

      // NOTE: Don't build `dbux-graph-client` here bc/ Webpack bugs out when merging configs with different targets (i.e. `node` + `browser`)
      ...[
        'cli',
        'server',
        'code',
      ].map(name => `./dbux-${name}/webpack.config`),
    ];

    const otherWebpackConfigs = otherWebpackConfigPaths.map(p =>
      /* eslint-disable-next-line global-require, import/no-dynamic-require */
      require(p)
    );


    // ###########################################################################
    // module.exports
    // ###########################################################################

    return [
      ...targets.map(buildConfig),

      // NOTE: you can have multiple configs per file (see https://stackoverflow.com/a/46825869)
      ...otherWebpackConfigs.
        map(cb => cb(env, argv)).
        flat()
    ];
  }
  catch (err) {
    console.error('webpack.config failed:', err);
    throw err;
  }
};

// console.warn(Object.keys(resol.alias).map(name => new RegExp(`^${name}/.*`)));

// console.debug('[Dbux] webpack.config loaded',
//   // targetsAbsolute
// );