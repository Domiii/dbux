import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class ContextNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      context: {
        contextId
      }
    } = this.state;

    // get all children
    const dp = allApplications.getById(applicationId).dataProvider;
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    childContexts.forEach(childContext => {
      // create child context
      const {
        staticContextId
      } = childContext;
      const staticContext = dp.collections.staticContexts.getById(staticContextId);
      const {
        displayName
      } = staticContext;
      return this.children.createComponent(ContextNode, {
        applicationId,
        displayName,
        context: childContext
      });
    });
  }
}

export default ContextNode;