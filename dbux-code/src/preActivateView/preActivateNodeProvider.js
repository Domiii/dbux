import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import ActivateNode from './ActivateNode';
import WorkshopNode from './WorkshopNode';

class PreActivateNodeProvider extends BaseTreeViewNodeProvider {
  /**
   * @param {import('vscode').ExtensionContext} context 
   */
  constructor() {
    super('dbuxPreActivateView');
  }

  buildRoots() {
    return [ActivateNode.instance, WorkshopNode.instance];
  }
}

let nodeProvider;

/**
 * 
 * @param {vscode.extens} context 
 */
export function initPreActivateView() {
  nodeProvider = new PreActivateNodeProvider();

  // refresh right away
  nodeProvider.refresh();

  return nodeProvider;
}