const process = require('process');
const babelRegister = require('@babel/register');

// TODO: enable cache in production mode
process.env.BABEL_DISABLE_CACHE = 1;

const defaultBabelOptions = require('../babel.config');

// setup babel-register (could also use babel-node instead)
const babelRegisterOptions = {
  ...defaultBabelOptions,
  sourceMaps: 'inline',
  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath) {
      let ignore = !!modulePath.match(/(node_modules|dist)[\\/]/);
      if (ignore) {
        // console.debug(`[dbux-cli] babel ignore`, modulePath);
        return true;
      }

      ignore = !modulePath.match(/((@dbux[\\/])|(dbux\-.*?))src[\\/]/);
      // console.debug(`[dbux-cli] register-self include`, !ignore, modulePath);
      return ignore;
    }
  ]
};
babelRegister(babelRegisterOptions);