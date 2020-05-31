import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';
import RunNode from '../RunNode';

export default class HiddenNodeManager extends HostComponentEndpoint {
  init() {
    this.state.hideBefore = null;
    this.state.hideAfter = null;

    this.owner.on('newNode', this._updateHiddenNode);
  }

  update() {
    for (const runNode of this.getAllRunNode()) {
      const { applicationId, runId } = runNode.state;
      const visible = this.shouldBeVisible(runNode);
      this._setVisible(applicationId, runId, visible);
      this._updateHiddenNode();
    }
  }

  // ###########################################################################
  // public
  // ###########################################################################

  showAll() {
    this.setState({ hideBefore: null, hideAfter: null });
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

  // ###########################################################################
  // private
  // ###########################################################################

  _setVisible(applicationId, runId, visible) {
    const runNode = this.owner.getRunNodeById(applicationId, runId);
    runNode.setState({ visible });
  }

  _updateHiddenNode = () => {
    const hiddenCount = this.getAllRunNode().filter(node => node.state.hidden).length;
    this.setState({ hiddenCount });
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

  makeKey(applicationId, runId) {
    return `${applicationId}_${runId}`;
  }
}