import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class ArrowFunctionExpression extends BaseNode {
  static children = ['params', 'body'];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  exit() {
    const { path } = this;
    const [, bodyPath] = this.getChildPaths();

    if (!bodyPath.isBlockStatement()) {
      // body is lambda expression -> wrap body with "return trace"
      // NOTE: this is executed before `Function.exit`
      this.data.returnTraceCfg = this.Traces.addReturnTrace(null, bodyPath, bodyPath);
    }

    const traceData = {
      node: this,
      path,
      scope: path.parentPath.scope, // prevent adding `tid` variable to own body
      staticTraceData: this.getPlugin('Function').createStaticTraceData()
    };

    this.Traces.addTrace(traceData);
  }

  instrument() {
    const {
      plugins: {
        Function: {
          data: {
            returnTraceCfg
          }
        }
      }
    } = this;

    if (returnTraceCfg) {
      const [, bodyPath] = this.getChildPaths();
      let bodyNode = bodyPath.node;
      
      // NOTE: This enables us to add `try/finally`
      // NOTE2: `return` implies `ContextEnd`.
      bodyPath.replaceWith(t.blockStatement([t.returnStatement(bodyNode)]));
    }
  }
}
