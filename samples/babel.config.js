// const resolveFrom = require('resolve-from');
const path = require('path');
const dbuxRoot = path.resolve(__dirname + '/..');

console.warn('samples/babel.config.js loaded')

module.exports = {
  ignore: ['**/node_modules/**'],
  "sourceMaps": "both",
  "retainLines": true,
  "presets": [
    [
      "@babel/preset-env",
      {
        "loose": true,
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ],
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
    "@babel/plugin-syntax-flow",
    //"@babel/plugin-transform-runtime"
  ],
  babelrcRoots: [
    path.join(dbuxRoot, "dbux-common"),
    path.join(dbuxRoot, "dbux-runtime")
  ]
};