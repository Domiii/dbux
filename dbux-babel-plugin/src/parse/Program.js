import TraceType from '@dbux/common/src/types/constants/TraceType';
import { buildSource, buildWrapTryFinally } from '../instrumentation/builders/common';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import { buildContextEndTrace } from '../instrumentation/context';
import { buildDbuxInit } from '../data/staticData';
import BaseNode from './BaseNode';
import { finishAllScopeBlocks } from '../instrumentation/scope';


/**
 * hackfix
 */
let lastProgramIndex = 0;

// ###########################################################################
// Builders
// ###########################################################################

function buildProgramInit(path, state) {
  const { ids, contexts: { genContextId } } = state;
  const {
    runtimeCfg,
    dbuxInit,
    dbux,
    aliases
  } = ids;

  const contextId = genContextId(path);

  // see https://babeljs.io/docs/en/babel-types#program
  // const { sourceType } = path.node;
  // console.log(path.fileName, sourceType);

  // future-work: only add referenced aliases
  const aliasesEntries = Object.entries(aliases);
  if (aliasesEntries.length !== new Set(Object.values(aliases)).size) {
    throw new Error(`Non-unique alias detected: ${Object.values(aliases).join(',')}`);
  }

  const globalName = runtimeCfg?.global || '__dbux__';

  return buildSource([
    // call `dbuxRuntime.initProgram(dbuxInstance)`
    `var ${dbux.name} = ${dbuxInit.name}(typeof ${globalName} !== 'undefined' && ${globalName} || require('@dbux/runtime'));`,
    `var ${contextId.name} = ${dbux.name}.getProgramContextId();`,
    `var ${aliasesEntries
      .map(([dbuxProp, varName]) => `${varName.name} = ${dbux.name}.${dbuxProp}`)
      .join(', ')};`
  ].join('\n'));
}

function buildPopProgram(dbux) {
  // TODO: add `awaitContextId`
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

    // this.logger.debug(`ENTER ${filePath}`);

    // staticProgramContext
    const staticProgramContext = this.staticProgramContext = {
      type: 1, // {StaticContextType}
      name: fileName,
      displayName: fileName,
      fileName,
      filePath,
      programIndex: ++lastProgramIndex
    };

    /**
     * NOTE: push/pop context and traces is hardcoded into `ProgramMonitor`
     *        -> Look for: `Program{Start,Stop}TraceId`
     * future-work: make sure, final `PopImmediate` has the highest `staticTraceId` of the program instead
     */
    state.contexts.addStaticContext(path, staticProgramContext);

    state.traces.addTrace(path, { type: TraceType.PushImmediate });      // === 1
    state.traces.addTrace(path, { type: TraceType.PopImmediate });       // === 2

    // TODO: async program contexts
    //    → call _fixContext with correct arguments (see Function#buildPop)!!
    //    → add async virtual contexts correctly

    // this.StaticContext.addInterruptableContextArgs(moreTraceCallArgs);
  }

  /**
   * NOTE: this is called last.
   */
  instrument() {
    const { path, state } = this;

    // hackfix: some final instrumentation
    finishAllScopeBlocks();

    // instrument Program itself
    wrapProgram(path, state);

    // add `dbuxInit` code
    addDbuxInitDeclaration(path, state);
  }
}