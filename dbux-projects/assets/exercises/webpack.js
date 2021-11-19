const config = [
  /**
  cd examples/commonjs
  node "../../../../node_modules/@dbux/cli/bin/dbux.js" run --pw=webpack,webpack-cli --verbose=1 --runtime="{\"tracesDisabled\":1}" "../../bin/webpack.js" -- --mode none --env none --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js
   */
  {
    label: 'examples/commonjs1',
    cwd: 'examples/commonjs',
    // patch: 'patch1',
    description: 'Basic commonjs Webpack example.',
    runArgs: []
  },
  {
    label: 'examples/commonjs1 (--pw=.*)',
    cwd: 'examples/commonjs',
    // patch: 'patch1',
    description: 'Basic commonjs Webpack example (all modules).',
    runArgs: [],
    dbuxArgs: `--pw=.* --pb=v8-compile-cache`,
  }
];

module.exports = config;