import isFunction from 'lodash/isFunction';
import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';
import DOMWrapper from '@/dom/DOMWrapper';
import { collectElementsByDataAttr } from '@/util/domUtil';

/**
 * The Client endpoint is controlled by the Host endpoint.
 */
class ClientComponentEndpoint extends ComponentEndpoint {
  /**
   * The DOM element visually representing this component instance.
   */
  el;
  isInitialized;
  dom = new DOMWrapper(this);

  constructor() {
    super();
  }

  get els() {
    return this.dom.els;
  }

  /**
   * Use this to create the HTML node to represent this component.
   * 
   * @virtual
   */
  createEl() {
    this.logger.warn('ClientComponentEndpoint did not implement `createEl`');
  }

  /**
   * Use this to process your HTML node, at the end of the initialization phase.
   * 
   * @virtual
   */
  setupEl() {
  }

  init() {
    this.el = this.createEl();

    if (!this.el) {
      return;
    }

    // process DOM
    this.dom.process();

    // call event
    this.setupEl();
  }

  forceUpdate() {
    // tell host to update without a state change
    this._remoteInternal.forceUpdate();
  }

  // ###########################################################################
  // private methods
  // ###########################################################################

  async _performInit() {
    await this.init();
    this.isInitialized = true;
  }

  async _performUpdate() {
    try {
      await this.update();
    }
    catch (err) {
      this.logger.error('Component update failed', err);
    }
  }

  // ###########################################################################
  // render utilities
  // ###########################################################################

  /**
   */
  _repaint = () => {
    this.dom.repaint();
  }

  // ###########################################################################
  // internally used remote commands
  // ###########################################################################

  /**
   * Functions that are called by Host internally.
   */
  _publicInternal = {
    async updateClient(state) {
      this.state = state;
      await this._performUpdate();
    },

    dispose() {
      if (this.el?.parentNode) {
        // remove element from DOM
        this.el.parentNode.removeChild(this.el);
        this.el = null;
      }
    }
  };

  toString() {
    return this.componentName;
  }
}

export default ClientComponentEndpoint;