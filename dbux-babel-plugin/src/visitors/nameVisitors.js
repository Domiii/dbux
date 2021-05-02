import { guessFunctionName, getFunctionDisplayName } from '../helpers/functionHelpers';

let nameMap = new Map();

export function getNodeNames(node) {
  return nameMap.get(node);
}

function setNodeNames(node, names) {
  nameMap.set(node, names);
}

function enter(path, state) {
  if (!state.onEnter(path, 'names')) return;

  const name = guessFunctionName(path, state);
  const displayName = getFunctionDisplayName(path, state, name);

  setNodeNames(path.node, {
    name,
    displayName
  });
}

/**
 * TODO: migrate to new parser
 */
export default function nameVisitors() {
  return {
    Function: {
      enter
    }
  };
}

// prevent memory leaks
export function clearNames() {
  nameMap.clear();
}