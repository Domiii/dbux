import fs from 'fs';
import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { runInTerminalInteractive } from '../codeUtil/terminalUtil';


const logger = newLogger('runFile');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

let runBusy = false;

export async function runFile(extensionContext, nodeArgs) {
  const projectManager = getOrCreateProjectManager(extensionContext);
  if (runBusy) {
    logError('Busy installing...');
    return;
  }
  runBusy = true;
  try {
    await projectManager.installDbuxDependencies();
  }
  finally {
    runBusy = false;
  }

  const activeEditor = window.activeTextEditor;

  let activePath = activeEditor?.document?.fileName;

  if (!activePath) {
    logError(`The open editor window is not a (JS) file.`);
    return;
  }

  let file;
  let cwd;
  try {
    file = fs.realpathSync(activePath);
    cwd = path.dirname(file);
  }
  catch (err) {
    logError(`Could not find open editor window's file "${activePath}": ${err.message}`);
    return;
  }

  const dbuxBin = projectManager.getDbuxCliBinPath();
  const command = `node ${nodeArgs || ''} "${dbuxBin}" run "${file}"`;
  runInTerminalInteractive('dbux-run', cwd, command);
}