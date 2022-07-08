import { emitShowHelpAction } from './userEvents';

/** @typedef { import("./dialogLib/DialogController").default } DialogController */

/**
 * @type {DialogController}
 */
let dialogController;

export async function showHelp(/* message */) {
  // if(isDefaultHelp) {
  //   btns = {
  //     // NOTE: tutorial needs a revamp - need easier bugs and videos to get started.
  //     // async [translate('showHelp.tutorial')]() {
  //     //   return await dialogController.startDialog('tutorial');
  //     // },
  //     // async [translate('showHelp.survey')]() {
  //     //   return await dialogController.startDialog('survey1');
  //     // },
  //     ...btns
  //   };
  // }

  emitShowHelpAction();
  return await dialogController.restartDialog('intro');
}

export function setDialogControllerForDefaultHelp(controller) {
  dialogController = controller;
}