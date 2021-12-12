import { env, Uri } from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathJoin, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { initDbuxProjects } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage, showInformationMessage, confirm, alert } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import { getResourcePath, getLogsDirectory, asAbsolutePath } from '../codeUtil/codePath';
import { closeAllEditors } from '../codeUtil/editorUtil';
import TerminalWrapper from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { interactiveGithubLogin } from '../net/GithubAuth';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { showExerciseIntroduction } from './ExerciseIntroduction';
import { getStopwatch } from './practiceStopwatch';
import { initUserEvent } from '../userEvents';
import { initRuntimeServer } from '../net/SocketServer';
import { getCurrentResearch } from '../research/Research';
import { showOutputChannel } from '../OutputChannel';

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
  const sharedExtensionsFolderMatch = dependencyRoot.match(/(.+)[/\\](?:.+\.)dbux-code(?:.*[/\\]?)/);    // NOTE: in prod, folder name changes to "author.dbux-code-version"
  // if (sharedExtensionsFolderMatch) {
  //   if (process.env.NODE_ENV === 'development') {
  //     // eslint-disable-next-line prefer-destructuring
  //     // dependencyRoot = pathNormalizedForce(pathMatch[1]);
  //     // if (dependencyRoot !== process.env.DBUX_ROOT) {
  //     //   logError(`Potential path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})\nIgnoring DBUX_ROOT...`);
  //     //   // dependencyRoot = process.env.DBUX_ROOT;
  //     // }
  //     // TODO: allow running dev mode with non-local dependencies, too
  //   }
  // }

  // if (process.env.NODE_ENV === 'development') {
  if (process.env.DBUX_ROOT) {
    // eslint-disable-next-line prefer-destructuring
    // dependencyRoot = pathNormalizedForce(pathMatch[1]);
    // if (dependencyRoot !== process.env.DBUX_ROOT) {
    //   logError(`Potential path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})\nIgnoring DBUX_ROOT...`);
    //   // dependencyRoot = process.env.DBUX_ROOT;
    // }
    // TODO: allow running dev mode with non-local dependencies, too
    dependencyRoot = process.env.DBUX_ROOT;
    if (!dependencyRoot) {
      throw new Error(`DBUX_ROOT is empty`);
    }
  }
  else if (!sharedExtensionsFolderMatch) {
    // no DBUX_ROOT and not shared -> we are running production mode from local dev env
    // -> go up by one
    dependencyRoot = pathResolve(dependencyRoot, '..');
  }
  else {
    // production: dependencyRoot is the dbux-code folder itself
    // eslint-disable-next-line prefer-destructuring
    // dependencyRoot = pathMatch[0];
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
    alert,
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
    showExerciseIntroduction,
    interactiveGithubLogin,
    openWebsite(url) {
      return env.openExternal(Uri.parse(url));
    },
    async initRuntimeServer() {
      return await initRuntimeServer(extensionContext);
    },

    getCurrentResearch,
    closeAllEditors,
    showOutputChannel
  };

  // ########################################
  //  init projectManager
  // ########################################
  projectManager = initDbuxProjects(cfg, externals);

  initUserEvent(projectManager);

  return projectManager;
}