import BaseNode from './BaseNode';


export default class Block extends BaseNode {
  static children = [];
  //     // NOTE: don't change order of statements here. We first MUST build all new nodes
  //     //    before instrumenting the path (because instrumentation causes the path to lose information)
  //     const trace = buildTraceNoValue(path, state, TraceType.BlockStart);
  //     const traceEnd = buildTraceNoValue(path, state, TraceType.BlockEnd);

  //     path.insertBefore(trace);
  //     path.insertAfter(traceEnd);
  //     // if (!t.isBlockStatement(path)) {
  //     //   // make a new block

  //     // }
  //     // else {
  //     //   // insert at the top of existing block
  //     // }
}