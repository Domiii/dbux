import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class Program extends BaseNode {
  static nodeNames = [
    'StaticContext'
  ];

  enter() {
    const { path, state } = this;
    const {
      fileName,
      filePath,
    } = state;

    // debug(`babel-plugin: ${filePath}`);

    // staticProgramContext
    const staticProgramContext = {
      type: 1, // {StaticContextType}
      name: fileName,
      displayName: fileName,
      fileName,
      filePath,
    };
    state.contexts.addStaticContext(path, staticProgramContext);
    state.traces.addTrace(path, TraceType.PushImmediate, true);      // === 1
    state.traces.addTrace(path, TraceType.PopImmediate, true);       // === 2
  }
}