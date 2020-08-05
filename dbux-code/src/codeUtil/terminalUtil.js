import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from '@dbux/projects/src/util/Process';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalUtil');

const DefaultTerminalName = 'dbux-run';

export async function getPathToBash() {
  let result = await Process.execCaptureAll(`which cygpath`, { failOnStatusCode: false });

  if (result.code) {
    return Process.execCaptureOut(`which bash`, { failOnStatusCode: false });
  } else {
    return Process.execCaptureOut('cygpath -w `which bash`', { failOnStatusCode: false });
  }
}

export function createDefaultTerminal(cwd) {
  let terminal = window.terminals.find(t => t.name === DefaultTerminalName);
  terminal?.dispose();
  
  const terminalOptions = {
    name: DefaultTerminalName,
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

export async function execCommand(cwd, command) {
  let terminal = window.terminals.find(t => t.name === DefaultTerminalName);
  terminal?.dispose();

  let pathToBash = await getPathToBash();

  const terminalOptions = {
    name: DefaultTerminalName,
    cwd,
    shellPath: pathToBash,
    shellArgs: [`-c`, `${command}; tail -f /dev/null;`],
  };

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
