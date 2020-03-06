const dbuxRunFile = require('../src/dbuxRunFile');


const {
  argv: {
    file
  }
} = require('yargs')
  .command('$0 <file>');

dbuxRunFile(file);