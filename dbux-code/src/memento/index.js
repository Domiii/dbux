let memento;

const allKeysKeyName = 'dbux.mementoKeys';
/**
 * @type {Set<string>}
 */
let allKeys;

export function get(key, defaultValue = undefined) {
  return memento.get(key, defaultValue);
}

/**
 * NOTE: `memento.update` is `async`, but `get` is not.
 */
export async function set(key, value) {
  await memento.update(key, value);
  if (!allKeys.has(key)) {
    allKeys.add(key);
    await memento.update(allKeysKeyName, Array.from(allKeys));
  }
}

export function getAllMementoKeys() {
  return Array.from(allKeys);
}

export function initMemento(context) {
  memento = context.globalState;
  allKeys = new Set(get(allKeysKeyName, []));
}
