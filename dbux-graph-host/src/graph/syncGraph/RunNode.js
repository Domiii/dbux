import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RunNode');

class RunNode extends HostComponentEndpoint {
  init() {
    // Add GraphNode to pass the `setChildMode` from graphRoot to ContextNode
    this.controllers.createComponent('GraphNode', {
      hasChildren: true,
      buttonDisabled: true
    });

    this.updateChildren();

    const hiddenNodeManager = this.parent.controllers.getComponent('HiddenNodeManager');
    this.state.visible = hiddenNodeManager ? hiddenNodeManager.shouldBeVisible(this) : true;
    // this.state.childrenAmount = this.nTreeContexts;
    // this.state.uniqueChildrenAmount = this.nTreeStaticContexts;
  }

  get dp() {
    const { applicationId } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider;
  }

  get rootContext() {
    const { runId } = this.state;
    return this.dp.util.getFirstContextOfRun(runId);
  }

  get rootContextId() {
    return this.rootContext.contextId;
  }

  hiddenByNode() {
    return this.hiddenNodeManager?.getHiddenNodeHidingThis(this);
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }
  get nTreeContexts() {
    const stats = this.dp.queries.statsByContext(this.rootContextId);
    return stats?.nTreeContexts || 0;
  }

  get nTreeStaticContexts() {
    const stats = this.dp.queries.statsByContext(this.rootContextId);
    return stats?.nTreeStaticContexts || 0;
  }
  //get amount of file call
  get nTreeFileCalled() {
    const state = this.dp.queries.statsByContext(this.rootContextId);
    return state?.nTreeFileCalled || 0;
  }
  // /**
  //  * TODO: move this to `dbux-data`
  //  */
  // get contextChildrenAmount() {
  //   const contextChildren = this.children.getComponents('ContextNode');
  //   let amount = contextChildren.length;
  //   contextChildren.forEach(childNode => amount += childNode.contextChildrenAmount);
  //   return amount;
  // }

  // /**
  //  * TODO: move this to `dbux-data`
  //  * 
  //  * "Repeated nodes", that is nodes of a context of the same `staticContextId`, will only be counted once.
  //  */
  // getNotRepeatedContextChildrenCount(n = this, prev = new Set()) {
  //   const contextChildren = n.children.getComponents('ContextNode');
  //   contextChildren.forEach((c) => {
  //     const { context: { staticContextId } } = c.state;
  //     prev.add(staticContextId);
  //     this.getNotRepeatedContextChildrenCount(c, prev);
  //   });
  //   return prev.size;
  // }

  /** ###########################################################################
   * Children
   *  #########################################################################*/

  updateChildren() {
    const {
      applicationId,
      runId,
      rootContextId,
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;

    // find root contexts
    let rootContexts;
    const allRootContexts = dp.indexes.executionContexts.roots.get(runId);
    if (rootContextId) {
      rootContexts = [dp.collections.executionContexts.getById(rootContextId)];
    }
    else if (allRootContexts?.length) {
      rootContexts = allRootContexts;
    }

    // build
    if (rootContexts) {
      this.rootContextNodes = rootContexts.map(context => this.context.graphRoot._maybeBuildContextNode(this, applicationId, context, true));
      this.state.createdAt = dp.util.getRunCreatedAt(runId);
    }
    else {
      logError(`Creating RunNode with no context - runId=${runId}`);
    }
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