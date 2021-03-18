import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showInformationMessage } from '../codeUtil/codeModals'
import { CallGraphViewController } from '../callGraphView/callGraphViewController';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Commands');

/**
 * @param {CallGraphViewController} callGraphViewController 
 */
export function initCallGraphViewCommands(context, callGraphViewController) {
  registerCommand(context,
    'dbuxCallGraphView.setFilter',
    () => callGraphViewController.setFilter()
  );

  registerCommand(context,
    'dbuxCallGraphView.clearFilter',
    () => callGraphViewController.clearFilter()
  );

  registerCommand(context,
    'dbuxCallGraphView.showContext',
    () => callGraphViewController.showContext()
  );

  registerCommand(context,
    'dbuxCallGraphView.showError',
    () => callGraphViewController.showError()
  );

  registerCommand(context,
    'dbuxCallGraphView.showError.disabled',
    () => showInformationMessage('No error occurred.')
  );

  registerCommand(context,
    'dbuxCallGraphView.selectError',
    () => callGraphViewController.selectError()
  );
}