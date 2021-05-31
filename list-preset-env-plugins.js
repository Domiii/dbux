// list-preset-env-plugins.js

const babelCore = require('@babel/core');
const presetEnv = require('@babel/preset-env').default;

/**
 * Your preset-env options.
 * @see https://babeljs.io/docs/en/babel-preset-env#options
 */
const presetEnvOptions = {
  shippedProposals: true,
  debug: true
};

/**
 * @see https://github.com/babel/babel/blob/master/packages/babel-helper-plugin-utils/src/index.js
 */
const apiStub = {
  version: babelCore.version,
  assertVersion() { }
};

// invoke the preset
presetEnv(apiStub, presetEnvOptions);