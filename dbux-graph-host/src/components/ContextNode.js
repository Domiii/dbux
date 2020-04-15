import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import TraceNode from './TraceNode';

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

    // get all child context
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    this.state.hasChildren = !!childContexts.length;
    childContexts.forEach(childContext => {
      // create child context
      return this.children.createComponent(ContextNode, {
        applicationId,
        context: childContext
      });
    });

    // get all traces
    const childTraces = dp.indexes.traces.byContext.get(contextId) || EmptyArray;
    childTraces.forEach(childTrace => {
      // create child trace
      return this.children.createComponent(TraceNode, {
        trace: childTrace
      });
    });
  }
}

export default ContextNode;