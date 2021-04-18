
/**
 * Steps to decipher example:
 *    cd examples/...
 *    Run w/ Dbux: `build.js`
 *    Find webpack-cli `node` command -> copy + paste -> modify -> run w/ Dbux
 * Run:
 *    node "../../../../../node_modules/@dbux/cli/bin/dbux.js" run --verbose=1 --esnext "../../bin/webpack.js" -- --mode none --env none --output-pathinfo verbose --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js
 */

/**
 * TODO:
 * 1. fix await expressions
 * 2. ignore large (/minified/certain) files
 */