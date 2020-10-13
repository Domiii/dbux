#!/usr/bin/env node

const yargs = require('yargs');

/**
 * 
 */


// process && process.on('exit', (...args) => {
//   console.trace('exitteet');
//   debugger;
// });

// start!
yargs
  // .exitProcess(true)
  .strict()
  .commandDir('../dist/commands')
  .demandCommand()
  .help()
  .argv;