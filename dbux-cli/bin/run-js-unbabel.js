#!/usr/bin/env node

/**
 * Run JS file without babel, but common dependencies properly taken care of.
 * @file
 */

const fs = require('fs');
const path = require('path');
const moduleAlias = require('module-alias');

const cliDir = __dirname + '/..';
const dbuxRoot = path.resolve(cliDir + '/..');

const dbuxAliases = [
  'dbux-runtime'
];

// add aliases (since these libraries are not locally available)
dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));


// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;


// go time!
if (!path.isAbsolute(file)) {
  file = path.join(cliDir, file);
}
require(file);