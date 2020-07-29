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
      let include = !modulePath.match(/((@dbux[\\/])|(dbux\\-.*?))src[\\/]/);
      if (include) {
        console.debug(`[dbux-cli] register-self include`, modulePath);
        return false;
      }

      include = !!modulePath.match(/(node_modules|dist)[\\/]/);
      // if (include) {
      //   // console.debug(`[dbux-cli] babel ignore`, modulePath);
      //   return false;
      // }
      return !include;
    }
  ]
};
babelRegister(babelRegisterOptions);