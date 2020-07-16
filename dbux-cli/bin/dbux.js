const yargs = require('yargs');
const process = require('process');
const babelRegister = require('@babel/register');

process.env.BABEL_DISABLE_CACHE = 1;

// setup babel-register (could also use babel-node instead)
const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath) {
      const ignore = modulePath.match('(@dbux[\\/]cli)|(dbux-cli)[\\/]');
      console.debug(`[dbux-cli] babel ignore ${ignore}`);
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


// start!
yargs
  .commandDir('src/commands')
  .demandCommand()
  .help()
  .argv;