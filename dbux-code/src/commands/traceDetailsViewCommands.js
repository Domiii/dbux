import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { switchMode } from '../traceDetailsView/nodes/StaticTraceTDNodes';
import { NavigationMethods } from '../traceDetailsView/nodes/NavigationNode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTraceDetailsViewCommands(context, traceDetailsViewController) {
  registerCommand(context,
    'dbuxTraceDetailsView.switchGroupingMode',
    (node) => {
      switchMode();
      traceDetailsViewController.refresh();
    }
  );

  for (let methodName of NavigationMethods) {
    registerCommand(context,
      `dbuxTraceDetailsView.navigation.${methodName}`,
      (navigationNode) => {
        navigationNode.select(methodName);
      }
    );
  }

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor',
    traceDetailsViewController.selectTraceAtCursor
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor.empty',
    () => window.showInformationMessage('No traces at cursor.')
  );
}