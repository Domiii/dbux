import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { getClassAncestryString } from './astHelpers';
import { toSourceStringWithoutComments } from './misc';


// export function getLeftMostIdOfMember(memberPath) {
//   return memberPath.object.object...object;
// }

export function getRightMostIdOfMember(memberPath) {
  return memberPath.property;
}


export function getMemberExpressionName(path, includeAncestry = true) {
  const objPath: NodePath = path.get('object');
  let name;
  if (objPath.isThisExpression()) {
    const innerName = toSourceStringWithoutComments(path.node.property);
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
    name = toSourceStringWithoutComments(path.node);
  }
  return name;
}