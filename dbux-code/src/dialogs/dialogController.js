import { newLogger } from '@dbux/common/src/log/logger';
import dialogGraphs from './_dialogRegistry';
import { Dialog } from './Dialog';
import { getOrCreateProjectManager } from '../projectViews/projectControl';
import { getInstallId } from '../installId';
import { setDialogControllerForDefaultHelp } from '../help';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DialogController');

export class DialogController {
  constructor() {
    this.graphs = new Map(Object.entries(dialogGraphs));
    this.dialogs = new Map();

    setDialogControllerForDefaultHelp(this);
  }

  /**
   * Start a dialog, will create one if not exist
   * @param {string} dialogName 
   * @param {string} [startState] start dialog with the given state
   */
  startDialog(dialogName, startState) {
    let dialog = this.getDialog(dialogName);
    dialog.start(startState);
  }

  /**
   * @param {string} dialogName 
   * @return {Dialog}
   */
  getDialog(dialogName) {
    let dialog = this.dialogs.get(dialogName);
    if (!dialog) {
      dialog = new Dialog(this.graphs.get(dialogName));
      dialog.controller = this;
      this.dialogs.set(dialogName, dialog);
    }
    return dialog;
  }

  // ###########################################################################
  // serialization + recording
  // ###########################################################################

  async serializeSurveyResult() {
    // get install id (random uuid that we generate and store in memento on first activate)
    const installId = getInstallId();

    // get survey result
    const surveyResult = this.getDialog('survey1').getRecordedData();

    // get tutorial result
    const tutorialResult = this.getDialog('tutorial').getRecordedData();

    // get first bug result
    const projectsManager = getOrCreateProjectManager();
    const firstBug = projectsManager.projects.getByName('express').getOrLoadBugs().getById(1);
    const bug1Status = projectsManager.progressLogController.util.getBugProgressByBug(firstBug);
    const bug1Tries = projectsManager.progressLogController.util.getTestRunsByBug(firstBug);
    // const bug1Status = null;

    return {
      installId,
      surveyResult,
      tutorialResult,
      bug1Status,
      bug1Tries
    };
  }
}

/**
 * @type {DialogController}
 */
let dialogController;

export function initDialogController() {
  dialogController = new DialogController();
  return dialogController;
}

export async function maybeStartSurvey1ForTheFirstTime() {
  const surveyDialog = dialogController.getDialog('survey1');

  if (!surveyDialog.started) {
    surveyDialog.start('waitToStart');
  }
}