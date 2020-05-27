import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';

const { log, debug, warn, error: logError } = newLogger('[RunNode]');

class RunNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      runId,
    } = this.state;

    // state.visible is managed by graphRoot.controllers.HiddenNodeManager
    // don't call setState({ visible: bool }) directly
    this.state.visible = !this.parent.controllers.getComponent('HiddenNodeManager').hideNewMode;

    const dp = allApplications.getById(applicationId).dataProvider;

    // add GraphNode
    this.controllers.createComponent('GraphNode');

    // add root context
    const contexts = dp.indexes.executionContexts.byRun.get(runId);
    if (contexts) {
      this.children.createComponent(ContextNode, {
        applicationId,
        context: contexts[0]
      });
    }
    else {
      logError('Creating RunNode with no context');
    }
  }
}

export default RunNode;