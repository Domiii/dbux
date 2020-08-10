import fs from 'fs';
import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { runInTerminalInteractive } from '../codeUtil/terminalUtil';


const logger = newLogger('DBUX run file');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

export async function runFile(extensionContext, nodeArgs) {
  const projectManager = getOrCreateProjectManager(extensionContext);
  if (projectManager.isInstallingSharedDependencies()) {
    logError('Busy installing. This happens on first run of the command after extension installation (or update). This might (or might not) take a few minutes.');
    return;
  }

  await projectManager.installDependencies();

  const activeEditor = window.activeTextEditor;

  let activePath = activeEditor?.document?.fileName;

  if (!activePath) {
    logError(`The open editor window is not a file.`);
    return;
  }

  let file;
  let cwd;
  try {
    file = fs.realpathSync(activePath);
    cwd = path.dirname(file);
  }
  catch (err) {
    logError(`Could not find file "${activePath}": ${err.message}`);
    return;
  }

  const dbuxBin = projectManager.getDbuxCliBinPath();
  const command = `node ${nodeArgs || ''} "${dbuxBin}" run "${file}"`;
  runInTerminalInteractive('dbux-run', cwd, command);
}