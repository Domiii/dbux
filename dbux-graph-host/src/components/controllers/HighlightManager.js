import NanoEvents from 'nanoevents';
import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';

export default class HighlightManager extends HostComponentEndpoint {
  init() {
    this.state.highlightAmount = 0;
    this.allHighlighter = new Set();
    this._emitter = new NanoEvents();
  }

  registHighlight(highlighter, newState) {
    if (newState === 1) this.allHighlighter.add(highlighter);
    else this.allHighlighter.delete(highlighter);

    this._highlighterUpdated(newState);
  }

  clear() {
    this.allHighlighter.forEach((highlighter) => highlighter.clear());
    this._emitter.emit('clear', this.allHighlighter);
  }

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }

  _highlighterUpdated(newState) {
    this.setState({
      highlightAmount: this.state.highlightAmount + newState
    });
  }

  clearDisposedHighlighter = () => {
    for (const highlighter of this.allHighlighter) {
      if (highlighter.isDisposed) this.allHighlighter.delete(highlighter);
    }
    this.setState({
      highlightAmount: this.allHighlighter.size
    });
  }
}