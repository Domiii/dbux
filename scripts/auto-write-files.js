/* eslint no-console: 0 */

const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const t = require('@babel/types');
// const nodeExternals = require('webpack-node-externals');

// add some of our own good stuff
require('../dbux-cli/lib/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');
const { writeFileRegistryFile } = require('../dbux-common-node/src/util/codeGenUtil');

const MonoRoot = path.resolve(__dirname, '..');

// ###########################################################################
// write "file-registry files"
// ###########################################################################

// write parser registry
function writeDirectoryIndex(dir, pred) {
  const parserDir = path.resolve(MonoRoot, dir).replace(/\\/g, '/');
  const indexFile = 'index.js';
  writeFileRegistryFile(indexFile, parserDir, pred);
  console.log(`Generated ${dir}/${indexFile}.`);
}

writeDirectoryIndex('dbux-babel-plugin/src/parse', (name) => !!t['is' + name]);
writeDirectoryIndex('dbux-babel-plugin/src/parse/helpers');