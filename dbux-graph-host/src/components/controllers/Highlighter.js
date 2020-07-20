import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

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
      this.manager.registHighlight(this, +1);
    }
  }

  dec() {
    this.setState({
      enabled: this.state.enabled - 1
    });

    if (this.state.enabled === 0) {
      // freshly disabled
      this.manager.registHighlight(this, -1);
    }
  }

  clear() {
    if (this.state.enabled > 0) {
      this.manager.registHighlight(this, -1);
    }

    this.setState({
      enabled: 0
    });
  }

  public = {
    inc: this.inc,
    dec: this.dec
  }
}