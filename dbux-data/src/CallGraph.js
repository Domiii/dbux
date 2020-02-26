export default class CallGraph {
  parentTraceIdByTraceId = [];

  constructor(dp) {
    this.dp = dp;

    dp._onDataInternal('contexts', this._postAddContexts);
    dp._onDataInternal('traces', this._postAddTraces);
  }

  _postAddContexts(contexts) {

  }

  _postAddTraces(traces) {

  }
}