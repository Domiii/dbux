import { env, Uri } from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { pathJoin, pathNormalized, pathNormalizedForce } from '@dbux/common-node/src/util/pathUtil';
import { initDbuxProjects } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage, showInformationMessage, confirm } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import { getResourcePath, getLogsDirectory, asAbsolutePath } from '../codeUtil/codePath';
import TerminalWrapper from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { interactiveGithubLogin } from '../net/GithubAuth';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { showBugIntroduction } from './BugIntroduction';
import { getStopwatch } from './practiceStopwatch';
import { initUserEvent } from '../userEvents';
import { initRuntimeServer } from '../net/SocketServer';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

const logger = newLogger('projectControl');
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/**
 * @type {ProjectsManager}
 */
let projectManager = null;

/**
 * @return {ProjectsManager}
 */
export function getProjectManager() {
  return projectManager;
}

export function createProjectManager(extensionContext) {
  // ########################################
  // cfg + externals
  // ########################################

  // the folder that is parent to `node_modules` for installing all extraneous dependencies (such as @dbux/cli, firebase etc.)
  let dependencyRoot = asAbsolutePath('.');     // extension_folder
  // let dependencyRoot = extensionContext.extensionPath;              // extension_folder
  const pathMatch = dependencyRoot.match(/(.+)[/\\](?:.+\.)?dbux-code(?:.*[/\\]?)?/);    // NOTE: in prod, folder name changes to "author.dbux-code-version"
  if (pathMatch) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line prefer-destructuring
      dependencyRoot = pathNormalizedForce(pathMatch[1]);
      if (dependencyRoot !== process.env.DBUX_ROOT) {
        throw new Error(`Path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})`);
      }
    }
    else {
      // production: dependencyRoot is the dbux-code folder itself
      // eslint-disable-next-line prefer-destructuring
      // dependencyRoot = pathMatch[0];
    }
  }

  // the folder that contains the sample projects for dbux-practice
  const projectsRoot = pathJoin(dependencyRoot, 'dbux_projects');
  const dbuxLanguage = storageGet(`dbux.language`);
  const stopwatch = getStopwatch();

  debug(`Initializing dbux-projects: projectsRoot = "${path.resolve(projectsRoot)}", dependencyRoot = "${path.resolve(dependencyRoot)}"`);

  const cfg = {
    dependencyRoot,
    projectsRoot,
    dbuxLanguage,
  };
  const externals = {
    editor: {
      async openFile(fpath) {
        return await showTextDocument(fpath);
      },
      async openFolder(fpath) {
        // TODO: use vscode API to add to workspace instead?
        await Process.exec(`code --add "${fpath}"`, { silent: false }, logger);
      },
      showTextInNewFile
    },
    storage: {
      get: storageGet,
      set: storageSet,
    },
    confirm,
    async alert(msg, modal = false) {
      await showInformationMessage(msg, undefined, { modal });
    },
    TerminalWrapper,
    resources: {
      getResourcePath,
      getLogsDirectory
    },
    showMessage: {
      info: showInformationMessage,
      warning: showWarningMessage,
    },
    stopwatch: {
      start: stopwatch.start.bind(stopwatch),
      pause: stopwatch.pause.bind(stopwatch),
      set: stopwatch.set.bind(stopwatch),
      show: stopwatch.show.bind(stopwatch),
      hide: stopwatch.hide.bind(stopwatch)
    },
    WebviewWrapper,
    showBugIntroduction,
    interactiveGithubLogin,
    openWebsite(url) {
      return env.openExternal(Uri.parse(url));
    },
    async initRuntimeServer() {
      return await initRuntimeServer(extensionContext);
    }
  };

  // ########################################
  //  init projectManager
  // ########################################
  projectManager = initDbuxProjects(cfg, externals);

  initUserEvent(projectManager);

  return projectManager;
}

export async function initProjectManager() {
  await runTaskWithProgressBar(async (progress) => {
    progress.report({ message: 'Initializing dbux-project...' });
    await projectManager.init();
    progress.report({ message: 'Recovering practice session...' });
    await projectManager.recoverPracticeSession();
  }, { cancellable: false });
}