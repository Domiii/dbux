import isString from 'lodash/isString';
import getGlobal from '@dbux/common/src/getGlobal';
import { newLogger } from '@dbux/common/src/log/logger';
import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';
import { getPromiseId } from './async/promisePatcher';
import { _setDbuxInstance } from './getDbuxInstance';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('[@dbux/runtime]');


/**
 * @type {import('./client/Client').default}
 */
let client;

/** ###########################################################################
 * The (global) dbux instance.
 * ##########################################################################*/

const dbuxInstance = {
  _r: RuntimeMonitor.instance,

  get r() {
    return this._r;
  },

  initProgram(staticProgramData, runtimeCfg) {
    this.runtimeCfg = runtimeCfg;
    registerGlobal(runtimeCfg);
    return this._r.addProgram(staticProgramData, runtimeCfg);
  },

  incBusy() {
    this._r.incBusy();
  },

  decBusy() {
    this._r.decBusy();
  }
};


/** ###########################################################################
 * global management
 * ##########################################################################*/

let __global__;

function registerDbuxInstance() {
  // → register for local consumption
  _setDbuxInstance(dbuxInstance);

  const id = __global__.__dbux__id__ || 0;
  dbuxInstance.id = id;

  // eslint-disable-next-line camelcase
  __global__.__dbux__id__ = id + 1;

  // eslint-disable-next-line camelcase
  __global__.__dbux__all__ = __global__.__dbux__all__ || [];
  __global__.__dbux__all__[id] = {
    file: __filename
  };
}

function registerGlobal(runtimeCfg) {
  const globalName = runtimeCfg?.global || '__dbux__';
  // → register global instance

  if (!__global__[globalName]) {
    /* eslint-disable no-var */
    __global__[globalName] = dbuxInstance;
  }
  else if (__global__[globalName] !== dbuxInstance) {
    // eslint-disable-next-line max-len
    console.warn(`[@dbux/runtime] global "${globalName}" registered more than once - This is a bad edge cases where @dbux/runtime gets loaded more than once, but with the same global name. This is usually due to bad bundling or multiple copies of @dbux/runtime getting loaded from different places.`);
  }
}

/** ###########################################################################
 * {@link handleShutdown}
 * ##########################################################################*/

let _didShutdown = false;
function handleShutdown() {
  // eslint-disable-next-line no-console
  // console.debug('[dbux-runtime] process exiting...');
  if (_didShutdown) {
    // this can get triggered more than once (if registered to multiple different events)
    return;
  }
  _didShutdown = true;

  if (!client.hasFinished()) {
    // TODO: always show this message, even if not verbose?
    // eslint-disable-next-line no-console
    console.error('[dbux-runtime] Process exiting but not all data has been sent out. Analysis will be incomplete. ' +
      'This is probably because of a crash or because process.exit was called manually.');
  }
  // else {
  //   console.trace('shutdown detected...');
  // }
  // console.log('playbackLogRecords');
  // playbackLogRecords();
}


/** ###########################################################################
 * main
 * ##########################################################################*/

(function main() {
  __global__ = getGlobal();
  registerDbuxInstance();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  client = dbuxInstance.client = initClient();

  // NOTE: we want to improve our chances that all data gets sent out before the process closes down.
  //    `process.exit` can disrupt that (kills without allowing us to perform another async handshake + `send`)
  // register `exit` handler that sends out a warning if there is unsent stuff
  if (__global__.process?.exit) {
    /** ###########################################################################
     * shutdown, process.exit + shutdown delay logic
     * ##########################################################################*/

    const shutdownDelayMs = 60000;
    let errorTime;
    let shutdownDelayTimer;

    const processExit = process.exit;

    // eslint-disable-next-line no-inner-declarations
    function delayShutdown(reason, ...args) {
      if (shutdownDelayTimer) {
        return;
      }

      errorTime = Date.now();
      warn(`Dbux is trying to delay shutdown (${reason}) by ${shutdownDelayMs / 1000}s...`);

      shutdownDelayTimer = setInterval(() => {
        warn('exiting now.');
        processExit.call(process, ...args);
      }, shutdownDelayMs);
    }

    process.on('exit', handleShutdown);

    process.exit = (...args) => {
      logTrace(`NOTE: process.exit(${args}) was called by the application.`);
      delayShutdown('process.exit', ...args);
    };


    process.on('uncaughtException', async (err) => {
      logError(`uncaughtException detected. reason - ${err2String(err)}`);
      delayShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (err, promise) => {
      logError(`unhandledRejection detected. reason - ${err2String(err)}, promise: #${getPromiseId(promise)}`);
      delayShutdown('unhandledRejection');
    });
  }

  // if (__global__.process) {
  //   // handle `beforeExit`, `SIGTERM` and `SIGINT` separately
  //   // see: https://github.com/nodejs/node/issues/12359#issuecomment-293567749

  //   // NOTE: `exit` does not allow for async handlers
  //   // see: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
  //   [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  //     process.on(eventType, _onBeforeShutdown);
  //   });
  // }
})();


/** ###########################################################################
 * util
 * ##########################################################################*/

// eslint-disable-next-line no-inner-declarations
function err2String(err) {
  if (Array.isArray(err?.stack)) {
    /**
     * Stack is array of `CallSite`.
     * This is usually provided from the `Error.prepareStackTrace` hook.
     * NOTE: this is just a heuristic, since the stack trace can be arbitrarily customized.
     * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
     */
    return `${err.message}\n    ${err.stack.map(callSite2String).join('\n    ')}`;
  }
  return isString(err?.stack) && err.stack.includes(err.message) ?
    err.stack :
    err.toString();
}

/**
 * @param {CallSite}
 * 
 * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
 * @see https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_globals_d_.nodejs.callsite.html
 */
function callSite2String(callSite) {
  var file = callSite.getFileName() || '<anonymous>';
  var line = callSite.getLineNumber();
  var col = callSite.getColumnNumber();

  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file;
  }

  // site.callSite = callSite;
  const fname = callSite.getFunctionName();

  return `at ${fname} (${file}:${line}:${col})`;
}

/** ###########################################################################
 * export
 * ##########################################################################*/

export default dbuxInstance;
