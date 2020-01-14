import fsPath from 'path';
import errorWrapVisitor from '../helpers/errorWrapVisitor';

import functionVisitor from './functionVisitor';
import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import injectDbuxState from '../dbuxState';
import callExpressionVisitor from './callExpressionVisitor';
import awaitVisitor from './awaitVisitor';
import { buildAllTraceVisitors } from './traceVisitors';
import { mergeVisitors } from '../helpers/visitorHelpers';
import { logInternalError } from '../log/logger';
import TraceType from '../../../dbux-common/src/core/constants/TraceType';


// ###########################################################################
// Builders
// ###########################################################################

function buildProgramInit(path, { ids, genContextIdName }) {
  const {
    dbuxInit,
    dbuxRuntime,
    dbux
  } = ids;

  const contextIdName = genContextIdName(path);

  return buildSource(`
  const ${dbuxRuntime} = require('dbux-runtime').default;
  const ${dbux} = ${dbuxInit}(${dbuxRuntime});
  const ${contextIdName} = ${dbux}.getProgramContextId();
  `);
}

function buildProgramTail(path, state) {
  const {
    ids,
    fileName,
    filePath,
    staticContexts,
    traces
  } = state;
  const {
    dbuxInit,
    // dbuxRuntime
  } = ids;

  const staticData = {
    fileName,
    filePath,
    staticContexts,
    traces
  };

  const staticDataString = JSON.stringify(staticData, null, 4);

  return buildSource(`
function ${dbuxInit}(dbuxRuntime) {
  return dbuxRuntime.initProgram(${staticDataString});
}`);
}

function buildPopProgram(dbux) {
  return buildSource(`${dbux}.popProgram();`);
}

// ###########################################################################
// modification
// ###########################################################################

function addDbuxInitDeclaration(path, state) {
  path.pushContainer('body', buildProgramTail(path, state));
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

  // staticProgramContext
  const staticProgramContext = {
    type: 1, // {StaticContextType}
    name: 'Program',
    displayName: 'Program'
  };
  state.addStaticContext(path, staticProgramContext);
  state.addTrace(path, TraceType.PushImmediate);      // === 1
  state.addTrace(path, TraceType.PopImmediate);       // === 2

  // instrument Program itself
  wrapProgram(path, state);

  // merge all visitors
  const allVisitors = mergeVisitors(
    contextVisitors(),
    buildAllTraceVisitors()
  );

  // traverse program before (most) other plugins
  try {
    path.traverse(
      errorWrapVisitor(allVisitors),
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
  if (!state.onExit(path)) return;

  addDbuxInitDeclaration(path, state);
}


// ###########################################################################
// Traversal of everything inside of Program
// ###########################################################################

function contextVisitors() {
  return {
    Function: functionVisitor(),
    CallExpression: callExpressionVisitor(),
    AwaitExpression: awaitVisitor(),

    /**
     * TODO: Handle `for await of`
     * explanation: 
     *    `for await (const x of xs) { f(x); g(x); }` is like sugar of:
     *    `for (const (x = await _x) of (async xs)) { f(x); g(x); }`
     *    (it calls y[Symbol.asyncIterator]() instead of y[Symbol.iterator]())
     * @see https://www.codementor.io/@tiagolopesferreira/asynchronous-iterators-in-javascript-jl1yg8la1
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
     * @see https://github.com/babel/babel/issues/4969
     * @see https://babeljs.io/docs/en/babel-types#forofstatement
     */
    // ForOfStatement(path) {
    //   if (path.node.await) {
    //     // TODO....
    //   }
    // },


    /*
    more TODO:
    see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    see: https://stackoverflow.com/questions/2734025/is-javascript-guaranteed-to-be-single-threaded/2734311#2734311
    
    TODO: generator functions
 
 
    //instrumentOtherCallbacks(); // e.g.: event handlers, non-promisified libraries
    // big problem => sending objects into blackboxed modules that will call methods on them
    */
  };
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