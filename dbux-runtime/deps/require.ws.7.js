/**
 * Makes `ws` Node v7 compatible.
 */

const { getDependencyRoot } = require('@dbux/cli/lib/dbux-folders');
const moduleAlias = require('module-alias');

const dependencyRoot = getDependencyRoot();

moduleAlias.addAlias('bufferutil', dependencyRoot + '/node_modules/bufferutil/fallback.js');
moduleAlias.addAlias('utf-8-validate', dependencyRoot + '/node_modules/utf-8-validate/fallback.js');
moduleAlias.addAlias('ws', '@dbux/runtime/dist/ws.7.js');
// moduleAlias.addAlias('ws', __dirname + '/dist/ws.js');

require('ws');