import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import { ActivateNode } from './ActivateNode';

class PreActivateNodeProvider extends BaseTreeViewNodeProvider {
  /**
   * @param {import('vscode').ExtensionContext} context 
   */
  constructor() {
    super('dbuxPreActivateView');
  }

  buildRoots() {
    return [ActivateNode.instance];
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