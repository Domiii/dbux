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

  get name() {
    return this.path.get('key').toString();
  }

  get isPublic() {
    return true;
  }

  addTrace() {
    const { path } = this;
    const [keyPath] = this.getChildPaths();

    const Function = this.getPlugin('Function');
    const traceCfg = this.Traces.addTrace({
      path,
      node: this,
      scope: this.getExistingParent().peekContextNode().path.scope, // prevent adding `tid` variable to own body
      staticTraceData: Function.createStaticTraceData(keyPath),
      meta: { instrument: null }
    });
    
    Function.setFunctionTraceCfg(traceCfg);

    return traceCfg;
  }
}