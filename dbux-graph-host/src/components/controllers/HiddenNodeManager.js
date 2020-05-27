import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';

export default class HiddenNodeManager extends HostComponentEndpoint {
  init() {
    this.hiddenRuns = new Set();
    this.hideNewMode = false;
  }

  // ###########################################################################
  // public
  // ###########################################################################

  show(applicationId, runId) {
    this._setVisible(applicationId, runId, true);
    this._updateHiddenNode();
  }

  hide(applicationId, runId) {
    this._setVisible(applicationId, runId, false);
    this._updateHiddenNode();
  }

  showAll() {
    for (const runNode of this.getAllRunNode()) {
      const { applicationId, runId } = runNode.state;
      this._setVisible(applicationId, runId, true);
    }
    this._updateHiddenNode();
  }

  hideAll() {
    for (const runNode of this.getAllRunNode()) {
      const { applicationId, runId } = runNode.state;
      this._setVisible(applicationId, runId, false);
    }
    this._updateHiddenNode();
  }

  setHideNewMode(mode) {
    this.hideNewMode = !!mode;
  }

  // ###########################################################################
  // private
  // ###########################################################################

  _setVisible(applicationId, runId, visible) {
    const runNode = this.owner.getRunNodeById(applicationId, runId);
    runNode.setState({ visible });
    if (visible) {
      this.hiddenRuns.delete(this.makeKey(applicationId, runId));
    }
    else {
      this.hiddenRuns.add(this.makeKey(applicationId, runId));
    }
  }

  _updateHiddenNode() {
    this.setState({ hiddenCount: this.hiddenRuns.size });
  }

  // ###########################################################################
  // util
  // ###########################################################################

  getAllRunNode() {
    return this.owner.getAllRunNode();
  }

  makeKey(applicationId, runId) {
    return `${applicationId}_${runId}`;
  }
}