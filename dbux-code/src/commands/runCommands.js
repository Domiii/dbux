import fs from 'fs';
import path from 'path';
import { window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { runInTerminalInteractive } from '../codeUtil/terminalUtil';
import { initRuntimeServer } from '../net/SocketServer';

const logger = newLogger('DBUX run file');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * Encode env to string format
 * @param {Object} env 
 */
function parseEnv(env) {
  let result = '';
  let first = true;
  for (let key in env) {
    if (!first) result += ',';
    result += `${key}=${env[key]}`;
    first = false;
  }
  return result ? ` --env=${result}` : '';
}

/**
 * Parse arguments from configuration based on `debugMode`
 * @param {boolean} debugMode 
 */
function getArgs(debugMode) {
  const runMode = debugMode ? 'debug' : 'run';
  const config = workspace.getConfiguration('');

  // WARNING: for some reason, --enable-source-maps is very slow with VSCode debugging recently. Adding it when in debugger becomes unbearable (so we don't mix the two for now).
  //          Must be a bug or misconfiguration somewhere.
  //          Angular has similar issues: https://github.com/angular/angular-cli/issues/5423

  let nodeArgs = config.get(`dbux.${runMode}.nodeArgs`);
  nodeArgs += debugMode ? ' --inspect-brk' : '';
  // nodeArgs += enableSourceMaps ? ' --enable-source-maps' : '';

  let dbuxArgs = config.get(`dbux.${runMode}.dbuxArgs`);
  let env = config.get(`dbux.${runMode}.env`);
  dbuxArgs += `${parseEnv(env)}`;

  let programArgs = config.get(`dbux.${runMode}.programArgs`);
  if (programArgs) programArgs = ` ${programArgs}`;

  return [nodeArgs, dbuxArgs, programArgs];
}

export async function runFile(extensionContext, debugMode = false) {
  const projectManager = getOrCreateProjectManager(extensionContext);
  if (projectManager.isInstallingSharedDependencies()) {
    logError('Busy installing. This happens on first run of the command after extension installation (or update). This might (or might not) take a few minutes.');
    return;
  }

  // resolve path
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
  
  // install dependencies
  if (!projectManager.hasInstalledSharedDependencies()) {
    await projectManager.installDependencies();
  }

  // start runtime server
  await initRuntimeServer(extensionContext);
  await checkSystem(projectManager, false, false);

  let [nodeArgs, dbuxArgs, programArgs] = getArgs(debugMode);
  nodeArgs = `${nodeArgs || ''}`;

  // go!
  const dbuxBin = projectManager.getDbuxCliBinPath();
  const command = `node ${nodeArgs} "${dbuxBin}" run ${dbuxArgs} "${file}" -- ${programArgs}`;
  runInTerminalInteractive('dbux-run', cwd, command);
}