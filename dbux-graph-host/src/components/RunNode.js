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

    const dp = allApplications.getById(applicationId).dataProvider;

    // add GraphNode
    this.controllers.createComponent('GraphNode');

    // register with root
    this.context.graphRoot._runNodeCreated(this);

    // add root context
    const contexts = dp.indexes.executionContexts.byRun.get(runId);
    if (contexts) {
      this.children.createComponent(ContextNode, {
        applicationId,
        context: contexts[0]
      });
      this.state.createdAt = dp.util.getRunCreatedAt(runId);
    }
    else {
      logError('Creating RunNode with no context');
    }

    const hiddenNodeManager = this.parent.controllers.getComponent('HiddenNodeManager');
    this.state.visible = hiddenNodeManager.shouldBeVisible(this);
  }
}

export default RunNode;