import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';

export default class Highlighter extends HostComponentEndpoint {
  get manager() {
    return this.context.graphDocument.controllers.getComponent('HighlightManager');
  }

  init() {
    this.state.enabled = 0;
  }

  inc() {
    this.setState({
      enabled: this.state.enabled + 1
    });

    if (this.state.enabled === 1) {
      // freshly enabled
      this.manager.highlighterUpdated(+1);
    }
  }

  dec() {
    this.setState({
      enabled: this.state.enabled - 1
    });

    if (this.state.enabled === 0) {
      // freshly disabled
      this.manager.highlighterUpdated(-1);
    }
  }
  public = {
    inc: this.inc,
    dec: this.dec
  }
}