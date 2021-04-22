import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import which from '@dbux/projects/src/util/which';
import sleep from '@dbux/common/src/util/sleep';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalUtil');

const DefaultTerminalName = 'dbux-run';

export function createDefaultTerminal(cwd) {
  return createTerminal(DefaultTerminalName, cwd);
}

export function recreateTerminal(terminalOptions) {
  closeTerminal(terminalOptions.name);
  return window.createTerminal(terminalOptions);
}

export function createTerminal(name, cwd) {
  closeTerminal(name);

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

export function findTerminal(name) {
  return window.terminals.find(t => t.name === name);
}

export function closeDefaultTerminal() {
  closeTerminal(DefaultTerminalName);
}

export function closeTerminal(name) {
  let terminal = findTerminal(name);
  terminal?.dispose();
}

// function bashParse(string) {
//   return string.replace(/"/g, `\\"`).replace(/`/g, "\\`");
// }

export async function runInTerminal(cwd, command) {
  const name = DefaultTerminalName;
  closeTerminal(name);

  let pathToBash = (await which('bash'))[0];

  // WARNING: terminal is not properly initialized when running the command. cwd is not set when executing `command`.
  const wrappedCommand = `cd "${cwd}" && ${command} ; sleep 10`;

  const terminalOptions = {
    name: DefaultTerminalName,
    cwd,
    shellPath: pathToBash,
    // shellArgs: [wrappedCommand],
    shellArgs: ['-c', wrappedCommand],
    // shellArgs: ['-c', 'pwd && sleep 1000'],
  };

  // debug(`[execCommandInTerminal] ${cwd}$ ${command}`);

  const terminal = window.createTerminal(terminalOptions);
  terminal.show();

  // terminal.sendText(wrappedCommand);

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

export function getOrCreateTerminal(terminalOptions) {
  const { name } = terminalOptions;
  let terminal = findTerminal(name);
  if (!terminal) {
    terminal = window.createTerminal(terminalOptions);
  }
  return terminal;
}


export async function runInTerminalInteractive(cwd, command, createNew = false) {
  if (!command) {
    throw new Error('command for runInTerminalInteractive is empty: ' + command);
  }
  const terminalName = DefaultTerminalName;

  let pathToBash = (await which('bash'))[0];

  const terminalOptions = {
    name: terminalName,
    cwd,
    shellPath: pathToBash
  };
  const terminal = createNew ?
    recreateTerminal(terminalOptions) :
    getOrCreateTerminal(terminalOptions);

  await sleep(300);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}
