import { NodePath } from '@babel/core';
import { getClassAncestryString } from './traversalHelpers';
import { extractSourceStringWithoutComments } from './sourceHelpers';


/**
 * Gets `o` in `o.a.b.c.d...`
 */
export function getLeftMostPathOfME(memberPath) {
  let next;
  while ((next = memberPath.get('object')).node) {
    memberPath = next;
  }
  return memberPath;
}

export function getRightMostIdOfMember(memberPath) {
  return memberPath.property;
}

export function getAllButRightMostPath(memberPath) {
  return memberPath.get('object');
}

export function getMemberExpressionName(path, state, includeAncestry = true) {
  /**
   * @type {NodePath}
   */
  const objPath = path.get('object');
  let name;
  if (objPath.isThisExpression()) {
    const innerName = extractSourceStringWithoutComments(path.node.property, state);
    if (includeAncestry) {
      name = getClassAncestryString(objPath);
      name = [
        name,
        innerName
      ].filter(n => !!n).join('.');
    }
    else {
      name = innerName;
    }
  }
  else {
    name = extractSourceStringWithoutComments(path.node, state);
  }
  return name;
}