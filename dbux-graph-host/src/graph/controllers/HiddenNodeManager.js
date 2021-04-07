import NanoEvents from 'nanoevents';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
import RunNode from '../RunNode';

export default class HiddenNodeManager extends HostComponentEndpoint {
  init() {
    this.state.hideBefore = false;
    this.state.hideAfter = false;
    this._emitter = new NanoEvents();

    this.owner.on('newNode', this._notifyHiddenCountChanged);
    this.owner.on('refresh', this._notifyHiddenCountChanged);
  }

  update() {
    for (const runNode of this.getAllRunNode()) {
      const visible = this.shouldBeVisible(runNode);
      this._setVisible(runNode, visible);
    }
    this._notifyStateChanged();
    this._notifyHiddenCountChanged();
  }

  get hiddenBeforeNode() {
    return this.owner.children.getComponent('HiddenBeforeNode');
  }

  get hiddenAfterNode() {
    return this.owner.children.getComponent('HiddenAfterNode');
  }


  // ###########################################################################
  // public
  // ###########################################################################

  showAll() {
    this.setState({ hideBefore: false, hideAfter: false });
  }

  hideBefore(time) {
    this.setState({ hideBefore: time });
  }

  hideAfter(time) {
    this.setState({ hideAfter: time });
  }

  shouldBeVisible(runNode) {
    if (this.state.hideBefore) {
      if (runNode.state.createdAt < this.state.hideBefore) {
        return false;
      }
    }
    if (this.state.hideAfter) {
      if (runNode.state.createdAt > this.state.hideAfter) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {RunNode} runNode 
   */
  getHiddenNodeHidingThis(runNode) {
    const { hideBefore, hideAfter } = this.state;
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
    runNode.setState({ visible });
  }

  // ###########################################################################
  // own event
  // ###########################################################################

  _notifyStateChanged = () => {
    this._emitter.emit('stateChanged', {
      hideBefore: this.state.hideBefore,
      hideAfter: this.state.hideAfter
    });
  }

  onStateChanged(cb) {
    this._emitter.on('stateChanged', cb);
  }

  _notifyHiddenCountChanged = () => {
    const { hideBefore, hideAfter } = this.state;
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

    // remove hideBefore state if nothing is hidden e.g. while deselect hiddenNode
    if (!hideBeforeCount) {
      this.hideBefore(false);
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