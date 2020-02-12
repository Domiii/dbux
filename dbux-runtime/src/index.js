import RuntimeMonitor from './RuntimeMonitor';
import { initClient } from './client/index';

const dbux = {
  trace: RuntimeMonitor.instance,

  initProgram(staticProgramData) {
    return this.trace.addProgram(staticProgramData);
  }
};

function registerDbuxAsGlobal() {
  /* eslint-disable no-var */
  var _global = (function _getGlobal() {
    if (typeof window !== 'undefined') {
      return window;
    }
    else if (typeof global !== 'undefined') {
      return global;
    }
    else {
      return globalThis;
    }
  })();
  _global.__dbux = {
    thisIsDbux: true
  };
}

(function main() {
  registerDbuxAsGlobal();

  // NOTE: make sure to `initClient` right at the start, or else:
  // make sure that the client's `createdAt` will be smaller than any other `createdAt` in data set!
  initClient();
})();

export default dbux;