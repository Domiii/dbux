import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';

export default class HighlightManager extends HostComponentEndpoint {
  init() {
    this.state.highlightAmount = 0;
  }

  highlighterUpdated(newState) {
    this.setState({
      highlightAmount: this.state.highlightAmount + newState
    });
  }
}