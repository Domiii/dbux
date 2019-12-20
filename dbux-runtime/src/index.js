import RuntimeMonitor from './RuntimeMonitor';

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
registerDbuxAsGlobal();

export default dbux;