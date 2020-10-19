import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class PathwaysStep extends HostComponentEndpoint {
  get firstTrace() {
    const { applicationId, firstTraceId } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider.util.getTrace(firstTraceId);
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