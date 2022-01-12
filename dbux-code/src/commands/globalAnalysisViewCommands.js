import { nextMode } from '../globalAnalysisView/nodes/GlobalModulesNode';
import { showInformationMessage } from '../codeUtil/codeModals';
import { registerCommand } from './commandUtil';

/** @typedef {import('../globalAnalysisView/GlobalAnalysisViewController').default} GlobalAnalysisViewController */

/**
 * @param {GlobalAnalysisViewController} globalAnalysisViewController 
 */
export function initGlobalAnalysisViewCommands(context, globalAnalysisViewController) {
  registerCommand(context,
    'dbuxGlobalAnalysisView.showError',
    async () => await globalAnalysisViewController.showError()
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
}