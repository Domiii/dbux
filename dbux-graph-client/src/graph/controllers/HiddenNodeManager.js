import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

export default class HiddenNodeManager extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   *  children `HiddenBeforeNode`
   *  children `HiddenAfterNode`
   */
  init() {
    // override to prevent creating DOM element
  }

  /**
   * @param {RunNode} runNode 
   */
  getHiddenNodeHidingThis(runNode) {
    const { hideBefore, hideAfter } = this.context.graphDocument.state;
    if (hideBefore) {
      if (runNode.state.createdAt < hideBefore) {
        return this.hiddenBeforeNode;
      }
    }
    if (hideAfter) {
      if (runNode.state.createdAt > hideAfter) {
        return this.hiddenAfterNode;
      }
    }
    return null;
  }
}