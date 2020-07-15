import NanoEvents from 'nanoevents';
import allApplications from '../applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('ObjectTracker');

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
    if (trace) {
      const { applicationId, traceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      if (dp.util.isTraceTrackableValue(traceId)) {
        this.selected = trace;
      }
      else {
        logError('Tried to select trace with no trackable value');
        return;
      }
    }
    else {
      this.selected = null;
    }
    this._emitter.emit('selectionChanged', this.selected, sender, args);
  }

  onObjectSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const objectTracker = new ObjectTracker();
export default objectTracker;