import getGlobal from '@dbux/common/src/getGlobal';
import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';
import wrapPromise from './wrapPromise';


const dbux = {
  _r: RuntimeMonitor.instance,

  initProgram(staticProgramData, runtimeCfg) {
    this.runtimeCfg = runtimeCfg;
    return this._r.addProgram(staticProgramData);
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

  client.tryFlush();

  if (!client.hasFlushed()) {
    // eslint-disable-next-line no-console
    console.error('[dbux-runtime] Process exiting but not all data has been sent out. Analysis will be incomplete. ' +
      'This is probably because of a crash or `process.exit` was called manually.');
  }
}

(function main() {
  __global__ = getGlobal();
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  client = initClient();

  // NOTE: we want to improve our chances that all data gets sent out before the process closes down.
  //    `process.exit` can disrupt that (kills without allowing us to perform another async handshake + `send`)
  // register `exit` handler that sends out a warning if there is unsent stuff
  __global__.process && __global__.process.on('exit', handleShutdown);

  // __global__.process && __global__.process.on('uncaughtException', async (err) => {
  //   console.error('uncaughtException', err);
  //   return new Promise(r => setTimeout(r, 500)).then(() => console.warn('hbgiiasd'));
  // });

  // if (__global__.process) {
  //   // handle `beforeExit`, `SIGTERM` and `SIGINT` separately
  //   // see: https://github.com/nodejs/node/issues/12359#issuecomment-293567749

  //   // NOTE: `exit` does not allow for async handlers
  //   // see: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
  //   [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  //     process.on(eventType, _onBeforeShutdown);
  //   });
  // }

  wrapPromise(RuntimeMonitor.instance);
})();

export default dbux;