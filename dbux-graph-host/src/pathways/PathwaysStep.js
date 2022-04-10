import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class PathwaysStep extends HostComponentEndpoint {
  get pdp() {
    return this.context.doc.pdp;
  }

  /**
   * NOTE: Step is a portion of state.
   */
  get step() {
    return this.state;
  }

  get firstTrace() {
    const { applicationId, firstTraceId } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider.util.getTrace(firstTraceId);
  }

  init() {
    // resolve additional data with `PathwaysView.makeStep`
    Object.assign(this.state, this.context.view.makeStep(this.step));
  }

  update() {
    // get timeSpent + staticContext info for step (label, loc)
  }

  public = {
    selectFirstTrace() {
      return traceSelection.selectTrace(this.firstTrace);
    },
  };
}

export default PathwaysStep;