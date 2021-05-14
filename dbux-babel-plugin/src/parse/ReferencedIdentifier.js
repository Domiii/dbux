import BaseNode from './BaseNode';

export default class ReferencedIdentifier extends BaseNode {
  enter() {
    const { path } = this;
    // see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
    const binding = path.scope.getBinding(path.node.name);

    // NOTE: `!binding` indicates that this is a global (or otherwise not previously defined variable)

    // if (!binding) {
    //   throw new Error(`Weird Babel issue - ReferencedIdentifier does not have binding - ${this}`);
    // }

    const plugin = this.stack.peekPlugin('StaticContext');
    plugin.addBinding(path, binding);
  }
}