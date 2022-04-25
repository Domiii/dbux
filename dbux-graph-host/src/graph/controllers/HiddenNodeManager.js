import NanoEvents from 'nanoevents';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class HiddenNodeManager extends HostComponentEndpoint {
  init() {
    this._emitter = new NanoEvents();

    this.owner.on('newNode', this._notifyHiddenCountChanged);
    this.owner.on('refresh', this._notifyHiddenCountChanged);
  }

  update() {
    let changedFlag = false;
    for (const contextNode of this.getAllContextNodes()) {
      const visible = this.shouldBeVisible(contextNode);
      const changed = this._setVisible(contextNode, visible);
      changedFlag |= changed;
    }
    this._notifyHiddenCountChanged();

    if (changedFlag) {
      this.waitForUpdate()
        .then(() => this._notifyFocusController())
        .then(() => this._notifyStateChanged())
        .catch(err => this.logger.error(err));
    }
  }

  get hiddenBeforeNode() {
    return this.owner.children.getComponent('HiddenBeforeNode');
  }

  get hiddenAfterNode() {
    return this.owner.children.getComponent('HiddenAfterNode');
  }

  get graphDocument() {
    return this.context.graphDocument;
  }


  // ###########################################################################
  // public
  // ###########################################################################

  showAll() {
    this.graphDocument.setState({ hideBefore: false, hideAfter: false });
    this.forceUpdate();
  }

  hideBefore(time) {
    this.graphDocument.setState({ hideBefore: time });
    this.forceUpdate();
  }

  hideAfter(time) {
    this.graphDocument.setState({ hideAfter: time });
    this.forceUpdate();
  }

  shouldBeVisible(contextNode) {
    return !this.getHiddenNodeHidingThis(contextNode);
  }

  /**
   * @param {ContextNode} contextNode 
   */
  getHiddenNodeHidingThis(contextNode) {
    const { hideBefore, hideAfter } = this.graphDocument.state;
    const { createdAt } = contextNode.state.context;
    if (hideBefore && createdAt < hideBefore) {
      return this.hiddenBeforeNode;
    }
    if (hideAfter && createdAt > hideAfter) {
      return this.hiddenAfterNode;
    }
    return null;
  }

  // ###########################################################################
  // private
  // ###########################################################################

  _setVisible(contextNode, visible) {
    if (contextNode.state.visible !== visible) {
      contextNode.setState({ visible });
      return true;
    }
    else {
      return false;
    }
  }

  // ###########################################################################
  // own event
  // ###########################################################################

  _notifyFocusController = async () => {
    await this.context.graphContainer.focusController.handleTraceSelected();
  }

  _notifyStateChanged = () => {
    const { hideBefore, hideAfter } = this.graphDocument.state;
    this._emitter.emit('stateChanged', {
      hideBefore,
      hideAfter,
    });
  }

  onStateChanged(cb) {
    this._emitter.on('stateChanged', cb);
  }

  _notifyHiddenCountChanged = () => {
    let hideBeforeCount = 0;
    let hideAfterCount = 0;
    for (const contextNode of this.getAllContextNodes()) {
      // NOTE: if a node is hiddenBefore/After in the same time, only count as hiddenBefore
      const hiddenNode = this.getHiddenNodeHidingThis(contextNode);
      if (hiddenNode === this.hiddenBeforeNode) {
        hideBeforeCount += 1;
      }
      else if (hiddenNode === this.hiddenAfterNode) {
        hideAfterCount += 1;
      }
    }

    this._emitter.emit('countChanged', {
      hideBeforeCount,
      hideAfterCount
    });
  }

  onHiddenCountChanged(cb) {
    this._emitter.on('countChanged', cb);
  }

  getAllContextNodes() {
    return this.owner.getAllContextNodes();
  }
}