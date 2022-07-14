import { newLogger, playbackLogRecords } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import makeIgnore from '@dbux/common-node/src/filters/makeIgnore';
import errorWrapVisitor from '../helpers/errorWrapVisitor';
import { clearSourceHelperCache } from '../helpers/sourceHelpers';
import injectDbuxState from '../dbuxState';
import { buildVisitors as traceVisitors } from '../parseLib/visitors';
import Program from '../parse/Program';
import nameVisitors, { clearNames } from './nameVisitors';
import { finishAllScopeBlocks } from '../instrumentation/scope';

/** @typedef {import('@dbux/common-node/src/filters/moduleFilter').ModuleFilterOptions} ModuleFilterOptions */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('programVisitor');

// ###########################################################################
// visitor
// ###########################################################################

/**
 * 
 */
function enter(path, state) {
  const { opts: buildConfig, filename } = state;
  
  if (state.onEnter) return; // make sure to not visit Program node more than once
  
  if (!shouldInstrument(buildConfig, filename)) {
    // console.debug('[ignored] [Program]', state.filename, !!buildConfig?.ignore);
    return;
  }

  // NOTE: `warn(...)` is muted by CRA, for some reason
  // console.debug('[Program]', state.filename, !!buildConfig?.ignore);

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
    throw new NestedError(`traversal failed in file "${state.filePath}"`, err);
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
  state.stack.exit1(path, Program);

  // NOTE: `stop()` would also stop all other traversals
  // path.stop();

  // actual process of transpilation
  state.stack.genAll();

  // clean up -> prevent memory leaks
  clearNames();
  clearSourceHelperCache(state);

  // done!
  // playbackLogRecords();
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

/** ########################################
 * util
 *  ######################################*/

/**
 * Determine whether a file should be included depending on `ignore` option.
 * @param {{ignore?: function|[function], moduleFilter?: ModuleFilterOptions}} config 
 * @param {string} path 
 */
function shouldInstrument(config, path) {
  let { ignore, moduleFilter } = config;

  if (Array.isArray(ignore)) {
    ignore = [...ignore];
  }
  else if (ignore) {
    ignore = [ignore];
  }
  else {
    ignore = [];
  }

  if (moduleFilter) {
    if (!config._ignore) {
      config._ignore = makeIgnore(moduleFilter);
    }
    ignore.push(config._ignore);
  }

  for (const ignoreFunc of ignore) {
    if (ignoreFunc(path)) {
      return false;
    }
  }

  return true;
}