
let memento;

export function get(key, defaultValue) {
  return memento.get(key, defaultValue);
}

export async function set(key, value) {
  await memento.update(key, value);
}

export function initMemento(context) {
  memento = context.workspaceState;
}
