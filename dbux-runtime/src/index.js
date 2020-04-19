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


(function main() {
  __global__ = _getGlobal();
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  const client = initClient();

  if (__global__.process) {
    // register `beforeExit` handler to make sure, the client can send all the good stuff
    process.on('beforeExit', () => {
      console.warn('beforeExit');
      client.flush();
    });
  }
})();

export default dbux;