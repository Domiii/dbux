// import * as t from '@babel/types';

/**
 * If true, given node was injected/instrumented by babel or some plugin,
 * meaning it does not exist in original source code and (usually) does not deserve further analysis.
 */
export function isNodeInstrumented(node) {
  return !node.loc;
}

export function isPathInstrumented(path) {
  return !path.node?.loc;
}

export function getPathContextId(path) {
  return path.getData('staticId');
}

const scopeBreakingNodeTypes = Object.fromEntries([
  'ReturnStatement',
  'ThrowStatement',
  'BreakStatement',
  'ContinueStatement'
].map(type => ([type, true])));

/**
 * @return Whether execution cannot continue right after the given instruction.
 */
export function doesNodeEndScope(node) {
  return !!scopeBreakingNodeTypes[node.type];
}

export function isPrivateClassMember(node) {
  switch (node.type) {
    case "ClassPrivateProperty":
    case "ClassPrivateMethod":
      return true;
  }
  return false;
}