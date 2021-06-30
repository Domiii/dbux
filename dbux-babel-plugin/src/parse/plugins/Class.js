import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class Class extends BasePlugin {


  // exit() {
  //   const { node } = this;
  //   const [, , bodyNode] = node.getChildNodes();
  //   const memberPaths = bodyNode.path.get('body');
  //   // TODO: memberPaths = Array<ClassMethod | ClassPrivateMethod | ClassProperty | ClassPrivateProperty>
  //   for (const memberPath of memberPaths) {
  //     const memberNode = node.getNodeOfPath(memberPath);
  //   }
  // }
}