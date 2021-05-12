import TraceType from '@dbux/common/src/core/constants/TraceType';
import { newLogger } from '@dbux/common/src/log/logger';
import { buildSource, buildWrapTryFinally } from '../helpers/builders';
import { extractTopLevelDeclarations } from '../helpers/topLevelHelpers';
import { replaceProgramBody } from '../helpers/program';
import errorWrapVisitor from '../helpers/errorWrapVisitor';
import { buildContextEndTrace } from '../helpers/contextHelper';
import injectDbuxState from '../dbuxState';
import { buildVisitors as traceVisitors } from '../parseLib/visitors';
import Program from '../parse/Program';
import { buildDbuxInit } from '../data/staticData';
import nameVisitors, { clearNames } from './nameVisitors';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('programVisitor');


// ###########################################################################
// visitor
// ###########################################################################

/**
 * 
 */
function enter(path, state) {
  // const cfg = state.opts;
  if (state.onEnter) return; // make sure to not visit Program node more than once
  // console.warn('P', path.toString());
  // console.warn(state.filename);
  // console.warn(state.file.code.substring(0, 100));

  // inject data + methods that we are going to use for instrumentation
  injectDbuxState(path, state);

  // before starting instrumentation, first get raw data from unmodified AST
  const nameVisitorObj = nameVisitors();
  traverse(path, state, nameVisitorObj);

  // hackfix: manually enter `Program`
  state.stack.enter(path, Program);

  // visitInOrder(path, state, contextVisitors());
  // visitInOrder(path, state, traceVisitors());
  const traceVisitorObj = traceVisitors();
  traverse(path, state, traceVisitorObj);

  exit(path, state);
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
  // if (!state.onExit(path, 'program')) return;
  // try {
  //   global.gc();
  // } catch (e) {
  //   console.error("Could not run gc. Do: `node --expose-gc index.js`");
  //   process.exit();
  // }

  // hackfix: manually exit `Program`
  state.stack.exit(path, Program);

  path.stop();

  // actual process of transpilation
  state.stack.genAll();

  // clean up on aisle 4 (prevent memory leaks)
  clearNames();
}

// ########################################
// programVisitor
// ########################################

export default function programVisitor(buildCfg) {
  return {
    // (1) Run this plugin before all other plugins
    enter,
    // exit
  };
}