import BaseNode from './BaseNode';

export default class CallExpression extends BaseNode {
  static nodes = ['callee', 'arguments'];

  // TODO
  generate() {
    // TODO: static trace data
    // _callId = cfg?.callId || type === TraceType.BeforeCallExpression && _traceId;
    // _resultCallId = cfg?.resultCallId;
  }
}