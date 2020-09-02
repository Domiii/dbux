import { Uri, env } from 'vscode';
import { showInformationMessage } from './codeUtil/codeModals';
import { startDialog } from './dialog/dialog';

export async function showHelp(message) {
  const isDefaultHelp = !message;
  message = message || 'If you need help with Dbux, here are a few places to go:';

  let btns = {
    async 'Ask on Discord'() {
      return env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
    },
    async 'Open Manual'() {
      return env.openExternal(Uri.parse('https://github.com/Domiii/dbux#readme'));
    },
    async 'Read Dbux\'s known limitations'() {
      return env.openExternal(Uri.parse('https://github.com/Domiii/dbux#known-limitations'));
    },
    async [`Report Issue`]() {
      return env.openExternal(Uri.parse('https://github.com/Domiii/dbux/issues'));
    }
  };

  if (isDefaultHelp) {
    btns = {
      async 'Start Tutorial'() {
        return startDialog('tutorial');
      },
      async 'Take Survey'() {
        return startDialog('survey1');
      },
      ...btns
    };
  }

  return showInformationMessage(message, btns, { modal: true });
}