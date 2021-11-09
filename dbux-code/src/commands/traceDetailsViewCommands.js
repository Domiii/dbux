import { newLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showInformationMessage } from '../codeUtil/codeModals';
import { nextMode } from '../traceDetailsView/nodes/ExecutionsTDNodes';
import { NavigationMethods } from '../traceDetailsView/nodes/NavigationNode';
import { translate } from '../lang';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Commands');

export function initTraceDetailsViewCommands(context, traceDetailsViewController) {
  registerCommand(context,
    'dbuxTraceDetailsView.nextGroupingMode',
    (/* node */) => {
      nextMode();
      traceDetailsViewController.refresh();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.expandNode',
    async (node) => {
      await node.treeNodeProvider.treeView.reveal(node, { select: false, expand: 2 });
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectObject',
    (node) => {
      node.selectObject();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.valueRender',
    (node) => {
      node.valueRender();
    }
  );

  for (let methodName of NavigationMethods) {
    registerCommand(context,
      `dbuxTraceDetailsView.navigation.${methodName}`,
      (navigationNode) => {
        navigationNode?.select(methodName);
      }
    );
  }

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor',
    traceDetailsViewController.selectTraceAtCursor
  );

  registerCommand(context,
    'dbuxTraceDetailsView.selectTraceAtCursor.empty',
    () => showInformationMessage(translate('noTrace'))
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.selectWriteTrace',
    (node) => {
      node.selectWriteTrace();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.selectValueCreation',
    (node) => {
      node.selectValueCreationTrace();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.selectForkParent',
    (node) => {
      node.selectForkParent();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.selectScheduler',
    (node) => {
      node.selectScheduler();
    }
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.showError',
    () => traceDetailsViewController.showError()
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.showError.disabled',
    () => showInformationMessage('No error occurred.')
  );

  registerCommand(context,
    'dbuxTraceDetailsView.node.editedWarning',
    async () => traceDetailsViewController.showEditedWarning()
  );
}