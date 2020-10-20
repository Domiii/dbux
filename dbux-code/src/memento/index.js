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
  return Promise.all(getAllMementoKeys().map(key => set(key, undefined)));
}

export function getAllMementoKeys() {
  if (!memento._value) {
    return [];
  }
  const keys = Object.keys(memento._value);
  return keys;
}

export function getAllMemento() {
  return memento._value;
}

export function initMemento(context) {
  memento = context.globalState;
}
