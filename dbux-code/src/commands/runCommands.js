import path from 'path';
import { window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathNormalizedForce, realPathSyncNormalized } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { checkSystem, getDefaultRequirement } from '@dbux/projects/src/checkSystem';
import { getProjectManager } from '../projectViews/projectControl';
import { runInTerminalInteractive } from '../codeUtil/terminalUtil';
import { initRuntimeServer } from '../net/SocketServer';
import { installDbuxDependencies } from '../codeUtil/installUtil';
import { initProjectView } from '../projectViews/projectViewsController';
import { getNodePath } from '../codeUtil/codePath';
import { emitRunFileAction } from '../userEvents';

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

/** ###########################################################################
 * {@link getNodeRunArgs}
 * ##########################################################################*/

/**
 * Parse arguments from configuration based on `debugMode`
 * @param {boolean} debugMode 
 */
function getNodeRunArgs(debugMode) {
  const runMode = debugMode ? 'debug' : 'run';
  const config = workspace.getConfiguration('');

  // WARNING: For some reason, --enable-source-maps is very slow with Node@14.
  //          Good news: things are way better with Node@16+.
  //          But with old Node, adding it when in debugger becomes unbearable (so we don't mix the two for now).
  //          Angular reported similar issues: https://github.com/angular/angular-cli/issues/5423
  //          In addition to being slow, sourcemaps can sometimes be inaccurate and make debugging more difficult as a result.

  let nodeArgs = config.get(`dbux.${runMode}.nodeArgs`) + ' --stack-trace-limit=1000';
  nodeArgs += ' --enable-source-maps';
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

/** ###########################################################################
 * {@link runFile}
 * ##########################################################################*/

export async function runFile(extensionContext, debugMode = false) {
  const projectViewsController = initProjectView();
  // if (!await projectViewsController.manager.exitPracticeSession()) {
  //   return;
  // }

  const projectManager = getProjectManager();

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
    file = pathNormalizedForce(realPathSyncNormalized(activePath));
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
  await checkSystem(projectManager, getDefaultRequirement(false), false);
  await initRuntimeServer(extensionContext);

  let [nodeArgs, dbuxArgs, programArgs] = getNodeRunArgs(debugMode);
  nodeArgs = `${nodeArgs || ''}`;

  nodeArgs += ` -r ${projectManager.getDbuxPath('@dbux/cli/dist/linkOwnDependencies.js')}`;

  // go!
  const dbuxBin = projectManager.getDbuxCliBinPath();
  const nodePath = getNodePath();
  const command = `"${nodePath}" ${nodeArgs} "${dbuxBin}" run ${dbuxArgs} "${file}" -- ${programArgs}`;
  allApplications.selection.clear();
  await runInTerminalInteractive(cwd, command);
  emitRunFileAction(file, debugMode);
  // runInTerminal(cwd, `node /Users/domi/code/dbux/scripts/time-test.js spawn-child && sleep 30`);
  // runInTerminalInteractive('dbux-run', cwd, `node /Users/domi/code/dbux/scripts/time-test.js spawn-child`);
}
