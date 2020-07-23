#!/usr/bin/env node

const yargs = require('yargs');
const dbuxRunFile = require('../src/dbuxRunFile');


const {
  argv: {
    file
  }
} = yargs.command('$0 <file>');

dbuxRunFile(file);