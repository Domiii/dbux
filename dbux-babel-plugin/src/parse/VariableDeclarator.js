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
    // TODO: add rval write trace
    const traces = this.getPlugin('Traces');

    const [idPath, initPath] = this.getChildPaths(true);
    const [idNode, initNode] = this.getChildNodes();

    // const staticTraceData = {
    //   type: TraceType.Binding,
    //   dataNode: {
    //     isNew: false,
    //     isWrite: false
    //   }
    // };

    // TODO: hoisting
    
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
      path: idPath, 
      node: idNode, 
      varNode: idNode, 
      staticTraceData: {
        type: TraceType.Binding,
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

    // TODO: need deferTid etc, ensure the order `binding` -> `read` -> `write`
    //      something like this: `lval = (bindingTrace, rvalTrace(..., bidingTid, inputs=null, writeAfterReadCommand))`
    // TODO: `isNested`

    traces.addTraceWithInputs(writeTraceCfg, initPath.node && [initPath] || EmptyArray);

    // TODO: traceWrite
    // TODO: handle the case where rval was already instrumented
    // traces.addTraceWithInputs({ path: initPath, node: initNode, varNode: idNode, staticTraceData}, [initPath]);
  }

  // exit() {
  //   // creates a new binding
  // }

  // instrument() {
  //   // TODO: wrap rval in td(rval, tid)
  // }
}