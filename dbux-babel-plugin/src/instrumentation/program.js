import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import * as t from '@babel/types';
import { extractTopLevelNodes } from '../helpers/astHelpers';

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
  const [
    importNodes,
    otherNodes,
    exportNodes
   ] = extractTopLevelNodes(bodyPath, bodyNodes);


  // console.log(!!bodyPath.replaceWith, bodyPath.length, bodyPath.toString());

  // console.log('Program.startCalls:', buildBlock(startCalls));

  const newProgramNode = t.cloneNode(path.node);
  const wrappedBody = buildWrapTryFinally(otherNodes, startCalls, endCalls);
  newProgramNode.body = [
    ...importNodes,   // imports first
    ...wrappedBody,
    ...exportNodes    // exports last
  ];
  path.replaceWith(newProgramNode);
}