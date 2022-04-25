import { Uri, env } from 'vscode';
import { showInformationMessage } from './codeUtil/codeModals';
import { translate } from './lang';
import { emitShowHelpAction } from './userEvents';

let dialogController;

export async function showHelp(message) {
  const isDefaultHelp = !message;
  message = message || translate('showHelp.defaultMessage');

  let btns = {
    async [translate('showHelp.discord')]() {
      return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
    },
    async [translate('showHelp.manual')]() {
      return env.openExternal(Uri.parse('https://domiii.github.io/dbux/'));
    },
    // async [translate('showHelp.readDbux')]() {
    //   return env.openExternal(Uri.parse('https://github.com/Domiii/dbux#known-limitations'));
    // },
    async [translate('showHelp.report')]() {
      return env.openExternal(Uri.parse('https://github.com/Domiii/dbux/issues'));
    }
  };

  if (isDefaultHelp) {
    btns = {
      async [translate('showHelp.tutorial')]() {
        return dialogController.startDialog('tutorial');
      },
      async [translate('showHelp.survey')]() {
        return dialogController.startDialog('survey1');
      },
      ...btns
    };
  }

  
  const result = showInformationMessage(message, btns, { modal: true });
  emitShowHelpAction();
  return result;
}

export function setDialogControllerForDefaultHelp(controller) {
  dialogController = controller;
}