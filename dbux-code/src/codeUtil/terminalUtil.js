import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { normalizeDriveLetter, whichNormalized } from '@dbux/common-node/src/util/pathUtil';
import sleep from '@dbux/common/src/util/sleep';
import { getShellInlineFlags, getShellName, getShellPath, getShellPauseCommand, getShellSep } from './codePath';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalUtil');

const DefaultTerminalName = 'dbux-run';

export function createDefaultTerminal(cwd) {
  return createTerminal(DefaultTerminalName, cwd);
}

export function recreateTerminal(terminalOptions) {
  terminalOptions.cwd = normalizeDriveLetter(terminalOptions.cwd);
  closeTerminal(terminalOptions.name);
  return window.createTerminal(terminalOptions);
}

export function createTerminal(name, cwd) {
  cwd = normalizeDriveLetter(cwd);

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
  if (!terminal || !!terminal.exitStatus) {
    terminal = recreateTerminal(terminalOptions);
  }
  return terminal;
}


/** ###########################################################################
 * {@link runInTerminal}
 * ##########################################################################*/

export async function runInTerminal(cwd, command) {
  cwd = normalizeDriveLetter(cwd);

  const name = DefaultTerminalName;
  closeTerminal(name);

  // const shellPath = whichNormalized(getShellPath());
  const shellPath = getShellPath();
  const shellName = getShellName();
  const inlineFlags = getShellInlineFlags();
  const pause = getShellPauseCommand();
  const sep = getShellSep();

  // WARNING: terminal is not properly initialized when running the command. cwd is not set when executing `command`.
  const wrappedCommand = `cd "${cwd}" && ${command} ${sep} ${pause}`;
  // const wrappedCommand = await window.showInputBox({ 
  //   placeHolder: 'input a command',
  //   value: '/k echo hello world!'
  // });

  let shellArgs;
  shellArgs = [wrappedCommand];
  if (inlineFlags) {
    shellArgs.unshift(...inlineFlags);
  }

  if (shellName === 'cmd') {
    // hackfix: Terminal API behavior of cmd does not work like bash. Instead, the VSCode Terminal API added a hack-ish solution to take a string on Windows (which it does not support on other systems).
    shellArgs = shellArgs.join(' ');
  }

  /**
   * @see https://code.visualstudio.com/api/references/vscode-api#TerminalOptions
   */
  const terminalOptions = {
    name: DefaultTerminalName,
    cwd,
    shellPath: shellPath,
    shellArgs,
  };

  // debug(`[execCommandInTerminal] ${cwd}$ ${command}`);

  const terminal = window.createTerminal(terminalOptions);
  terminal.show();

  // terminal.sendText(wrappedCommand);

  return terminal;
}

/** ###########################################################################
 * {@link runInTerminalInteractive}
 * ##########################################################################*/

export async function runInTerminalInteractive(cwd, command, createNew = false) {
  if (!command) {
    throw new Error('command for runInTerminalInteractive is empty: ' + command);
  }
  const terminalName = DefaultTerminalName;

  // const shellPath = whichNormalized(getShellPath());
  const shellPath = getShellPath();

  const terminalOptions = {
    name: terminalName,
    cwd,
    shellPath: shellPath
  };

  // hackfix: when running multiple commands in serial, subsequent terminal access might fail, if too fast
  await sleep(300);

  const terminal = createNew ?
    recreateTerminal(terminalOptions) :
    getOrCreateTerminal(terminalOptions);

  // hackfix: sometimes, the terminal needs a tick before it can receive text
  await sleep(1);

  terminal.sendText(command, true);
  terminal.show(false);

  return terminal;
}
