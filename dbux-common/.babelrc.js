module.exports = {
  ignore: ['node_modules'],
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
    ],
    "@babel/flow"
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
  ]
};