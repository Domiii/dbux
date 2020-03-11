import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { switchMode } from '../traceDetailsView/nodes/StaticTraceTDNodes';

const { log, debug, warn, error: logError } = newLogger('Commands');

export default function initTraceDetailsViewCommands(context) {
  registerCommand(context,
    'dbuxTraceDetailsView.switchGroupingMode',
    (node) => switchMode()
  );
}