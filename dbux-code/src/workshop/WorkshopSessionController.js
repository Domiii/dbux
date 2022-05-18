/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

import { window } from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import NestedError from '@dbux/common/src/NestedError';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import sleep from '@dbux/common/src/util/sleep';
import { get as mementoGet, set as mementoSet } from '../memento';
import { showInformationMessage } from '../codeUtil/codeModals';
import PathwaysDataContainer from './PathwaysDataContainer';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('WorkshopSession');

// const Verbose = true;
const Verbose = false;

const NicknameKeyName = 'dbux.workshopSession.nickname';
const SessionIdKeyName = 'dbux.workshopSession.workshopSessionId';

// const UploadLoopInterval = 2 * 60 * 1000;
const UploadLoopInterval = 10 * 1000;

export default class WorkshopSessionController {
  /**
   * @type {string}
   */
  code;

  /**
   * @type {string}
   */
  workshopSessionId;

  /**
   * @type {string}
   */
  nickname;

  constructor() {
    this.ValidCodes = new Set([]);
    this.code = '';
    this.workshopSessionId = mementoGet(SessionIdKeyName);
    this.nickname = mementoGet(NicknameKeyName);

    // dev only
    if (process.env.NODE_ENV === 'development') {
      this.ValidCodes.add('1234');
    }
  }

  async askForEnable() {
    const code = await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'Enter Workshop Code'
    });
    if (this.isValidCode(code)) {
      await this.enableWorkshopSession(code);
      return true;
    }
    else {
      await showInformationMessage(`Workshop code "${code}" is invalid.`, EmptyObject, { modal: true });
      return false;
    }
  }

  /**
   * @param {string} code 
   * @returns {boolean}
   */
  isValidCode(code) {
    return this.ValidCodes.has(code);
  }

  isWorkshopSessionEnabled() {
    return !!this.code;
  }

  async enableWorkshopSession(code) {
    this.code = code;

    if (this.nickname === undefined) {
      this.nickname = await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: 'Enter Your Nickname'
      });
      await mementoSet(NicknameKeyName, this.nickname);
    }

    if (this.workshopSessionId === undefined) {
      this.workshopSessionId = uuidv4();
      await mementoSet(SessionIdKeyName, this.workshopSessionId);
    }
  }

  /**
   * @param {ProjectsManager} projectsManager 
   * @returns 
   */
  initWorkshopSession(projectsManager) {
    if (this.isWorkshopSessionEnabled()) {
      this.pathwaysDataContainer = new PathwaysDataContainer(this);
      projectsManager.onPracticeSessionStateChanged(this.pathwaysDataContainer.onSessionChanged);
      this.scheduleUpload();
    }
  }

  async scheduleUpload() {
    while (this.isWorkshopSessionEnabled()) {
      await sleep(UploadLoopInterval);
      try {
        await this.pathwaysDataContainer.maybeFlushAll();
      }
      catch (err) {
        throw new NestedError(`Failed in PathwaysDataContainer upload loop`, err);
      }
    }
  }
}

/**
 * @type {WorkshopSessionController}
 */
let controller;
export function initWorkshopSessionController() {
  controller = new WorkshopSessionController();
  return controller;
}

export function getWorkshopSessionController() {
  return controller;
}