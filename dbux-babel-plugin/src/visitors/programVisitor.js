import fsPath from 'path';
import errorWrapVisitor from '../helpers/errorWrapVisitor';

import functionVisitor from './functionVisitor';
import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import * as t from '@babel/types';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import injectDbuxState from '../dbuxState';
import callExpressionVisitor from './callExpressionVisitor';
import awaitVisitor from './awaitVisitor';


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

function buildProgramTail(path, { ids, fileName, filePath, staticContexts }) {
  const {
    dbuxInit,
    // dbuxRuntime
  } = ids;

  const staticData = {
    fileName,
    filePath,
    staticContexts
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

  // instrument Program itself
  wrapProgram(path, state);

  // traverse program before (most) other plugins

  path.traverse(
    errorWrapVisitor(allOtherVisitors()), 
    state
  );
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

export function allOtherVisitors() {
  return {
    Function: functionVisitor(),
    CallExpression: callExpressionVisitor(),
    AwaitExpression: awaitVisitor(),
    // Statement: statementVisitor(),
    Expression: expressionVisitor()

    /**
     * TODO: Handle `for await of`
     * explanation: 
     *    `for await (const x of y) { x }` is like a sugar of:
     *    `for (const x of y) { await x }`
     *    (but call y[Symbol.asyncIterator]() instead of y[Symbol.iterator]())
     * @see https://github.com/babel/babel/issues/4969
     */
    // ForOfStatement(path) {
    //   if (path.node.await) {
    //     // TODO: instrumentAwait
    //   }
    // },


    /*
    more TODO:
    see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    see: https://stackoverflow.com/questions/2734025/is-javascript-guaranteed-to-be-single-threaded/2734311#2734311
 
    instrumentTimingEvents(); // setTimeout + setInterval + process.nextTick
    instrumentInterruptEvents(); // alert, confirm, prompt etc
    instrumentThenables(); // TODO: then, catch, finally, etc.. // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    generator functions
 
 
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