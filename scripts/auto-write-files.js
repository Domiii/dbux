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
function writeDirectoryIndex(dir, pred, ...moreArgs) {
  const parserDir = path.resolve(MonoRoot, dir).replace(/\\/g, '/');
  const indexFile = '_registry.js';
  writeFileRegistryFile(indexFile, parserDir, pred, ...moreArgs);
  console.log(`Generated ${dir}/${indexFile}.`);
}

function isCapitalized(s) {
  return s[0] === s[0].toUpperCase();
}

writeDirectoryIndex(
  'dbux-babel-plugin/src/parse',
  (name) => isCapitalized(name) && !!t['is' + name],
  `import { newLogger } from '@dbux/common/src/log/logger';`,
function init(Clazz) {
  Clazz.logger = newLogger(`parse/${Clazz.name}`);
}
);

writeDirectoryIndex('dbux-babel-plugin/src/parse/plugins', (name) => isCapitalized(name));