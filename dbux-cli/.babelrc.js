module.exports = {
  ignore: [],
  "sourceMaps": "both",
  "retainLines": true,
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "esmodules": false
        }
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
    // "@babel/plugin-transform-runtime"
  ]
};