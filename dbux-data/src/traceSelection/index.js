import NanoEvents from 'nanoevents';
import TraceSelectionHistory from './TraceSelectionHistory';

/** @typedef {import('../applications/allApplications').AllApplications} AllApplications */

/**
 * @type {AllApplications}
 */
let _allApplications;

export class TraceSelection {
  _emitter = new NanoEvents();
  selected = null;
  history = new TraceSelectionHistory();

  isSelected(trace, nodeId = null) {
    return this.selected === trace && (!nodeId || nodeId === this.nodeId);
  }

  selectTrace(trace, sender = null, nodeId = null) {
    if (!nodeId && trace) {
      // select its node by default
      if (trace.nodeId) {
        nodeId = trace.nodeId;
      }
      else {
        const { applicationId, traceId } = trace;
        const dp = _allApplications.getById(applicationId).dataProvider;
        const dataNode = dp.util.getDataNodeOfTrace(traceId);
        nodeId = dataNode?.nodeId || null;
      }
    }
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

export function initTraceSelection(allApplications) {
  _allApplications = allApplications;
}