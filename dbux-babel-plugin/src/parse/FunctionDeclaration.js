
import BaseNode from './BaseNode';

export default class FunctionDeclaration extends BaseNode {
  pluginConfigs = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  instrument() {
    
  }
}
