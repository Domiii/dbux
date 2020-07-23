import { isRealContextType } from '@dbux/common/src/core/constants/ExecutionContextType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeRootTraceLabel } from '@dbux/data/src/helpers/traceLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import ContextNode from './ContextNode';
import ErrorNode from './ErrorNode';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class CallRootNode extends BaseTreeViewNode {
  /**
   * @param {Trace} trace
   */
  static makeLabel(trace/* , parent, moreProps */) {
    return makeRootTraceLabel(trace, allApplications.getById(trace.applicationId));
  }

  buildChildren = (applicationId, runId, mode = 'context') => {
    let children;
    if (mode === 'context') {
      children = this.getAllContextChildren(applicationId, runId);
    }
    else if (mode === 'error') {
      children = this.getAllErrorChildren(applicationId, runId);
    }

    const filterString = this.treeNodeProvider.treeViewController.getFilterString();
    const filteredChildren = children.filter(x => x.label.includes(filterString));
    return filteredChildren;
  }

  getAllContextChildren(applicationId, runId) {
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
    return children;
  }

  getAllErrorChildren(applicationId, runId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const errors = dp.indexes.traces.errorByRun.get(runId) || EmptyArray;

    const children = [];
    for (let errorTrace of errors) {
      children.push(this.buildErrorNode(errorTrace));
    }
    return children;
  }

  buildContextNode = (context, applicationId) => {
    const props = { applicationId };
    return this.treeNodeProvider.buildNode(ContextNode, context, this, props);
  }

  buildErrorNode = (errorTrace) => {
    return this.treeNodeProvider.buildNode(ErrorNode, errorTrace, this);
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