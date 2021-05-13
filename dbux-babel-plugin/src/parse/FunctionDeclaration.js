
import BaseNode from './BaseNode';

export default class FunctionDeclaration extends BaseNode {
  pluginNames = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  instrument() {
    
  }
}
