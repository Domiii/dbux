import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';

export default class ContextNode extends BaseTreeViewNode {
  /**
   * @param {ExecutionContext} context
   */
  static makeLabel(context, parent, moreProps) {
    const app = allApplications.getById(moreProps.applicationId);
    return makeContextLabel(context, app);
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
      const dp = allApplications.getById(this.applicationId).dataProvider;
      const selectedContext = dp.collections.executionContexts.getById(selectedTrace.contextId);
      if (this.context === selectedContext) {
        return 'play.svg';
      }
    }
    return ' ';
  }

  handleClick = () => {
    if (!this.firstTrace) {
      const dp = allApplications.getById(this.applicationId).dataProvider;
      this.firstTrace = dp.util.getFirstTraceOfContext(this.context.contextId);
    }
    if (this.firstTrace) {
      traceSelection.selectTrace(this.firstTrace);
    }
  }
}