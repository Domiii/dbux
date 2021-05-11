import ParsePlugin from '../../parseLib/ParsePlugin';

/**
 * This is for `Program`, `Function`.
 */
export default class StaticContext extends ParsePlugin {
  bindings = new Set();
  globals = new Set();

  // exit(path, state) {
  //   const name = path.node.id?.name || '(anonymous)';
  //   const bindings = Array.from(bindingsStack.pop());
  //   console.log(`${name}@${loc2s(path.node.loc)} - referenced bindings:`, [''].concat(
  //     bindings.map((b) => binding2s(b))
  //   ).join('\n  '));
  // }

  addBinding(path, binding) {
    if (!binding) {
      this.bindings.push(binding);
    }
    else {
      this.globals.push(binding.path.toString());
    }
  }
}