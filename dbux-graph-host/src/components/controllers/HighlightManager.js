import NanoEvents from 'nanoevents';
import { makeDelayDebounce } from '@dbux/common/src/util/scheduling';
import { newLogger } from '@dbux/common/src/log/logger';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('HighlightManager');

export default class HighlightManager extends HostComponentEndpoint {
  init() {
    this.state.highlightAmount = 0;
    this.allHighlighter = new Set();
    this._emitter = new NanoEvents();
  }

  registHighlight(highlighter, newState) {
    if (newState === 1) this.allHighlighter.add(highlighter);
    else this.allHighlighter.delete(highlighter);

    this._highlighterUpdated();
  }

  clear() {
    this.allHighlighter.forEach((highlighter) => highlighter.clear());
    this._emitter.emit('clear', this.allHighlighter);
  }

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }

  _highlighterUpdated = makeDelayDebounce(() => {
    const size = this.allHighlighter.size();
    this.setState({
      highlightAmount: size
    });
    debug('size', size);
  }, 50);
}