import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';

const dbux = {
  trace: RuntimeMonitor.instance,

  initProgram(staticProgramData) {
    return this.trace.addProgram(staticProgramData);
  }
};

let __global__;

function registerDbuxAsGlobal() {
  /* eslint-disable no-var */
  __global__.__dbux = {
    thisIsDbux: true
  };
}

function _getGlobal() {
  if (typeof window !== 'undefined') {
    return window;
  }
  else if (typeof global !== 'undefined') {
    return global;
  }
  else {
    return globalThis;
  }
}


let client;
let didBeforeShutdown = false;
function _onBeforeShutdown(x) {
  console.warn('_onBeforeShutdown', x, didBeforeShutdown);
  if (didBeforeShutdown) {
    return;
  }

  didBeforeShutdown = true;
  client.flush();

  // give socket a short grace period
  setTimeout(() => {}, 200);
}

(function main() {
  __global__ = _getGlobal();
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  client = initClient();

  if (__global__.process) {
    // handle `beforeExit`, `SIGTERM` and `SIGINT` separately
    // see: https://github.com/nodejs/node/issues/12359#issuecomment-293567749

    // NOTE: `exit` does not allow for async handlers
    // see: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
    [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
      process.on(eventType, _onBeforeShutdown);
    });
  }
})();

export default dbux;