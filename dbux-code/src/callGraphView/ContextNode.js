import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class ContextNode extends BaseTreeViewNode {
  static makeLabel(context: Trace, parent, moreProps) {
    const app = allApplications.getById(moreProps.applicationId);
    return makeContextLabel(context, app);
  }

  handleClick = () => {
    if (this.firstTrace) {
      traceSelection.selectTrace(this.firstTrace);
    }
  }
}