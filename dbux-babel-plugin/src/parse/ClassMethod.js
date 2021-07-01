import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ClassMethod extends BaseNode {
  static children = [
    'key',
    'params',
    'body'
  ];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  createTraceData() {
    const { path } = this;
    const methodName = path.node.key;

    return {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.FunctionDefinition,
        data: {
          methodName
        }
      },
      dataNode: {
        isNew: true
      }
    };
  }
}