import { workspace, commands } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { initMemento } from './memento';
import { initInstallId } from './installId';
import { initLogging } from './logging';
import { initResources } from './resources';
import { activate } from '.';
import { initPreActivateView } from './preActivateView/preActivateNodeProvider';
import { registerCommand } from './commands/commandUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

// ###########################################################################
// activate state management
// ###########################################################################

let dbuxActivated;
setActivatedState(false);

/**
 * Set dbux activate state
 * @param {boolean} value 
 */
function setActivatedState(value) {
  dbuxActivated = value;
  commands.executeCommand('setContext', 'dbux.context.activated', dbuxActivated);
}

export function getActivatedState() {
  return dbuxActivated;
}

// ###########################################################################
// pre-activate
// ###########################################################################

/**
 * This will be called right after dbux has been activate and will call `doActivate` when needed
 * @param {import('vscode').ExtensionContext} context
 */
export async function preActivate(context) {
  try {
    registerErrorHandler();

    initMemento(context);
    await initInstallId();
    initLogging();
    initResources(context);

    commands.executeCommand('setContext', 'dbux.context.nodeEnv', process.env.NODE_ENV);

    const autoStart = workspace.getConfiguration('dbux').get('autoStart');
    if (autoStart) {
      await doActivate(context);
    }
    else {
      // the following should ensure `doActivate` will be called exactly once
      initPreActivateView();
      initPreActivateCommand(context);
    }
  }
  catch (e) {
    logError('error in \'preActivate\'', e.stack);
    debugger;
    throw e;
  }
}

async function doActivate(context) {
  if (getActivatedState()) {
    return;
  }

  // set state immediately to avoid called twice
  setActivatedState(true);
  await activate(context);
}

/**
 * @param {import('vscode').ExtensionContext} context
 */
function initPreActivateCommand(context) {
  registerCommand(context, 'dbux.doActivate', () => doActivate(context));
}

function registerErrorHandler() {
  // process.on('unhandledRejection', (reason, promise) => {
  //   logError(`[Unhandled Rejection] reason: ${reason}, promise: ${promise}`);
  // });
}