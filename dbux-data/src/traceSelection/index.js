import NanoEvents from 'nanoevents';
import TraceSelectionHistory from './TraceSelectionHistory';

export class TraceSelection {
  _emitter = new NanoEvents();
  selected = null;
  history = new TraceSelectionHistory();

  isSelected(trace) {
    return this.selected === trace;
  }

  selectTrace(trace, sender = null, args) {
    this.selected = trace;

    this._emitter.emit('selectionChanged', trace, sender, args);
  }

  onTraceSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const traceSelection = new TraceSelection();
export default traceSelection;