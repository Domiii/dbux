import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';

/**
 * The Client endpoint is controlled by the Host endpoint.
 */
class ClientComponentEndpoint extends ComponentEndpoint {
  /**
   * The DOM element visually representing this component instance.
   */
  el;

  init() {
    this.el = this.initEl();
    if (this.parent && this.el) {
      // append as child to parent element
      this.parent.el.appendChild(this.el);
    }
  }
}

export default ClientComponentEndpoint;