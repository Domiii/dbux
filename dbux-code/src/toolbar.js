import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commands/commandUtil';
import { CallGraphViewController } from './callGraphView/callGraphViewController';

const { log, debug, warn, error: logError } = newLogger('Toolbar');

export function initToolBar(context, callGraphViewController: CallGraphViewController) {

  registerCommand(context,
    'dbuxCallGraphView.addEntry',
    (...args) => log('Clicked on add entry, parameter', ...args)
  );

  registerCommand(context,
    'dbuxCallGraphView.next',
    () => callGraphViewController.gotoNextContext()
  );

  registerCommand(context,
    'dbuxCallGraphView.previous',
    () => callGraphViewController.gotoPreviousContext()
  );

  registerCommand(context,
    'dbuxCallGraphView.clear',
    () => {
      callGraphViewController.callGraphNodeProvider.clear();
      callGraphViewController.callGraphNodeProvider.refreshView();
    }
  );

}