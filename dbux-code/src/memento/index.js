
let memento;

export function get(key, defaultValue) {
  return memento.get(key, defaultValue);
}

export function set(key, value) {
  memento.update(key, value);
}

export function initMemento(context) {
  memento = context.workspaceState;
}
