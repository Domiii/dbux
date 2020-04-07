import EmptyArray from 'dbux-common/src/util/EmptyArray';
import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';

class RunNode extends HostComponentEndpoint {
  init() {
    const { applicationId, runId } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;
    const contexts = dp.indexes.executionContexts.byRun.get(runId) || EmptyArray;

    contexts.forEach(context => this.children.createComponent(ContextNode, { 
      applicationId,
      context
    }));
  }
}

export default RunNode;