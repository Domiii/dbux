const loadBabel = require('./loadBabel');
const sharedPlugins = require('./_sharedPlugins');

module.exports = {
  sourceType: 'unambiguous',
  presets: [
    [
      loadBabel('@babel/preset-env'),
      {
        targets: {
          node: '14'
        },
        useBuiltIns: 'usage',
        corejs: "3.15",

        // /**
        //  * @see https://babeljs.io/docs/en/babel-preset-env#modules
        //  */
        // modules: 'cjs' // convert modules to cjs
        
        /**
         * Enforce modules.
         * Only works if node is told to load file as module (e.g. `--input-type=module`).
         * Can be useful for features such as top-level-await when using `@dbux/cli`.
         * TODO: also requires `instrumentation` to use `import` instead of `require` for runtime.
         * TODO: also requires @dbux/cli to enforce loading the file as an ESM.
         * 
         * @see https://stackoverflow.com/questions/61056049/babel-preset-env-not-loading-top-level-await-syntax-for-node-target/68364846#68364846
         */
        // modules: false
      }
    ]
  ],
  plugins: sharedPlugins
};