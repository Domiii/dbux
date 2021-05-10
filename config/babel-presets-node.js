// NOTE: we cannot use preset + plugin names, but *must* `require` them directly
//      See: https://github.com/Domiii/dbux/issues/456

module.exports = {
  sourceType: 'unambiguous',
  presets: [
    [
      require('@babel/preset-env').default,
      {
        targets: {
          node: '12'
        },
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [
    [
      require("@babel/plugin-proposal-class-properties").default,
      {
        // loose: true
      }
    ],
    require("@babel/plugin-proposal-optional-chaining").default,
    [
      require("@babel/plugin-proposal-decorators").default,
      {
        legacy: true
      }
    ],
    require("@babel/plugin-proposal-function-bind").default,
    require("@babel/plugin-syntax-export-default-from").default,
    require("@babel/plugin-syntax-dynamic-import").default,
    require("@babel/plugin-transform-runtime").default,

    // NOTE: cannot convert mjs with @babel/register: https://github.com/babel/babel/issues/6737
    // '@babel/plugin-transform-modules-commonjs'
  ]
};