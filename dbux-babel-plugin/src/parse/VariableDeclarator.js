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

  enter() {
    this.peekStaticContext().addDeclaration(this);
  }

  exit() {
    const traces = this.getPlugin('Traces');

    const [idPath, initPath] = this.getChildPaths(true);
    const [idNode, initNode] = this.getChildNodes();

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

    // TODO: move `BindingIdentifier` binding collection code back to `ReferencedIdentifier`
    // TODO: add `binding` trace
    // TODO: insert `binding` trace at top of scope block (see `Scope.push` for reference)
    //        -> create `binding` trace on `enter`
    // TODO: fix peekNode, peekNodePlugin to just use `parentPath`, instead of trying to decipher stack?

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