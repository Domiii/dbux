import isString from 'lodash/isString';
import getGlobal from '@dbux/common/src/getGlobal';
import { newLogger } from '@dbux/common/src/log/logger';
import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';
import { getPromiseId } from './async/promisePatcher';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('[@dbux/runtime]');


/**
 * @type {import('./client/Client').default}
 */
let client;

/** ###########################################################################
 * The global __dbux__ object.
 * ##########################################################################*/

const dbux = {
  _r: RuntimeMonitor.instance,

  get r() {
    return this._r;
  },

  initProgram(staticProgramData, runtimeCfg) {
    this.runtimeCfg = runtimeCfg;
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

function registerDbuxAsGlobal() {
  if (__global__.__dbux__) {
    // TODO: add version checking?
    // eslint-disable-next-line no-console
    console.warn(`@dbux/runtime registered more than once - this could be a bundling deoptimization, or a serious conflict.`);
  }
  /* eslint-disable no-var */
  __global__.__dbux__ = dbux;
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
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  client = dbux.client = initClient();

  // NOTE: we want to improve our chances that all data gets sent out before the process closes down.
  //    `process.exit` can disrupt that (kills without allowing us to perform another async handshake + `send`)
  // register `exit` handler that sends out a warning if there is unsent stuff
  if (__global__.process?.exit) {
    /** ###########################################################################
     * shutdown, process.exit + shutdown delay logic
     * ##########################################################################*/

    const shutdownDelayMs = 10000;
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

export default dbux;
