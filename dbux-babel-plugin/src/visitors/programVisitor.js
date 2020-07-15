import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import injectDbuxState from '../dbuxState';
import { buildTraceVisitors as traceVisitors } from './traceVisitors';
import { mergeVisitors } from '../helpers/visitorHelpers';
import { logInternalError } from '../log/logger';
import errorWrapVisitor from '../helpers/errorWrapVisitor';
import { buildDbuxInit } from '../data/staticData';
import { injectContextEndTrace, buildContextEndTrace } from '../helpers/contextHelper';
import nameVisitors from './nameVisitors';


// ###########################################################################
// Builders
// ###########################################################################

function buildProgramInit(path, { ids, contexts: { genContextIdName } }) {
  const {
    dbuxInit,
    dbuxRuntime,
    dbux
  } = ids;

  const contextIdName = genContextIdName(path);

  return buildSource(`
  const ${dbuxRuntime} = require('dbux-runtime');
  const ${dbux} = ${dbuxInit}(${dbuxRuntime});
  const ${contextIdName} = ${dbux}.getProgramContextId();
  `);
}

function buildPopProgram(dbux) {
  return buildSource(`${dbux}.popProgram();`);
}

// ###########################################################################
// modification
// ###########################################################################

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

// ###########################################################################
// visitor
// ###########################################################################

function enter(path, state) {
  if (state.onEnter) return; // make sure to not visit Program node more than once
  // console.warn('P', path.toString());
  // console.warn(state.file.code);

  // inject data + methods that we are going to use for instrumentation
  injectDbuxState(path, state);

  // before starting instrumentation, first get raw data from unmodified AST
  const traceVisitorObj = traceVisitors();
  const nameVisitorObj = nameVisitors();
  traverse(path, state, nameVisitorObj);

  const {
    fileName,
    filePath,
  } = state;

  // staticProgramContext
  const staticProgramContext = {
    type: 1, // {StaticContextType}
    name: fileName,
    displayName: fileName,
    fileName,
    filePath,
  };
  state.contexts.addStaticContext(path, staticProgramContext);
  state.traces.addTrace(path, TraceType.PushImmediate, true);      // === 1
  state.traces.addTrace(path, TraceType.PopImmediate, true);       // === 2

  // instrument Program itself
  wrapProgram(path, state);

  // visitInOrder(path, state, contextVisitors());
  // visitInOrder(path, state, traceVisitors());

  traverse(path, state, traceVisitorObj);
}

function traverse(path, state, visitors) {
  // TODO: babel is unhappy with any DoWhileLoop visitor
  delete visitors.DoWhileLoop;

  // error wrap!
  visitors = errorWrapVisitor(visitors);

  // traverse program before (most) other plugins
  try {
    path.traverse(
      // errorWrapVisitor(allVisitors),
      visitors,
      state
    );
  }
  catch (err) {
    // hackfix: if we don't re-throw here, babel swallows the error for some reason
    // console.error(err);
    // throw new Error('traversal failed');
    logInternalError('traversal failed');
    throw err;
  }
}


// ########################################
// exit
// ########################################

function exit(path, state) {
  if (!state.onExit(path, 'program')) return;

  addDbuxInitDeclaration(path, state);
}

// ########################################
// programVisitor
// ########################################

export default function programVisitor() {
  return {
    // (1) Run this plugin before all other plugins
    enter, exit

    // (2) Run this plugin after all other plugins (possibly on es5)
    // exit(...args) {
    //   enter(...args);
    //   exit(...args);
    // }
  };
}