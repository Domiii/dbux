import { buildSource, buildWrapTryFinally, buildBlock } from '../helpers/builders';
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

export function wrapProgramBody(path, state) {
  const { ids: { dbux } } = state;
  const contextId = path.scope.generateUid('contextId');
  const startCalls = buildProgramInit(path, state);
  const endCalls = buildPopProgram(contextId, dbux);
  
  const bodyPath = path.get('body');
  const bodyNodes = bodyPath.map(p => p.node);
  // console.log(!!bodyPath.replaceWith, bodyPath.length, bodyPath.toString());

  // console.log('Program.startCalls:', buildBlock(startCalls));

  const newProgramNode = t.cloneNode(path.node);
  newProgramNode.body = buildWrapTryFinally(bodyNodes, startCalls, endCalls);
  path.replaceWith(newProgramNode);
}