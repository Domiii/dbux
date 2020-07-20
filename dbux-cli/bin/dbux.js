const yargs = require('yargs');
const process = require('process');
const babelRegister = require('@babel/register');
const setBlocking = require('set-blocking');

process.env.BABEL_DISABLE_CACHE = 1;

// setup babel-register (could also use babel-node instead)
const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath) {
      let ignore = !!modulePath.match(/(node_modules|dist)[\\/]/);
      if (ignore) {
        // console.debug(`[dbux-cli] babel include`, false, modulePath);
        return true;
      }

      ignore = !modulePath.match(/(@dbux[\\/]cli)|(dbux\-cli)[\\/]/);
      console.debug(`[dbux-cli] babel include`, !ignore, modulePath);
      return ignore;
    }
  ],
  sourceMaps: 'inline',
  presets: [
    "@babel/preset-env"
  ],
  // babelrcRoots: []
};
babelRegister(babelRegisterOptions);


// process && process.on('exit', (...args) => {
//   console.trace('exitteet');
//   debugger;
// });

// start!
yargs
  .exitProcess(false)
  .commandDir('../src/commands')
  .demandCommand()
  .help()
  .argv;