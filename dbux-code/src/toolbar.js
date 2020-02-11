import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commands/commandUtil';
import { TreeViewController } from './treeView/treeViewController';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initToolBar(context, treeViewController: TreeViewController) {

  registerCommand(context,
    'dbuxContextView.addEntry',
    (...args) => log('Clicked on add entry, parameter', ...args)
  );

  registerCommand(context,
    'dbuxContextView.next',
    () => treeViewController.next()
  );

  registerCommand(context,
    'dbuxContextView.previous',
    () => treeViewController.previous()
  );

  registerCommand(context,
    'dbuxContextView.clear',
    () => {
      // treeViewController.treeDataProvider.dataProvider.clear();
      treeViewController.treeDataProvider.clear();
      treeViewController.treeDataProvider.refresh();
    }
  );

}