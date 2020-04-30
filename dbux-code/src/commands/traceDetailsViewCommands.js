import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { switchMode } from '../traceDetailsView/nodes/StaticTraceTDNodes';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTraceDetailsViewCommands(context, traceDetailsViewController) {
  registerCommand(context,
    'dbuxTraceDetailsView.switchGroupingMode',
    (node) => {
      switchMode();
      traceDetailsViewController.refresh();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor',
    traceDetailsViewController.selectTraceAtCursor
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor.empty',
    () => window.showInformationMessage('No traces at cursor.')
  );
}