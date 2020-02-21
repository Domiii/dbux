import NanoEvents from 'nanoevents';
import TraceSelectionHistory from './TraceSelectionHistory';

export class TraceSelection {
  _emitter = new NanoEvents();
  selected = null;
  history = new TraceSelectionHistory();

  isSelected(trace) {
    return this.selected === trace;
  }

  selectTrace(selected) {
    this.selected = selected;

    this._emitter.emit('selectionChanged', selected);
  }

  onTraceSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const traceSelection = new TraceSelection();
export default traceSelection;