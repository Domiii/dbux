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
    if (this.state.hideBefore) {
      if (runNode.state.createdAt < this.state.hideBefore) {
        return this.hiddenBeforeNode;
      }
    }
    if (this.state.hideAfter) {
      if (runNode.state.createdAt > this.state.hideAfter) {
        return this.hiddenAfterNode;
      }
    }
    return null;
  }
}