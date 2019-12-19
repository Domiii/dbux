import { buildSource, buildWrapTryFinally, buildProgram } from '../helpers/builders';
import * as t from '@babel/types';
import { extractTopLevelNodes } from '../helpers/astHelpers';
import { replaceProgramBody } from '../helpers/modification';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';

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

function buildPopProgram(dbux) {
  return buildSource(`${dbux}.popProgram();`);
}


export function wrapProgram(path, state) {
  const { ids: { dbux } } = state;
  //const contextId = path.scope.generateUid('contextId');
  const startCalls = buildProgramInit(path, state);
  const endCalls = buildPopProgram(dbux);

  const [
    importNodes,
    initVarDecl,
    bodyNodes,
    exportNodes
  ] = extractTopLevelDeclarations(path);

  const programBody = [
    ...importNodes,     // imports first
    ...startCalls,
    initVarDecl,
    buildWrapTryFinally(bodyNodes, endCalls),
    ...exportNodes      // exports last
  ];
  replaceProgramBody(path, programBody);
}