import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

// TODO: very similar to `AssignmentExpression` but (1) not an expression, (2) optional rval, (3) more limited lvals
export default class VariableDeclarator extends BaseNode {
  static plugins = [
    'Traces',
    'BindingNode'
  ];

  static children = ['id', 'init'];

  exit() {
    // TODO: add rval write trace
    const traces = this.getPlugin('Traces');

    const [idPath, initPath] = this.getChildPaths();
    const [idNode, initNode] = this.getChildNodes();

    if (!initPath) {
      // TODO: wrap rval in `SequenceExpression`
      return;
    }

    // TODO: fix type trace write
    // TODO: handle the case where rval was already instrumented

    const staticTraceData = {
      type: TraceType.ExpressionResult,
      dataNode: {
        isNew: false,
        isWrite: false
      }
    };

    const staticTraceData = {
      type: TraceType.Binding,
      dataNode: {
        isNew: false,
        isWrite: false
      }
    };

    // TODO: hoisting
    traces.addTrace(idPath, idNode, idNode, staticTraceData);

    traces.addTraceWithInputs(initPath, initNode, idNode, staticTraceData, [initPath]);
  }

  // exit() {
  //   // creates a new binding
  // }

  // instrument() {
  //   // TODO: wrap rval in td(rval, tid)
  // }
}