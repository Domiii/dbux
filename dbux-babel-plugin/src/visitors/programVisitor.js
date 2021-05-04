import TraceType from '@dbux/common/src/core/constants/TraceType';
import { newLogger } from '@dbux/common/src/log/logger';
import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import injectDbuxState from '../dbuxState';
import { buildTraceVisitors as traceVisitors } from './index';
import errorWrapVisitor from '../helpers/errorWrapVisitor';
import { buildDbuxInit } from '../data/staticData';
import { buildContextEndTrace } from '../helpers/contextHelper';
import nameVisitors, { clearNames } from './nameVisitors';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('programVisitor');


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
  ${Object.entries(aliases).map(([dbuxProp, varName]) => `var ${varName} = ${dbux}.${dbuxProp}`).join('; ')}
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

/**
 * 
 */
function enter(buildCfg, path, state) {
  // const cfg = state.opts;
  if (state.onEnter) return; // make sure to not visit Program node more than once
  // console.warn('P', path.toString());
  // console.warn(state.filename);
  // console.warn(state.file.code.substring(0, 100));

  // inject data + methods that we are going to use for instrumentation
  injectDbuxState(buildCfg, path, state);

  // before starting instrumentation, first get raw data from unmodified AST
  const nameVisitorObj = nameVisitors();
  const traceVisitorObj = traceVisitors();
  traverse(path, state, nameVisitorObj);

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
  // delete visitors.DoWhileLoop;

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
    logError('traversal failed:', err.message);
    throw err;
  }
}


// ########################################
// exit
// ########################################

function exit(path, state) {
  if (!state.onExit(path, 'program')) return;
  // try {
  //   global.gc();
  // } catch (e) {
  //   console.error("Could not run gc. Do: `node --expose-gc index.js`");
  //   process.exit();
  // }

  // actual process of transpilation
  state.stack.genAll();

  addDbuxInitDeclaration(path, state);

  // clean up on aisle 4 (prevent memory leaks)
  clearNames();
}

// ########################################
// programVisitor
// ########################################

export default function programVisitor(buildCfg) {
  return {
    // (1) Run this plugin before all other plugins
    enter: enter.bind(null, buildCfg),
    exit

    // (2) Run this plugin after all other plugins (possibly on es5)
    // exit(...args) {
    //   enter(...args);
    //   exit(...args);
    // }
  };
}