/** @typedef {import('vscode').Memento} Memento */

/**
 * @type {Memento}
 */
let memento;

export function get(key, defaultValue = undefined) {
  return memento.get(key, defaultValue);
}

/**
 * NOTE: `memento.update` is `async`, but `get` is not.
 */
export async function set(key, value) {
  await memento.update(key, value);
}

export async function clearAll() {
  for (const key of getAllDbuxMementoKeys()) {
    await set(key, undefined);
  }
}

export function getAllDbuxMementoKeys() {
  // NOTE: memento._values might contain non-dbux data? (not sure)
  if (!memento._values) {
    return [];
  }
  const keys = Object.keys(memento._values).filter(key => key.toLowerCase().contains('dbux'));
  return keys;
}

export function getAllMemento() {
  return memento._value;
}

export function initMemento(context) {
  memento = context.globalState;

  // clearAll();
}
