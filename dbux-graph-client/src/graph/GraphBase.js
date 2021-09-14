import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

/**
 * Template class of `Graph`s, child of `GraphConatiner`
 */
class GraphBase extends ClientComponentEndpoint {
  get highlightManager() {
    return this.parent.controllers.getComponent('HighlightManager');
  }

  get focusController() {
    return this.parent.controllers.getComponent('FocusController');
  }
}
export default GraphBase;