import { isRealContextType } from 'dbux-common/src/core/constants/ExecutionContextType';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeRootTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import ContextNode from './ContextNode';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class CallRootNode extends BaseTreeViewNode {
  static makeLabel(trace: Trace, parent, moreProps) {
    return makeRootTraceLabel(trace, allApplications.getById(trace.applicationId));
  }
  
  buildChildren = (applicationId, runId) => {
    const dp = allApplications.getById(applicationId).dataProvider;
    const childContexts = dp.indexes.executionContexts.byRun.get(runId) || EmptyArray;

    const addedContext = new Set();
    const children = [];
    for (let context of childContexts) {
      const { staticContextId, contextType } = context;
      if (addedContext.has(staticContextId)) {
        // already added
        continue;
      }
      if (!isRealContextType(contextType)) {
        // do not show virtual context
        continue;
      }
      addedContext.add(staticContextId);
      children.push(this.buildContextNode(context, applicationId));
    }
    
    const filterString = this.treeNodeProvider.treeViewController.getFilterString();
    
    const filteredChildren = children.filter(x => x.label.includes(filterString));

    return filteredChildren;
  }
  
  buildContextNode = (context, applicationId) => {
    const dp = allApplications.getById(applicationId).dataProvider;
    const firstTrace = dp.util.getFirstTraceOfContext(context.contextId);
    const props = { firstTrace, applicationId };
    return this.treeNodeProvider.buildNode(ContextNode, context, this, props);
  }
  
  get trace() {
    return this.entry;
  }
  
  handleClick = () => {
    if (this.trace) {
      traceSelection.selectTrace(this.trace);
    }
  }
}