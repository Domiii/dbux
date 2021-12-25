import { makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';

export default class ErrorNode extends BaseTreeViewNode {
  /**
   * @param {Trace} trace 
   * @param {*} parent 
   * @param {*} moreProps 
   */
  static makeLabel(trace/* , parent, moreProps */) {
    return `${makeTraceLabel(trace)} 🔥`;
  }
  
  get trace() {
    return this.entry;
  }
  
  makeIconPath() {
    return traceSelection.isSelected(this.trace) ? 'play.svg' : ' ';
  }

  handleClick = () => {
    if (this.trace) {
      traceSelection.selectTrace(this.trace);
    }
  }
}