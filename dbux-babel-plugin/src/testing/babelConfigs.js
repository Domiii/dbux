import defaultsDeep from 'lodash/defaultsDeep';

const babelConfigEs6 = {
  "plugins": [
    [
      "@babel/plugin-proposal-class-properties",
      {
        "loose": true
      }
    ],
    "@babel/plugin-proposal-optional-chaining",
    [
      "@babel/plugin-proposal-decorators",
      {
        "legacy": true
      }
    ],
    "@babel/plugin-proposal-function-bind",
    "@babel/plugin-syntax-export-default-from",
    "@babel/plugin-syntax-dynamic-import",
    //"@babel/plugin-transform-runtime"
  ]
};

/**
 * Transpile to ES5
 */
export const babelConfigEs5 = defaultsDeep({
  "presets": [
    [
      "@babel/preset-env",
      {
        "loose": true,
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}, babelConfigEs6);

/**
 * Transpile to es6.
 */
export const babelConfigNext = defaultsDeep({
  "presets": [
    [
      "@babel/preset-env",
      {
        targets: {
          node: 'current',
          //chrome: '58'
        },
        "loose": true,
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}, 
  babelConfigEs6);