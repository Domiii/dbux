import NanoEvents from 'nanoevents';
import allApplications from '../applications/allApplications';

export class ObjectTracker {
  _emitter = new NanoEvents();
  selected = null;

  isSelected(trace) {
    return this.selected === trace;
  }

  /**
   * Given trace must have ValueRef and isObjectCategory, or will be ignored
   */
  selectTrace(trace, sender = null, args) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    if (dp.util.isTraceRealObject(traceId)) {
      this.selected = trace;
      this._emitter.emit('selectionChanged', trace, sender, args);
    }
  }

  onObjectSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const objectTracker = new ObjectTracker();
export default objectTracker;