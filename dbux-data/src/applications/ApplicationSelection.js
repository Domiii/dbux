import ApplicationSet from './ApplicationSet';
import traceSelection from '../traceSelection/index';

export default class ApplicationSelection extends ApplicationSet {
  _notifyChanged() {
    let selectedTrace = traceSelection.selected;
    if (selectedTrace && !this.containsApplication(selectedTrace.applicationId)) {
      // specially handle traceSelection when deselecting app of selectedTrace
      traceSelection._setSelectTrace(null);
      super._notifyChanged();
      traceSelection._emitSelectionChangedEvent('ApplicationSelection');
    }
    else {
      super._notifyChanged();
    }
  }
}