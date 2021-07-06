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

    // TODO: computed

    return this.Traces.addTrace({
      path,
      node: this,
      scope: this.getExistingParent().peekContextNode().path.scope, // prevent adding `tid` variable to own body
      staticTraceData: this.getPlugin('Function').createStaticTraceData(keyPath),
      meta: { instrument: null }
    });
  }
}