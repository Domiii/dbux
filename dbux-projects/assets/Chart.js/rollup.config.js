/* eslint-disable import/no-commonjs */
/* eslint-env es6 */

const cleanup = require('rollup-plugin-cleanup');
const dts = require('rollup-plugin-dts').default;
const json = require('@rollup/plugin-json');
const { babel } = require('@rollup/plugin-babel');
const serve = require('rollup-plugin-serve');
const resolve = require('@rollup/plugin-node-resolve').default;
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

const input = 'src/index.js';
const inputESM = {
  'dist/chart.esm': 'src/index.esm.js',
  'dist/helpers.esm': 'src/helpers/index.js'
};
const inputESMTypings = {
  'dist/chart.esm': 'types/index.esm.d.ts',
  'dist/helpers.esm': 'types/helpers/index.d.ts'
};

const banner = `/*!
 * Chart.js v${pkg.version}
 * ${pkg.homepage}
 * (c) ${(new Date(process.env.SOURCE_DATE_EPOCH ? (process.env.SOURCE_DATE_EPOCH * 1000) : new Date().getTime())).getFullYear()} Chart.js Contributors
 * Released under the MIT License
 */`;

module.exports = [
  // UMD builds
  // dist/chart.min.js
  // dist/chart.js
  {
    input: 'src/dbux.index.js',
    plugins: [
      json(),
      // allow for `require`: https://github.com/rollup/plugins/tree/master/packages/commonjs
      // import commonjs from '@rollup/plugin-commonjs';

      // commonjs({
      //   transformMixedEsModules: true
      // })
      babel({
        babelHelpers: 'inline',
        skipPreflightCheck: true, // WARNING: if not skipped, causes serious memory leak
        plugins: [
          '@dbux/babel-plugin'
          // 'D:/code/dbux/dbux-babel-plugin'
        ],
        // exclude: 'node_modules/**',
        ignore: [
          function shouldIgnore(modulePath) {
            if (!modulePath) {
              return undefined;
            }

            // no node_modules
            if (modulePath.match(/((node_modules)|(dist)).*(?<!\.mjs)$/)) {
              // verbose > 1 && debugLog(`[DBUX] no-register`, modulePath);
              return true;
            }

            modulePath = modulePath.toLowerCase();

            // TODO: something is going wrong here. More things to test for memory leaks:
            //   1. Babel
            //   1b. gensync (used by Babel internally)
            //   2. Rollup

            const shouldInstrument = true;
            // const shouldInstrument = modulePath.startsWith('d:\\code\\projects\\chart.js\\src\\core');
            // const shouldInstrument = modulePath.startsWith('d:\\code\\projects\\chart.js\\src\\core\\core.config.js');
            // return modulePath.startsWith('d:\\code\\projects\\chart.js\\src\\scales\\scale.linearbase.js');
            console.debug(`[DBUX] babel`, modulePath, shouldInstrument);
            return !shouldInstrument;
          }
        ]
      }),
      resolve(),
      // cleanup({
      // 	sourcemap: true
      // }),
      serve()
    ],
    output: {
      name: 'Chart',
      file: 'dist/chart.min.js', // call it 'min' to make samples work (but it is not min!)
      banner,
      format: 'umd',
      indent: false,
    },
  },
];
