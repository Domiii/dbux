import defaultsDeep from 'lodash/defaultsDeep';

// TODO: use _sharedPlugins instead

const babelConfigEs6 = {
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true
      }
    ],
    '@babel/plugin-proposal-function-bind',
    '@babel/plugin-syntax-export-default-from',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-flow',
    // "@babel/plugin-transform-runtime"
  ]
};

/**
 * Transpile to ES5
 */
export const babelConfigEs5 = defaultsDeep({
  presets: [
    [
      '@babel/preset-env'
    ]
  ]
}, babelConfigEs6);

/**
 * Transpile to esNext.
 */
export const babelConfigNext = defaultsDeep({
}, 
babelConfigEs6);