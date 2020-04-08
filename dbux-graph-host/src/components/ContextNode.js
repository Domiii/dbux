import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class ContextNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      context: {
        contextId,
        staticContextId
      }
    } = this.state;
    
    const dp = allApplications.getById(applicationId).dataProvider;

    // get name (and other needed data)
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const {
      displayName
    } = staticContext;
    this.state.displayName = displayName;

    // get all children
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    childContexts.forEach(childContext => {
      // create child context
      return this.children.createComponent(ContextNode, {
        applicationId,
        context: childContext
      });
    });
    this.state.hasChildren = !!childContexts.length;
  }
}

export default ContextNode;