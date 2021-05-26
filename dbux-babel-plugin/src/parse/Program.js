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

function buildProgramInit(path, { ids, contexts: { genContextId } }) {
  const {
    dbuxInit,
    // dbuxRuntime,
    dbux,
    aliases
  } = ids;

  const contextId = genContextId(path);

  // see https://babeljs.io/docs/en/babel-types#program
  // const { sourceType } = path.node;
  // console.log(path.fileName, sourceType);

  // TODO: use template instead
  return buildSource([
    `var ${dbux.name} = ${dbuxInit.name}(typeof __dbux__ !== 'undefined' || require('@dbux/runtime'));`,
    `var ${contextId.name} = ${dbux.name}.getProgramContextId();`,
    `var ${Object.entries(aliases)
      .map(([dbuxProp, varName]) => `${varName.name} = ${dbux.name}.${dbuxProp}`)
      .join(', ')};`
  ].join('\n'));
}

function buildPopProgram(dbux) {
  // TODO: use template instead
  return buildSource(`${dbux.name}.popProgram();`);
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
  static plugins = [
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
     *        -> Look for: `Program{Start,Stop}TraceId`
     * TODO: make sure, final `PopImmediate` has the highest `staticTraceId` of the program instead
     */
    state.contexts.addStaticContext(path, staticProgramContext);

    state.traces.addTrace(path, { type: TraceType.PushImmediate });      // === 1
    state.traces.addTrace(path, { type: TraceType.PopImmediate });       // === 2
  }

  instrument() {
    const { path, state } = this;
    // instrument Program itself
    wrapProgram(path, state);

    // add `dbuxInit` code
    addDbuxInitDeclaration(path, state);
  }
}