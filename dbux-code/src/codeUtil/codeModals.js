import {
  Uri,
  window
} from 'vscode';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPrettyFunctionName } from '@dbux/common/src/util/functionUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Notifications');

/**
 * @example Render a modal with one button "Open Editor":
```
showInformationMessage(value, {
  async 'Open Editor'() {
    const doc = await workspace.openTextDocument({ content: value });
    await window.showTextDocument(doc.uri);
  }
}, { modal: true });
```
 */
export async function showInformationMessage(message, btnConfig, messageCfg = EmptyObject, cancelCallback) {
  btnConfig = btnConfig || EmptyObject;
  const buttons = Object.keys(btnConfig);
  if (messageCfg?.modal && process.platform === 'darwin') {
    /**
     * for some reason, on MAC, modal buttons are reversed :(
     * @see https://github.com/microsoft/vscode/issues/71251
     */
    buttons.reverse();
  }
  message = `[Dbux] ${message}`;
  debug(message);

  const result = await window.showInformationMessage(message, messageCfg, ...buttons);
  if (messageCfg?.modal) {
    debug(`  > User responded with "${result}"`);
  }
  if (result === undefined) {
    return await cancelCallback?.();
  }
  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

export async function showWarningMessage(message, btnConfig, messageCfg = EmptyObject, cancelCallback) {
  btnConfig = btnConfig || EmptyObject;
  message = `[Dbux] ${message}`;
  warn(message);

  const result = await window.showWarningMessage(message, messageCfg, ...Object.keys(btnConfig || EmptyObject));
  if (messageCfg?.modal) {
    debug(`  > User responded with "${result}"`);
  }
  if (result === undefined) {
    await cancelCallback?.();
    return null;
  }
  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

export async function showErrorMessage(message, btnConfig, messageCfg = EmptyObject, moreConfig = EmptyObject) {
  btnConfig = btnConfig || EmptyObject;
  const prefix = moreConfig.noPrefix ? '' : '[Dbux] ';
  btnConfig = btnConfig || EmptyObject;

  // IMPORTANT: don't log explicitely, since that is already hooked up to call this instead!
  //    -> if we called logError(), we would get an inf loop.

  const result = await window.showErrorMessage(`${prefix}${message}`, messageCfg, ...Object.keys(btnConfig));
  if (messageCfg?.modal) {
    debug(`  > User responded with "${result}"`);
  }

  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

/**
 * @param {string} msg 
 * @param {boolean} [modal] 
 * @returns {Promise<boolean|null>} A boolean indicates the result of confirmation, or null if it is canceled.
 */
export async function confirm(msg, modal = true, throwOnCancel = false) {
  // TOTRANSLATE
  const confirmText = 'Ok';
  // const refuseText = 'Cancel'; // NOTE: modal has cancel button by default

  const btnConfig = Object.fromEntries([confirmText].map(t => [t, () => t]));
  const result = await showInformationMessage(msg, btnConfig, { modal });
  if (result === undefined) {
    if (throwOnCancel) {
      throw new Error('Modal cancelled.');
    }
    return null;
  }
  else {
    return result === confirmText;
  }
}

export async function alert(msg, modal = true) {
  return await showInformationMessage(msg, undefined, { modal });
}

/**
 * @param {[string|function|import('vscode').QuickPickItem]} items 
 * @returns 
 */
export async function showQuickPick(items, options) {
  // future-work: better ways of naming functions with some simple tricks?
  //    -> Object.values({ ['hi' + 123]() { } })[0].name

  items = items
    .map((item) => {
      if (isFunction(item)) {
        return {
          label: getPrettyFunctionName(item),
          cb: item
        };
      }
      else if (isString(item)) {
        return { label: item };
      }
      else if (!isPlainObject(item)) {
        throw new Error(`Invalid quick-pick item must be function or plain object: ${item}`);
      }
      return item;
    });

  debug(`[showQuickPick] ${items.map((item, i) => `(${i + 1}) ${item.label}`).join(', ')}`);

  return window.showQuickPick(items, options);
}

export async function chooseFile({ title, folder = null, filters, canSelectFolders = false } = EmptyObject) {
  const options = {
    title,
    filters,
    defaultUri: folder ? Uri.file(folder) : undefined,
    canSelectFolders,
    canSelectMany: false
  };
  // if (folder) {
  //   options.defaultUri = Uri.file(folder);
  // }
  // if (filters) {
  //   options.filters = filters;
  // }
  const result = await window.showOpenDialog(options);

  return result?.[0]?.fsPath || null;
}

export async function showSaveDialog({ title, ...otherOpts } = EmptyObject) {
  const options = {
    title,
    ...otherOpts
  };
  // if (folder) {
  //   options.defaultUri = Uri.file(folder);
  // }
  // if (filters) {
  //   options.filters = filters;
  // }
  const result = await window.showSaveDialog(options);

  return result?.fsPath || null;
}

export async function chooseFolder({ title, folder, filters } = EmptyObject) {
  return await chooseFile({ title, folder, filters, canSelectFolders: true });
}
