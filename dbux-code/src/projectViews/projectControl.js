import { window } from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { initDbuxProjects } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage, showInformationMessage } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import TerminalWrapper from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { getResourcePath, getLogsDirectory } from '../resources';
import { interactiveGithubLogin } from '../net/GithubAuth';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { showBugIntroduction } from './BugIntroduction';
import { getStopwatch } from './practiceStopwatch';
import { initUserEvent } from '../userEvents';

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
export function getOrCreateProjectManager(extensionContext) {
  if (!projectManager) {
    projectManager = createProjectManager(extensionContext);
  }
  return projectManager;
}

function createProjectManager(extensionContext) {
  // ########################################
  // cfg + externals
  // ########################################

  // the folder that is parent to `node_modules` for installing all extraneous dependencies (such as @dbux/cli, firebase etc.)
  let dependencyRoot = extensionContext.asAbsolutePath(path.join('.'));     // extension_folder
  const pathMatch = dependencyRoot.match(/(.+)[/\\]dbux-code/);
  if (pathMatch) {
    dependencyRoot = pathMatch[1];                                          // DBUX_ROOT (but DBUX_ROOT is not available in production)
    if (process.env.NODE_ENV === 'development') {
      if (dependencyRoot.toLowerCase() !== process.env.DBUX_ROOT?.toLowerCase()) { // weird drive letter inconsistencies in Windows force us to do case-insensitive comparison
        throw new Error(`Path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})`);
      }
    }
  }

  // the folder that contains the sample projects for dbux-practice
  const projectsRoot = path.join(dependencyRoot, 'dbux_projects');
  const stopwatch = getStopwatch();

  const cfg = {
    dependencyRoot,
    projectsRoot
  };
  const externals = {
    editor: {
      async openFile(fpath) {
        return showTextDocument(fpath);
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
    async confirm(msg, modal = false) {
      const confirmText = 'Yes';
      const refuseText = 'No';
      const cancelText = 'Cancel';
      const result = await window.showInformationMessage(msg, { modal }, confirmText, refuseText, modal ? undefined : cancelText);
      if (result === undefined || result === 'Cancel') {
        return null;
      }
      else {
        return result === confirmText;
      }
    },
    async alert(msg, modal = false) {
      await window.showInformationMessage(msg, { modal });
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
    interactiveGithubLogin
  };

  // ########################################
  //  init projectManager
  // ########################################
  const manager = initDbuxProjects(cfg, externals);

  initUserEvent(manager);

  debug(`Initialized dbux-projects. projectsRoot = "${path.resolve(cfg.projectsRoot)}", dependencyRoot = "${path.resolve(cfg.dependencyRoot)}"`);

  return manager;
}