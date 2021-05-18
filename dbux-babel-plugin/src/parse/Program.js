import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildSource, buildWrapTryFinally } from '../instrumentation/builders/common';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import { buildContextEndTrace } from '../instrumentation/context';
import { buildDbuxInit } from '../data/staticData';
import BaseNode from './BaseNode';


// ###########################################################################
// Builders
// ###########################################################################

function buildProgramInit(path, { ids, contexts: { genContextIdName } }) {
  const {
    dbuxInit,
    dbuxRuntime,
    dbux,
    aliases
  } = ids;

  const contextIdName = genContextIdName(path);

  // see https://babeljs.io/docs/en/babel-types#program
  // const { sourceType } = path.node;
  // console.log(path.fileName, sourceType);

  let importLine;
  // if (sourceType === 'module') {
  //   importLine = `import ${dbuxRuntime} from '@dbux/runtime';`;
  // }
  // else 
  importLine = `var ${dbuxRuntime} = typeof __dbux__ === 'undefined' ? require('@dbux/runtime') : __dbux__;`;

  return buildSource(`
  ${importLine}
  var ${dbux} = ${dbuxInit}(${dbuxRuntime});
  var ${contextIdName} = ${dbux}.getProgramContextId();
  ${Object.entries(aliases)
    .map(([dbuxProp, varName]) => `var ${varName} = ${dbux}.${dbuxProp}`)
    .join('; ')}
  `);
}

function buildPopProgram(dbux) {
  return buildSource(`${dbux}.popProgram();`);
}

function addDbuxInitDeclaration(path, state) {
  path.pushContainer('body', buildDbuxInit(state));
}

function wrapProgram(path, state) {
  const { ids: { dbux } } = state;
  const startCalls = buildProgramInit(path, state);
  const endCalls = buildPopProgram(dbux);

  const [
    importNodes,
    initVarDecl,
    bodyNodes,
    exportNodes
  ] = extractTopLevelDeclarations(path);

  // add `ContextEnd` trace
  bodyNodes.push(buildContextEndTrace(path, state));

  const programBody = [
    ...importNodes,     // imports first
    ...startCalls,
    ...initVarDecl,
    buildWrapTryFinally(bodyNodes, endCalls),
    ...exportNodes      // exports last
  ];
  replaceProgramBody(path, programBody);
}

export default class Program extends BaseNode {
  static children = [
    'StaticContext'
  ];

  enter() {
    const { path, state } = this;
    const {
      fileName,
      filePath,
    } = state;

    // debug(`babel-plugin: ${filePath}`);

    // staticProgramContext
    const staticProgramContext = {
      type: 1, // {StaticContextType}
      name: fileName,
      displayName: fileName,
      fileName,
      filePath,
    };
    
    /**
     * NOTE: push/pop context and traces is hardcoded into `ProgramMonitor`
     * Look for: `Program{Start,Stop}TraceId`
     */
    state.contexts.addStaticContext(path, staticProgramContext);

    state.traces.addTrace(path, TraceType.PushImmediate);      // === 1
    state.traces.addTrace(path, TraceType.PopImmediate);       // === 2
  }

  instrument() {
    const { path, state } = this;
    // instrument Program itself
    wrapProgram(path, state);

    // add `dbuxInit` code
    addDbuxInitDeclaration(path, state);
  }
}