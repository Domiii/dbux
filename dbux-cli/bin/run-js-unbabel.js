#!/usr/bin/env node
/* eslint-env node, es5 */

/**
 * Run JS file without babel, but common dependencies pre-loaded from dbux-cli/node_modules.
 * @file
 */

// const moduleAlias = require('module-alias');

// const cliDir = __dirname + '/..';
// const dbuxRoot = path.resolve(cliDir + '/..');

// // add aliases (since these libraries are not locally available)
const dbuxDeps = [
  '@dbux/runtime'
];
dbuxDeps.forEach(require);

// dbuxAliases.forEach(alias => moduleAlias.addAlias(alias, path.join(dbuxRoot, alias)));


// const mergeWith = require('lodash/mergeWith');
const argv = require('yargs')
  .command('$0 <file>')
  // .positional('file')
  .argv;
let { file } = argv;


// go time!
require(file);