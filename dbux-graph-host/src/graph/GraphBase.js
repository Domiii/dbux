import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/**
 * Template class of `Graph`s, child of `GraphConatiner`
 */
class GraphBase extends HostComponentEndpoint {
  handleRefresh() {
    throw new Error('abstract method not implemented');
  }

  clear() {
    throw new Error('abstract method not implemented');
  }

  shouldBeEnabled() {
    throw new Error('abstract method not implemented');
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get highlightManager() {
    return this.parent.getComponent('HighlightManager');
  }
}

export default GraphBase;