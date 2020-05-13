import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';

export default class HighlightManager extends HostComponentEndpoint {
  init() {
    this.state.highlightAmount = 0;
    this.owner.HighlightManager = this;
  }
  highlighterUpdated(highlight) {
    if (highlight.state.enabled > 0) {
      this.setState({
        highlightAmount: this.state.highlightAmount + 1
      });
    } else {
      this.setState({
        highlightAmount: this.state.highlightAmount - 1
      });
    }
  }
}