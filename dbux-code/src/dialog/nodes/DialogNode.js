export default class DialogNode {
  /**
   * @param {Object} node object containing the data
   * @return {string|null} the name of next state(node), or null if stays at current state
   */
  static render(/* node */) {
    throw new Error('abstract method not implemented');
  }
}