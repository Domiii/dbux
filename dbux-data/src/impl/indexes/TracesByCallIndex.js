import CollectionIndex from '../../indexes/CollectionIndex';

export default class TracesByCallIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byCall');
  }

  makeKey(dp, trace) {
    // Note: Now only makeKey by callId, so CallExpressionResult trace will not be included in the index.
    // Can't simply use trace.resultCallId to fix since a CER trace may also has a callId.
    return trace.callId || false;
  }
}