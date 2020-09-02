/** @typedef {import('../GraphState').default} GraphState */

export default class DialogNode {
  /**
   * @param {GraphState} graphState state of dialog in graph
   * @return {string|null} the name of next state(node), or null if stays at current state
   */
  // eslint-disable-next-line no-unused-vars
  static render(graphState, node, defaultEdges) {
    throw new Error('abstract method not implemented');
  }
}