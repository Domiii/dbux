import EmptyArray from 'dbux-common/src/util/EmptyArray';
import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';

class RunNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId, 
      runId
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;
    // const trace = dp.util.getFirstTraceOfRun();
    // contexts.forEach(context => this.children.createComponent(ContextNode, {
    //   applicationId,
    //   context
    // }));

    // // add GraphNode controller
    // this.controllers.createComponent('GraphNode', {
    //   isExpanded: false
    // });
    
    // add GraphNode
    this.controllers.createComponent('GraphNode', {
      // mode: GraphNodeMode.ExpandChildren
    });

    // add root context
    const contexts = dp.indexes.executionContexts.byRun.get(runId) || EmptyArray;
    const context = contexts[0];
    this.children.createComponent(ContextNode, {
      applicationId,
      context
    });
  }
}

export default RunNode;