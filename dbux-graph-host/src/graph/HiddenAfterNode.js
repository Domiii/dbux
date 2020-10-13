import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class HiddenAfterNode extends HostComponentEndpoint {
  init() {
    this.controllers.createComponent('Highlighter');
    this.state.count = 0;

    this.hiddenNodeManager.onHiddenCountChanged(({ hideAfterCount }) => this.setState({ count: hideAfterCount }));
  }

  get hiddenNodeManager() {
    return this.parent.controllers.getComponent('HiddenNodeManager');
  }

  public = {
    hideAfter(time) {
      this.hiddenNodeManager.setState({ hideAfter: time });
    }
  }
}