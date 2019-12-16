import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import groupBy from 'lodash/groupBy';
import * as t from '@babel/types';

export function addDbuxInitDeclaration(path, state) {
  path.pushContainer('body', buildProgramTail(path, state));
}


function buildProgramInit(path, { ids }) {
  const {
    dbuxInit,
    dbuxRuntime,
    dbux
  } = ids;

  return buildSource(`
  const ${dbuxRuntime} = require('dbux-runtime');
  const ${dbux} = ${dbuxInit}(${dbuxRuntime});
  `);
}

function buildProgramTail(path, { ids, filename, staticSites }) {
  const {
    dbuxInit,
    dbuxRuntime
  } = ids;

  const config = {
    filename,
    staticSites
  };

  const configSource = JSON.stringify(config, null, 4);

  return buildSource(`
function ${dbuxInit}() {
  return ${dbuxRuntime}.initProgram(${configSource});
}`);
}

function buildPopProgram(contextId, dbux) {
  return buildSource(`${dbux}.popProgram(${contextId});`);
}

/**
 * For safety reasons, we always want to wrap all our code in
 */
function splitImports(nodes) {
  return groupBy(nodes, node => {
    if (t.isExportAllDeclaration(node) || t.isExportDeclaration(node)) {
      return 'exportNodes';
    }
    else if (t.isImportDeclaration(node)) {
      return 'importNodes';
    }
    return 'otherNodes';
  });
}

export function wrapProgramBody(path, state) {
  const { ids: { dbux } } = state;
  const contextId = path.scope.generateUid('contextId');
  const startCalls = buildProgramInit(path, state);
  const endCalls = buildPopProgram(contextId, dbux);
  
  const bodyPath = path.get('body');
  const bodyNodes = bodyPath.map(p => p.node);

  /**
   * Special magic: imports + exports cannot be inside of a try {} block.
   * Our solution:
   * 1. move all imports in front of the try {} block.
   * 2. find the id of all exports, then:
   * 2a. 
   */
  const {
    importNodes,
    otherNodes,
    exportNodes
  } = splitImports(bodyNodes);


  // console.log(!!bodyPath.replaceWith, bodyPath.length, bodyPath.toString());

  // console.log('Program.startCalls:', buildBlock(startCalls));

  const newProgramNode = t.cloneNode(path.node);
  const wrappedBody = buildWrapTryFinally(otherNodes, startCalls, endCalls);
  newProgramNode.body = [
    ...importNodes,
    ...wrappedBody
  ];
  path.replaceWith(newProgramNode);
}