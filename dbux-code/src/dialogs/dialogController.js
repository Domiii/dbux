import { newLogger } from '@dbux/common/src/log/logger';
import dialogGraphs from './_dialogRegistry';
import { Dialog } from './Dialog';
import { getOrCreateProjectManager } from '../projectView/projectControl';
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

  startDialog(dialogName, startState) {
    let dialog = this.getDialog(dialogName);
    if (!dialog) {
      dialog = new Dialog(this.graphs.get(dialogName));
      dialog.controller = this;
      this.dialogs.set(dialogName, dialog);
    }
    dialog.start(startState);
  }

  getDialog(dialogName) {
    return this.dialogs.get(dialogName);
  }

  // ###########################################################################
  // serialization + recording
  // ###########################################################################

  async serializeSurveyResult() {
    // TODO: get install id (random uuid that we generate and store in memento on first activate)
    const installId = getInstallId();

    // TODO: get survey result
    const surveyResult = this.getDialog('survey1').getRecordedData();

    // TODO: get tutorial result
    const tutorialResult = this.getDialog('tutorial').getRecordedData();

    // TODO: get first bug result
    const projectsManager = getOrCreateProjectManager();
    const firstBug = projectsManager.projects.getByName('express').getOrLoadBugs().getById(1);
    const bug1Status = projectsManager.progressLogController.util.getBugProgressByBug(firstBug);
    // const bug1Status = null;

    return {
      installId,
      surveyResult,
      tutorialResult,
      bug1Status
    };
  }
}

const dialogController = new DialogController();

export default dialogController;