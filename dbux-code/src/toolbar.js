import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commands/commandUtil';
import { ContextViewController } from './contextView/contextViewController';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initToolBar(context, contextViewController: ContextViewController) {

  registerCommand(context,
    'dbuxContextView.addEntry',
    (...args) => log('Clicked on add entry, parameter', ...args)
  );

  registerCommand(context,
    'dbuxContextView.next',
    () => contextViewController.gotoNextContext()
  );

  registerCommand(context,
    'dbuxContextView.previous',
    () => contextViewController.gotoPreviousContext()
  );

  registerCommand(context,
    'dbuxContextView.clear',
    () => {
      contextViewController.contextNodeProvider.clear();
      contextViewController.contextNodeProvider.refreshView();
    }
  );

}