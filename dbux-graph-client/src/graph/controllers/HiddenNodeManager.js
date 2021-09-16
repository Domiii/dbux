import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

export default class HiddenNodeManager extends ClientComponentEndpoint {
  /**
   * Owner requirements:
   *  children `HiddenBeforeNode`
   *  children `HiddenAfterNode`
   */
  init() {
    // override to prevent creating DOM element
  }

  /**
   * @param {ContextNode} contextNode 
   */
  getHiddenNodeHidingThis(contextNode) {
    const { hideBefore, hideAfter } = this.context.graphDocument.state;
    const { createdAt } = contextNode.state.context;
    if (hideBefore && createdAt < hideBefore) {
      return this.hiddenBeforeNode;
    }
    if (hideAfter && createdAt > hideAfter) {
      return this.hiddenAfterNode;
    }
    return null;
  }
}