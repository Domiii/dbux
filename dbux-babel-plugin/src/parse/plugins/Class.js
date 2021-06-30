import TraceType from '@dbux/common/src/core/constants/TraceType';
import ClassMethod from '../ClassMethod';
import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class Class extends BasePlugin {
  exit1() {
    const { node } = this;
    const { path } = node;
    const [, , bodyNode] = node.getChildNodes();
    const memberPaths = bodyNode.path.get('body');

    // record all ClassMethods
    const methods = [];
    const staticTraceData = {
      type: TraceType.Class,
      dataNode: {
        isNew: true
      },
      data: {
        methods
      }
    };
    for (const memberPath of memberPaths) {
      const memberNode = node.getNodeOfPath(memberPath);
      if (memberNode instanceof ClassMethod) {
        methods.push(memberNode.createTraceData());
      }
    }

    // TODO
    // this.classTraceData = {
    //   path,
    //   node,
    //   staticTraceData,
    //   meta: {

    //   }
    // };
  }
}