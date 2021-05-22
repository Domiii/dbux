import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseNode from './BaseNode';

// TODO: very similar to `AssignmentExpression` but (1) not an expression, (2) optional rval, (3) more limited lvals
export default class VariableDeclarator extends BaseNode {
  static plugins = [
    'Traces',
    'BindingNode'
  ];

  static children = ['id', 'init'];

  exit() {
    const { path } = this;
    const traces = this.getPlugin('Traces');

    const [, initPath] = this.getChildPaths(true);
    const [idNode] = this.getChildNodes();

    this.peekStaticContext().addDeclaration(idNode);

    // const expressionTraceCfg = {
    //   path: idPath,
    //   node: idNode,
    //   varNode: idNode,
    //   staticTraceData: {
    //     type: TraceType.ExpressionResult,
    //     dataNode: {
    //       isNew: false,
    //       type: DataNodeType.Read
    //     }
    //   }
    // };

    const writeTraceCfg = {
      path,
      node: this,
      varNode: idNode,
      staticTraceData: {
        type: TraceType.WriteVar,
        dataNode: {
          isNew: false,
          type: DataNodeType.Write
        }
      },
      meta: {
        instrument: traces.instrumentTraceWrite,
        replacePath: initPath
      }
    };

    traces.addTraceWithInputs(writeTraceCfg, initPath.node && [initPath] || EmptyArray);

    // traces.addTraceWithInputs({ path: initPath, node: initNode, varNode: idNode, staticTraceData}, [initPath]);
  }

  // exit() {
  //   // creates a new binding
  // }

  // instrument() {
  //   // TODO: wrap rval in td(rval, tid)
  // }
}