import CollectionIndex from '../../indexes/CollectionIndex';

export default class CallArgsByCallIndex extends CollectionIndex {
  constructor() {
    super('traces', 'callArgsByCall');
  }

  makeKey(dp, trace) {
    return trace.callId || false;
  }
}