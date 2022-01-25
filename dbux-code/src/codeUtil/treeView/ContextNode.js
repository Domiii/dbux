import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNode from './BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

export default class ContextNode extends BaseTreeViewNode {
  /**
   * @param {ExecutionContext} context
   */
  static makeLabel(context, parent, moreProps) {
    const app = allApplications.getById(context.applicationId);
    return makeContextLabel(context, app);
  }

  get dp() {
    return allApplications.getById(this.entry.contextId).dataProvider;
  }

  get context() {
    return this.entry;
  }

  /**
   * Return icon name if context contains selectedTrace
   */
  makeIconPath() {
    const selectedTrace = traceSelection.selected;
    if (selectedTrace) {
      const dp = allApplications.getById(selectedTrace.applicationId).dataProvider;
      const selectedContext = dp.collections.executionContexts.getById(selectedTrace.contextId);
      if (this.context === selectedContext) {
        return 'play.svg';
      }
    }
    return ' ';
  }

  handleClick = () => {
    const { contextId } = this.context;
    const firstTrace = this.dp.util.getFirstTraceOfContext(contextId);
    traceSelection.selectTrace(firstTrace);
  }
}