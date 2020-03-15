import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { getClassAncestryString } from './traversalHelpers';
import { extractSourceStringWithoutComments } from './sourceHelpers';


// export function getLeftMostIdOfMember(memberPath) {
//   return memberPath.object.object...object;
// }

export function getRightMostIdOfMember(memberPath) {
  return memberPath.property;
}

export function getAllButRightMostPath(memberPath) {
  return memberPath.get('object');
}

export function getMemberExpressionName(path, state, includeAncestry = true) {
  const objPath: NodePath = path.get('object');
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