#!/usr/bin/env node
const path = require('path');

// don't cache this
process.env.BABEL_DISABLE_CACHE = 1;

const defaultBabelOptions = require('../babel.config');

const DbuxRoot = path.resolve(__dirname, '../..');

// babel-register (makes sure that src/* files get babeled upon require)
const babelRegisterOptions = {
  ...defaultBabelOptions,
  sourceMaps: 'inline',
  sourceRoot: DbuxRoot,
  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath) {
      let include = modulePath.match(/((@dbux[\\/])|(dbux-.*?))src[\\/]/);
      if (include) {
        // throw new Error('x');
        // console.debug(`[dbux-cli] register-self include`, modulePath);
        return false;
      }

      // include = !!modulePath.match(/(node_modules|dist)[\\/]/);
      return true;
    }
  ]
};


// eslint-disable-next-line import/newline-after-import,import/order
const babelRegister = require('@babel/register');

babelRegister(babelRegisterOptions);