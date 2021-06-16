import NanoEvents from 'nanoevents';
import TraceSelectionHistory from './TraceSelectionHistory';

export class TraceSelection {
  _emitter = new NanoEvents();
  selected = null;
  history = new TraceSelectionHistory();

  isSelected(trace) {
    return this.selected === trace;
  }

  selectTrace(trace, sender = null, nodeId = null) {
    this._setSelectTrace(trace, nodeId);
    this._emitSelectionChangedEvent(sender, nodeId);
  }

  _setSelectTrace(trace, nodeId) {
    this.selected = trace;
    this.nodeId = nodeId;
  }

  _emitSelectionChangedEvent(sender = null, args) {
    this._emitter.emit('selectionChanged', this.selected, sender, args);
  }

  onTraceSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const traceSelection = new TraceSelection();
export default traceSelection;