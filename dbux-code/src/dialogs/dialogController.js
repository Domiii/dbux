import { newLogger } from '@dbux/common/src/log/logger';
import dialogGraphs from './_dialogRegistry';
import { Dialog } from './Dialog';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { getInstallId } from '../installId';
import { setDialogControllerForDefaultHelp } from '../help';
import DialogNodeKind from './DialogNodeKind';


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
   * @param {number} [startState] 
   */
  startDialog(dialogName, startState) {
    let dialog = this.getDialog(dialogName);
    dialog.start(startState);
  }

  /**
   * @param {string} dialogName 
   * @param {string} [defaultStartState]
   * @return {Dialog}
   */
  getDialog(dialogName, defaultStartState) {
    let dialog = this.dialogs.get(dialogName);
    if (!dialog) {
      dialog = new Dialog(this.graphs.get(dialogName), defaultStartState);
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

const dialogController = new DialogController();

export default dialogController;

export async function maybeStartTutorialOnActivate() {
  const tutorialDialog = dialogController.getDialog('tutorial');
  const firstNode = tutorialDialog.getCurrentNode();

  // [debugging]
  await tutorialDialog.clear();

  if (firstNode?.end) {
    return;
  }

  if (firstNode.kind === DialogNodeKind.Modal) {
    const confirmResult = await tutorialDialog.askToContinue();
    if (confirmResult === false) {
      tutorialDialog.setState('cancel');
    }
    else if (confirmResult) {
      tutorialDialog.start();  
    }
  }
  else {
    tutorialDialog.start();
  }
}

export async function maybeStartSurvey1OnActivate() {
  const surveyDialog = dialogController.getDialog('survey1', 'waitToStart');
  const firstNode = surveyDialog.getCurrentNode();
  
  // [debugging]
  await getOrCreateProjectManager().progressLogController.reset();
  await surveyDialog.clear();

  if (firstNode?.end) {
    return;
  }

  surveyDialog.start();
}