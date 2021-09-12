import getGlobal from '@dbux/common/src/getGlobal';
// import { enableLogRecording, playbackLogRecords } from '@dbux/common/src/log/logger';
import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';
import { getPromiseId } from './async/promisePatcher';


const dbux = {
  _r: RuntimeMonitor.instance,

  initProgram(staticProgramData, runtimeCfg) {
    this.runtimeCfg = runtimeCfg;
    return this._r.addProgram(staticProgramData, runtimeCfg);
  },

  incDisabled() {
    this._r.incDisabled();
  },

  decDisabled() {
    this._r.decDisabled();
  }
};

let __global__;

function registerDbuxAsGlobal() {
  /* eslint-disable no-var */
  __global__.__dbux__ = dbux;
}

/**
 * @type {import('./client/Client').default}
 */
let client;

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
    // eslint-disable-next-line no-console
    console.error('[dbux-runtime] Process exiting but not all data has been sent out. Analysis will be incomplete. ' +
      'This is probably because of a crash or `process.exit` was called manually.');
  }
  // else {
  //   console.trace('[Dbux Runtime] shutdown detected...');
  // }
  // console.log('playbackLogRecords');
  // playbackLogRecords();
}


/** ###########################################################################
 * main
 * ##########################################################################*/

(function main() {
  // enableLogRecording();

  __global__ = getGlobal();
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  client = dbux.client = initClient();

  // NOTE: we want to improve our chances that all data gets sent out before the process closes down.
  //    `process.exit` can disrupt that (kills without allowing us to perform another async handshake + `send`)
  // register `exit` handler that sends out a warning if there is unsent stuff
  if (__global__.process) {
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
      // if (processExit) {
      console.warn(`[Dbux Runtime] shutdown delayed (${reason})...`);
      // }
      shutdownDelayTimer = setInterval(() => {
        if (processExit) {
          console.warn('[Dbux Runtime] exiting now.');
          processExit.call(process, ...args);
        }
        else {
          // can't do much
        }
      }, shutdownDelayMs);
    }

    process.on('exit', handleShutdown);

    process.exit = (...args) => {
      console.trace(`[Dbux Runtime] process.exit(${args}) was called.`);
      delayShutdown('process.exit', ...args);
    };

    process.on('uncaughtException', async (err) => {
      console.error('[Dbux Runtime] uncaughtException detected. reason -', err);
      delayShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (err, promise) => {
      console.error(`[Dbux Runtime] unhandledRejection detected. reason - ${err?.stack || err}, promise: #${getPromiseId(promise)}`);
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

export default dbux;