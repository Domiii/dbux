import { nextMode } from '../globalAnalysisView/nodes/GlobalModulesNode';
import { showInformationMessage } from '../codeUtil/codeModals';
import searchController from '../search/searchController';
import { emitTraceUserAction } from '../userActions';
import { registerCommand } from './commandUtil';

/** @typedef {import('../globalAnalysisView/GlobalAnalysisViewController').default} GlobalAnalysisViewController */

/**
 * @param {GlobalAnalysisViewController} globalAnalysisViewController 
 */
export function initGlobalAnalysisViewCommands(context, globalAnalysisViewController) {
  registerCommand(context,
    'dbuxGlobalAnalysisView.showError',
    async () => {
      const selectedNode = await globalAnalysisViewController.showError();
      if (selectedNode) {
        emitTraceUserAction(selectedNode.trace);
      }
    }
  );

  registerCommand(context,
    'dbuxGlobalAnalysisView.showError.disabled',
    () => showInformationMessage('No error occurred.')
  );

  registerCommand(context,
    'dbuxGlobalAnalysisView.node.nextSortMode',
    () => {
      nextMode();
      globalAnalysisViewController.refresh();
    }
  );

  registerCommand(context,
    'dbuxGlobalAnalysisView.node.nextSearchMode',
    () => {
      searchController.nextSearchMode();
    }
  );
}