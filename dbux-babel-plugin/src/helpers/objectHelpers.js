import * as t from '@babel/types';


// export function getLeftMostIdOfMember(memberPath) {
//   return memberPath.object.object...object;
// }

export function getRightMostIdOfMember(memberPath) {
  return memberPath.property;
}