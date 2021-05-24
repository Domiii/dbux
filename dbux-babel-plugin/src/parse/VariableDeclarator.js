// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildTraceWrite } from '../instrumentation/builders/trace';
import BaseNode from './BaseNode';

// TODO: very similar to `AssignmentExpression` but (1) not an expression, (2) optional rval, (3) more limited lvals
export default class VariableDeclarator extends BaseNode {
  static children = ['id', 'init'];
  static plugins = [
    'BindingNode'
  ];

  /**
   * NOTE: Might return null, if variable has no initial value.
   * 
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }


  exit() {
    const { path, Traces } = this;

    const [, initPath] = this.getChildPaths();
    const [idNode] = this.getChildNodes();

    // ddg: declaration
    this.peekStaticContext().addDeclaration(idNode);

    if (!initPath.node) {
      // nothing to write
      return;
    }

    // ddg: write
    const writeTraceCfg = {
      path,
      node: this,
      varNode: idNode,
      staticTraceData: {
        type: TraceType.WriteVar
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite,
        build: buildTraceWrite,
        replacePath: initPath
      }
    };

    Traces.addTraceWithInputs(writeTraceCfg, [initPath]);

    // traces.addTraceWithInputs({ path: initPath, node: initNode, staticTraceData}, [initPath]);
  }

  // exit() {
  //   // creates a new binding
  // }

  // instrument() {
  //   // TODO: wrap rval in td(rval, tid)
  // }
}