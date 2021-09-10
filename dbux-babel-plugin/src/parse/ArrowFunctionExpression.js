import * as t from "@babel/types";
import BaseNode from './BaseNode';

export default class ArrowFunctionExpression extends BaseNode {
  static children = ['params', 'body'];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  get dontInstrumentContextEnd() {
    // -> does not have a block if it has a custom created return statement
    return !!this.data.returnTraceCfg;
  }

  exit() {
    const { path } = this;
    const [, bodyPath] = this.getChildPaths();

    const Function = this.getPlugin('Function');
    if (!bodyPath.isBlockStatement()) {
      // body is lambda expression -> wrap body with "return trace"
      this.data.returnTraceCfg = this.Traces.addReturnTrace(this, null, bodyPath, bodyPath);
    }

    const traceData = {
      node: this,
      path,
      scope: path.parentPath.scope, // prevent adding `tid` variable to own body
      staticTraceData: Function.createStaticTraceData()
    };

    const traceCfg = this.Traces.addTrace(traceData);
    Function.setFunctionTraceCfg(traceCfg);
  }

  instrument1() {
    const {
      data: {
        returnTraceCfg
      }
    } = this;

    if (returnTraceCfg) {
      const [, bodyPath] = this.getChildPaths();
      // let bodyNode = bodyPath.node;

      // NOTE: This enables us to add `try/finally`
      // NOTE2: `return` implies `ContextEnd`.

      // bodyPath.replaceWith(  // <- this (for some reason) injects an iife
      //   t.blockStatement([t.returnStatement(bodyNode)])
      // );

      this.path.ensureBlock();
    }
  }
}
