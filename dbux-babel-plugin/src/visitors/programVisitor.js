import { newLogger, playbackLogRecords } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import errorWrapVisitor from '../helpers/errorWrapVisitor';
import { clearSourceHelperCache } from '../helpers/sourceHelpers';
import injectDbuxState from '../dbuxState';
import { buildVisitors as traceVisitors } from '../parseLib/visitors';
import Program from '../parse/Program';
import shouldIgnore from '../external/shouldIgnore';
import nameVisitors, { clearNames } from './nameVisitors';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('programVisitor');


// ###########################################################################
// visitor
// ###########################################################################

/**
 * 
 */
function enter(path, state) {
  // const cfg = state.opts;
  if (state.onEnter) return; // make sure to not visit Program node more than once

  const { opts, filename } = state;
  if (!shouldInstrument(opts, filename)) {
    return;
  }

  // console.warn('P', path.toString());
  warn('[Program]', state.filename, opts.ignore);
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
 * @param {{ignore: function|[function]}} config 
 * @param {string} path 
 */
function shouldInstrument(config, path) {
  let { ignore, moduleFilterOptions } = config;

  if (moduleFilterOptions) {
    ignore = shouldIgnore(moduleFilterOptions);
  }

  if (ignore) {
    if (Array.isArray(ignore)) {
      for (const ignoreFunc of ignore) {
        if (ignoreFunc(path)) {
          return false;
        }
      }
    }
    else {
      if (ignore(path)) {
        return false;
      }
    }
  }

  return true;
}