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
      // append element to DOM
      this.parent.el.appendChild(this.el);
    }
  }

  /**
   * Functions that are called by Host internally.
   */
  _internal = {
    addChild() {

    },
    remove() {
      if (this.parent) {
        // remove element from DOM
        this.el.parentNode.removeChild(this.el);
        this.el = null;
      }
    }
  };
}

export default ClientComponentEndpoint;