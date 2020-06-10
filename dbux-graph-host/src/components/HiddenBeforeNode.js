import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class HiddenBeforeNode extends HostComponentEndpoint {
  init() {
    this.controllers.createComponent('Highlighter');
    this.state.count = 0;

    this.hiddenNodeManager.onHiddenCountChanged(({ hideBeforeCount }) => this.setState({ count: hideBeforeCount }));
  }

  get hiddenNodeManager() {
    return this.parent.controllers.getComponent('HiddenNodeManager');
  }

  public = {
    hideBefore(time) {
      this.hiddenNodeManager.setState({ hideBefore: time });
    }
  }
}