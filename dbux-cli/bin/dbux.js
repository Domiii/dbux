const yargs = require('yargs');
require('./_dbux-register-self');


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