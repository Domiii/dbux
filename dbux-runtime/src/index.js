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
      _global = window;
    }
    else if (typeof global !== 'undefined') {
      _global = global;
    }
    else {
      _global = globalThis;
    }
  })();
  _global._dbux = {
    thisIsDbux: true
  };
}

registerDbuxAsGlobal();

export default dbux;