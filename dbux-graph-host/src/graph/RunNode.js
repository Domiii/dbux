import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RunNode');

class RunNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      runId,
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;

    // add GraphNode
    this.controllers.createComponent('GraphNode');

    // add root context
    const firstContext = dp.util.getFirstContextOfRun(runId);
    if (firstContext) {
      this.children.createComponent(ContextNode, {
        applicationId,
        context: firstContext
      });
      this.state.createdAt = dp.util.getRunCreatedAt(runId);
      this.state.firstContextId = firstContext.contextId;
    }
    else {
      logError('Creating RunNode with no context');
    }

    const hiddenNodeManager = this.parent.controllers.getComponent('HiddenNodeManager');
    this.state.visible = hiddenNodeManager.shouldBeVisible(this);
    this.state.childrenAmount = this.getContextChildrenAmount();
  }

  isHiddenBy() {
    return this.hiddenNodeManager.getHiddenNodeHidingThis(this);
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  getContextChildrenAmount() {
    const { firstContextId, applicationId } = this.state;
    const dp = allApplications.getById(applicationId).dataProvider;
    return this.getContextChildrenAmountDFS(dp, firstContextId);
  }

  getContextChildrenAmountDFS(dp, contextId) {
    const childrens = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    let amount = childrens.length;
    childrens.forEach(childContext => amount += this.getContextChildrenAmountDFS(dp, childContext.contextId));
    return amount;
  }

  // ###########################################################################
  // shared
  // ###########################################################################

  shared() {
    return {
      context: {
        runNode: this
      }
    };
  }
}

export default RunNode;