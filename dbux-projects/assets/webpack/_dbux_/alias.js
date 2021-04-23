/**
 * Makes `ws` Node v7 compatible.
 */

const { getDependencyRoot } = require('@dbux/cli/lib/dbux-folders');
const moduleAlias = require('module-alias');

const dependencyRoot = getDependencyRoot();

moduleAlias.addAlias('webpack', dependencyRoot + '/node_modules/webpack');
moduleAlias.addAlias('webpack-cli', dependencyRoot + '/node_modules/webpack-cli');


// require('webpack');
// require('webpack-cli');