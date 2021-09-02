import NanoEvents from 'nanoevents';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
import RunNode from '../syncGraph/RunNode';

export default class HiddenNodeManager extends HostComponentEndpoint {
  init() {
    this._emitter = new NanoEvents();

    this.owner.on('newNode', this._notifyHiddenCountChanged);
    this.owner.on('refresh', this._notifyHiddenCountChanged);
  }

  update() {
    let changedFlag = false;
    for (const runNode of this.getAllRunNode()) {
      const visible = this.shouldBeVisible(runNode);
      const changed = this._setVisible(runNode, visible);
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

  shouldBeVisible(runNode) {
    const { hideBefore, hideAfter } = this.graphDocument.state;
    if (hideBefore) {
      if (runNode.state.createdAt < hideBefore) {
        return false;
      }
    }
    if (hideAfter) {
      if (runNode.state.createdAt > hideAfter) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {RunNode} runNode 
   */
  getHiddenNodeHidingThis(runNode) {
    const { hideBefore, hideAfter } = this.graphDocument.state;
    if (hideBefore && runNode.state.createdAt < hideBefore) {
      return this.hiddenBeforeNode;
    }
    if (hideAfter && runNode.state.createdAt > hideAfter) {
      return this.hiddenAfterNode;
    }
    return null;
  }

  // ###########################################################################
  // private
  // ###########################################################################

  _setVisible(runNode, visible) {
    if (runNode.state.visible !== visible) {
      runNode.setState({ visible });
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
    const { hideBefore, hideAfter } = this.graphDocument.state;
    let hideBeforeCount = 0;
    let hideAfterCount = 0;
    for (const runNode of this.getAllRunNode()) {
      // NOTE: if a node is hiddenBefore/After in the same time, only count as hiddenBefore
      if (hideBefore && runNode.state.createdAt < hideBefore) {
        hideBeforeCount += 1;
      }
      else if (hideAfter && runNode.state.createdAt > hideAfter) {
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

  // ###########################################################################
  // util
  // ###########################################################################

  /**
   * @return {RunNode[]}
   */
  getAllRunNode() {
    return this.owner.getAllRunNode();
  }
}