import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from '@dbux/projects/src/util/Process';
import which from '@dbux/projects/src/util/which';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalUtil');

const DefaultTerminalName = 'dbux-run';

export function createDefaultTerminal(cwd) {
  return createTerminal(DefaultTerminalName, cwd);
}

export function createTerminal(name, cwd) {
  let terminal = window.terminals.find(t => t.name === name);
  terminal?.dispose();

  const terminalOptions = {
    name,
    cwd
  };
  return window.createTerminal(terminalOptions);
}

export function sendCommandToDefaultTerminal(cwd, command) {
  const terminal = createDefaultTerminal(cwd);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}

function bashParse(string) {
  return string.replace(/"/g, `\\"`).replace(/`/g, "\\`");
}

export async function execCommand(cwd, command) {
  let terminal = window.terminals.find(t => t.name === DefaultTerminalName);
  terminal?.dispose();

  let pathToBash = (await which('bash'))[0];

  // NOTE: `tail -f /dev/null` fails on Mac (but only in the integrated terminal) for some reason
  // const stall = 'tail -f /dev/null';
  const stall = 'sleep 100000';

  const terminalOptions = {
    name: DefaultTerminalName,
    cwd,
    shellPath: pathToBash,
    shellArgs: [`-c`, `echo "${bashParse(command)}"; ${command}; ${stall}`],
  };

  debug(`execCommandInTerminal: ${command}`);

  terminal = window.createTerminal(terminalOptions);
  terminal.show();

  return terminal;
}


/**
 * @see https://github.com/microsoft/vscode-extension-samples/blob/master/terminal-sample/src/extension.ts#L177
 */
export function selectTerminal() {
  const { terminals } = window;
  const items = terminals.map(t => {
    return {
      label: `name: ${t.name}`,
      terminal: t
    };
  });
  return window.showQuickPick(items).then(item => {
    return item ? item.terminal : undefined;
  });
}

/**
 * 
 * 
 * @see https://github.com/microsoft/vscode-extension-samples/blob/master/terminal-sample/src/extension.ts#L105
 */
export async function queryTerminalPid() {
  const terminal = await selectTerminal();
  if (!terminal) {
    return null;
  }

  return terminal.processId; // NOTE: processId returns a promise!
}


export function runInTerminalInteractive(terminalName, cwd, command) {
  const terminal = createTerminal(terminalName, cwd);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}
