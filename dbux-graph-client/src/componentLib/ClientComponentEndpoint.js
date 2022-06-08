import NestedError from '@dbux/common/src/NestedError';
import ComponentEndpoint from '@dbux/graph-common/src/componentLib/ComponentEndpoint';
import DOMWrapper from '../dom/DOMWrapper';
import ClientComponentList from './ClientComponentList';

// const Verbose = 1;
const Verbose = 0;

/**
 * The Client endpoint is controlled by the Host endpoint.
 * @extends ComponentEndpoint<ClientComponentEndpoint>
 */
class ClientComponentEndpoint extends ComponentEndpoint {
  /**
   * @type {HTMLElement}
   * The DOM element visually representing this component instance.
   */
  el;
  isInitialized;
  children = new ClientComponentList(this);
  controllers = new ClientComponentList(this);

  constructor() {
    super();
  }

  /**
   * @type {Object.<string, Element>}
   */
  get els() {
    return this.dom?.els;
  }

  /**
   * Use this to create the HTML node to represent this component.
   * 
   * @virtual
   */
  createEl() {
    this.logger.warn(this.debugTag, 'ClientComponentEndpoint did not implement `createEl`');
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
      throw new Error(`${this.debugTag} \`createEl\` must return a DOM element. If this component has no DOM, make sure to override \`init()\` instead.`);
    }

    // process DOM
    this.dom = new DOMWrapper(this);
    this.dom.init();

    // call event
    this.setupEl();
  }

  forceUpdate() {
    // tell host to update without a state change
    this._remoteInternal.forceUpdate();
  }

  setState(...args) {
    // tell host to setState
    this._remoteInternal.setState(...args);
  }

  async getClientResourceUri(...args) {
    return this._remoteInternal.getClientResourceUri(...args);
  }

  // ###########################################################################
  // private methods
  // ###########################################################################

  _build(componentManager, parent, componentId, initialState, clientProps) {
    // store client endpoint props
    Object.assign(this, clientProps);

    // build
    return super._build(componentManager, parent, componentId, initialState);
  }

  _performClientInit(role) {
    this._internalRoleName = role;
    if (this.owner) {
      const list = this.owner._getComponentListByRoleName(role);
      list._addComponent(this);
    }
    Verbose > 0 && this.logger.log('init started');
    this.init();
    Verbose > 0 && this.logger.log('init started');
    this.isInitialized = true;
  }

  _performUpdate() {
    try {
      Verbose > 0 && this.logger.log('update started');
      this.update();
      Verbose > 0 && this.logger.log('update finished');
    }
    catch (err) {
      this.logger.warn('Component update failed', err);
      throw err;
    }
  }

  // _updateContext = (context) => {
  //   this.context = {
  //     ...this.context,
  //     ...context
  //   };
  //   this._performUpdate();
  //   for (const child of this.children) {
  //     child._updateContext(context);
  //   }
  // }

  // ###########################################################################
  // render utilities
  // ###########################################################################

  /**
   */
  _repaint = () => {
    this.dom.repaint();
  }

  dispose() {
    super.dispose();

    this.dom?.remove();

    if (this.owner) {
      const list = this.owner._getComponentListByRoleName(this._internalRoleName);
      list._removeComponent(this);
    }
  }

  // ###########################################################################
  // internally used remote commands
  // ###########################################################################

  /**
   * Functions that are called by Host internally.
   */
  _publicInternal = {
    updateClient(stateDelta, stateOps) {
      try {
        this._updateState(stateDelta, stateOps);
        this._performUpdate();
      }
      catch (err) {
        throw new NestedError(`Update failed in "${this.debugTag}"`, err);
      }
    },
    updateContext: this._updateContext,

    dispose: this.dispose.bind(this)
  };

  toString() {
    return this.componentName;
  }
}

export default ClientComponentEndpoint;