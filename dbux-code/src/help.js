import { Uri, env } from 'vscode';
import { showInformationMessage } from './codeUtil/codeModals';

export async function showHelp(message) {
  return showInformationMessage(message || 'If you need help with Dbux, here are a few places to go:', {
    async 'Ask on Discord'() {
      env.openExternal(Uri.parse('https://discord.gg/jWN356W'));
    },
    async 'Open Manual'() {
      env.openExternal(Uri.parse('https://github.com/Domiii/dbux#readme'));
    },
    async 'Read Dbux\'s known limitations'() {
      env.openExternal(Uri.parse('https://github.com/Domiii/dbux#known-limitations'));
    },
    async [`Report Issue`]() {
      env.openExternal(Uri.parse('https://github.com/Domiii/dbux/issues'));
    }
  }, { modal: true });
}