import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class TemplateLiteral extends BaseNode {
  static children = ['quasis', 'expressions'];

  exit() {
    const { path } = this;
    const [, expressions] = this.getChildPaths();

    let targetNode, isNew;
    if (path.parentPath.isTaggedTemplateExpression()) {
      // This is not just a TemplateExpression; but it is fused with its tag. Cannot (easily) separate the two.
      targetNode = this.getParent();
      isNew = false; // resulting value is return value of function
    }
    else {
      targetNode = this;
      isNew = true; // resulting value is a new string
    }

    const traceData = {
      path: targetNode.path,
      node: targetNode,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew,
          label: '``'
        }
      }
    };

    const inputs = expressions;
    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}