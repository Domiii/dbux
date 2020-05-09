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
    this.manager.highlighterUpdated(this);
  }

  dec() {
    this.setState({
      enabled: this.state.enabled - 1
    });
    this.manager.highlighterUpdated(this);
  }
}