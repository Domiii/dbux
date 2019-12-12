import RuntimeMonitor from './RuntimeMonitor';

const dbux = {
  trace: new RuntimeMonitor(),

  initProgram(staticProgramData) {
    return this.trace.addProgram(staticProgramData);
  }
};

export default dbux;