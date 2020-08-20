
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

export function initMemento(context) {
  memento = context.workspaceState;
}
