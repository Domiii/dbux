import { newLogger } from '@dbux/common/src/log/logger';
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
    }
    else {
      logError('Creating RunNode with no context');
    }

    const hiddenNodeManager = this.parent.controllers.getComponent('HiddenNodeManager');
    this.state.visible = hiddenNodeManager.shouldBeVisible(this);
    this.state.childrenAmount = this.contextChildrenAmount;
    this.state.uniqueChildrenAmount = this.getNotRepeatedContextChildrenCount();
  }

  isHiddenBy() {
    return this.hiddenNodeManager.getHiddenNodeHidingThis(this);
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  /**
   * TODO: move this to `dbux-data`
   */
  get contextChildrenAmount() {
    const contextChildren = this.children.getComponents('ContextNode');
    let amount = contextChildren.length;
    contextChildren.forEach(childNode => amount += childNode.contextChildrenAmount);
    return amount;
  }

  /**
   * TODO: move this to `dbux-data`
   * 
   * "Repeated nodes", that is nodes of a context of the same `staticContextId`, will only be counted once.
   */
  getNotRepeatedContextChildrenCount(n = this, prev = new Set()) {
    const contextChildren = n.children.getComponents('ContextNode');
    contextChildren.forEach((c) => {
      const { context: { staticContextId } } = c.state;
      prev.add(staticContextId);
      this.getNotRepeatedContextChildrenCount(c, prev);
    });
    return prev.size;
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