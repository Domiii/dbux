// NOTE: we cannot use preset + plugin names, but *must* `require` them directly
//      See: https://github.com/Domiii/dbux/issues/456

function loadBabel(name) {
  // eslint-disable-next-line import/no-dynamic-require,global-require,camelcase
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  const module = requireFunc(name);
  if (module.default) {
    return module.default;
  }
  return module;
}


module.exports = {
  sourceType: 'unambiguous',
  presets: [
    [
      loadBabel('@babel/preset-env'),
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
    loadBabel('@babel/plugin-proposal-optional-chaining'),
    [
      loadBabel('@babel/plugin-proposal-decorators'),
      {
        legacy: true
      }
    ],
    loadBabel('@babel/plugin-proposal-function-bind'),
    loadBabel('@babel/plugin-syntax-export-default-from'),
    loadBabel('@babel/plugin-syntax-dynamic-import'),
    loadBabel('@babel/plugin-transform-runtime'),

    // NOTE: cannot convert mjs with @babel/register: https://github.com/babel/babel/issues/6737
    // '@babel/plugin-transform-modules-commonjs'
  ]
};