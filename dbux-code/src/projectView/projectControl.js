import { window } from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { initDbuxProjects } from '@dbux/projects/src';
import Process from '@dbux/projects/src/util/Process';
import { showWarningMessage, showInformationMessage } from '../codeUtil/codeModals';
import { showTextDocument, showTextInNewFile } from '../codeUtil/codeNav';
import TerminalWrapper from '../terminal/TerminalWrapper';
import { set as storageSet, get as storageGet } from '../memento';
import { getResourcePath } from '../resources';
import { interactiveGithubLogin } from '../net/GithubAuth';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { showBugIntroduction } from './BugIntroduction';

/** @typedef {import('@dbux/projects/src').ProjectsManager} ProjectsManager */

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

  // the folder that contains `node_modules` for installing cli etc.
  // const dependencyRoot = process.env.NODE_ENV === 'production' ?
  //   extensionContext.asAbsolutePath(path.join('.')) :                    // extension_folder
  //   path.join(process.env.DBUX_ROOT);                                    //

  let dependencyRoot = extensionContext.asAbsolutePath(path.join('.'));     // extension_folder
  const pathMatch = dependencyRoot.match(/(.+)[/\\]dbux-code/);
  if (pathMatch) {
    dependencyRoot = pathMatch[1];
    if (process.env.NODE_ENV === 'development') {
      if (dependencyRoot.toLowerCase() !== process.env.DBUX_ROOT?.toLowerCase()) { // weird drive letter inconsistencies in Windows force us to do case-insensitive comparison
        throw new Error(`Path problems: ${dependencyRoot} !== DBUX_ROOT (${process.env.DBUX_ROOT})`);
      }
    }
  }

  // the folder that contains the sample projects for dbux-projects/dbux-practice
  // const projectsRoot = process.env.NODE_ENV === 'production' ?
  //   extensionContext.asAbsolutePath(path.join('.', 'dbux_projects')) :  // extension_folder/dbux_projects
  //   path.join(process.env.DBUX_ROOT, '..', 'dbux_projects');

  const projectsRoot = path.join(dependencyRoot, 'dbux_projects');

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
      const confirmText = 'Ok';
      const result = await window.showInformationMessage(msg, { modal }, confirmText, 'cancel');
      return result === confirmText;
    },
    TerminalWrapper,
    resources: {
      getResourcePath
    },
    showMessage: {
      info: showInformationMessage,
      warning: showWarningMessage,
    },
    WebviewWrapper,
    showBugIntroduction,
    interactiveGithubLogin
  };

  // ########################################
  //  init projectManager
  // ########################################
  const manager = initDbuxProjects(cfg, externals);

  debug(`Initialized dbux-projects. Projects folder = "${path.resolve(cfg.projectsRoot)}"`);

  return manager;
}