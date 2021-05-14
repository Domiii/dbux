
import BaseNode from './BaseNode';

export default class FunctionDeclaration extends BaseNode {
  static children = ['id', 'params', 'body'];

  pluginConfigs = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  instrument() {
    const { path } = this;
    const [idPath] = this.getChildPaths();

    const binding = path.scope.getBinding(idPath.node.name);
    
  }
}
