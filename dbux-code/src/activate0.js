import { workspace, commands } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { initMemento, get as mementoGet, set as mementoSet } from './memento';
import { initInstallId } from './installId';
import { initLogging } from './logging';
import { initCodePath, setCodePathConfig } from './codeUtil/codePath';
import activate1 from './activate1';
import { initPreActivateView } from './preActivateView/preActivateNodeProvider';
import { registerCommand } from './commands/commandUtil';
import initLang from './lang';
import { getCurrentResearch } from './research/Research';

/** @typedef {import('./dialogs/dialogController').default} DialogController */

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
 * This will be called right after dbux has been activate and will call `doActivate` when needed.
 * 
 * @param {import('vscode').ExtensionContext} context
 */
export default async function activate0(context) {
  let autoStart;
  try {
    registerErrorHandler();

    initMemento(context);
    await initInstallId();
    initLogging();
    initCodePath(context);
    setCodePathConfig({
      exportDirectoryOverride: getCurrentResearch()?.getDataRootLfs()
    });

    await maybeSelectLanguage();
    await initLang(mementoGet('dbux.language'));

    // [debugging]
    // await dialogController.getDialog('survey1').clear();
    // await dialogController.getDialog('tutorial').clear();
    // await getOrCreateProjectManager(context).pathwayDataProvider.reset();

    commands.executeCommand('setContext', 'dbux.context.nodeEnv', process.env.NODE_ENV);
    commands.executeCommand('setContext', 'dbux.context.researchEnabled', !!process.env.RESEARCH_ENABLED);

    // the following should ensures `doActivate` will be called at least once
    autoStart = (process.env.NODE_ENV === 'development') ||
      workspace.getConfiguration('dbux').get('autoStart');
    if (autoStart) {
      await ensureActivate1(context);
    }
    else {
      initPreActivateView();
      initActivate1Command(context);
    }
  }
  catch (err) {
    logError(`DBUX activate FAILED (autoStart=${autoStart}) -`, err);
  }
  finally {
    // log(`DBUX `);
  }
}

async function doActivate1(context) {
  if (getActivatedState()) {
    throw new Error('Trying to activate Dbux twice');
  }

  // set state immediately to avoid called twice
  setActivatedState(true);
  await activate1(context);
}

async function ensureActivate1(context) {
  if (!getActivatedState()) {
    await doActivate1(context);
  }
}

/**
 * @param {import('vscode').ExtensionContext} context
 */
function initActivate1Command(context) {
  registerCommand(context, 'dbux.doActivate1', async () => ensureActivate1(context));
}

function registerErrorHandler() {
  // process.on('unhandledRejection', (reason, promise) => {
  //   logError(`[Unhandled Rejection] reason: ${reason}, promise: ${promise}`);
  //   // debugger;
  // });
}

async function maybeSelectLanguage() {
  const keyName = `dbux.language`;

  if (!mementoGet(keyName)) {
    // TODO: re-enable multi-language support, once we have a significant amount of messages translated
    // let lang = await showInformationMessage('Select a language for dbux', {
    //   en: () => 'en',
    //   zh: () => 'zh',
    // }, { modal: true });
    const lang = 'en';
    await mementoSet(keyName, lang);
  }
}
