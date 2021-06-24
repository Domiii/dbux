import path from 'path';
import { window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { realPathSyncNormalized } from '@dbux/common-node/src/util/pathUtil';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import { getOrCreateProjectManager } from '../projectViews/projectControl';
import { runInTerminalInteractive } from '../codeUtil/terminalUtil';
import { initRuntimeServer } from '../net/SocketServer';
import { installDbuxDependencies } from '../codeUtil/installUtil';
import { initProjectView } from '../projectViews/projectViewsController';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DBUX run file');

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

  // WARNING: For some reason, --enable-source-maps is very slow with Node@14.
  //          Good news: things are way better with Node@16.
  //          But with old Node, adding it when in debugger becomes unbearable (so we don't mix the two for now).
  //          Angular reported similar issues: https://github.com/angular/angular-cli/issues/5423

  let nodeArgs = config.get(`dbux.${runMode}.nodeArgs`) + ' --stack-trace-limit=1000';
  // nodeArgs += ' --enable-source-maps';
  nodeArgs += debugMode ? ' --inspect-brk' : '';

  let dbuxArgs = config.get(`dbux.${runMode}.dbuxArgs`) || '--esnext --verbose=1';
  let env = config.get(`dbux.${runMode}.env`);
  dbuxArgs += `${parseEnv(env)}`;

  let packageWhitelists = config.get(`dbux.packageWhitelist`) || '.*';
  if (packageWhitelists) dbuxArgs += ` --pw=${packageWhitelists}`;

  let programArgs = config.get(`dbux.${runMode}.programArgs`);
  if (programArgs) programArgs = ` ${programArgs}`;

  return [nodeArgs, dbuxArgs, programArgs];
}

export async function runFile(extensionContext, debugMode = false) {
  const projectViewsController = initProjectView();
  if (!await projectViewsController.confirmCancelPracticeSession()) {
    return;
  }

  const projectManager = getOrCreateProjectManager();

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
    file = realPathSyncNormalized(activePath);
    cwd = path.dirname(file);
  }
  catch (err) {
    logError(`Could not find file "${activePath}": ${err.message}`);
    return;
  }
  
  // // color query test (not relevant)
  // // const { uri } = activeEditor.document;
  // const colorInfos = await commands.executeCommand('vscode.executeDocumentColorProvider', 
  //   window.activeTextEditor.document.uri);
  // console.debug(`file colorInfos:`, colorInfos);


  // install dependencies
  await installDbuxDependencies();

  // start runtime server
  await initRuntimeServer(extensionContext);
  await checkSystem(projectManager, false, false);

  let [nodeArgs, dbuxArgs, programArgs] = getArgs(debugMode);
  nodeArgs = `${nodeArgs || ''}`;

  // go!
  const dbuxBin = projectManager.getDbuxCliBinPath();
  const command = `node ${nodeArgs} "${dbuxBin}" run ${dbuxArgs} "${file}" -- ${programArgs}`;
  await runInTerminalInteractive(cwd, command);
  // runInTerminal(cwd, `node /Users/domi/code/dbux/scripts/time-test.js spawn-child && sleep 30`);
  // runInTerminalInteractive('dbux-run', cwd, `node /Users/domi/code/dbux/scripts/time-test.js spawn-child`);
}
