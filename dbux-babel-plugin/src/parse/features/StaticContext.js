import ParseNodeFeature from '../../parseLib/ParseNodeFeature';

/**
 * This is for `Program`, `Function`.
 */
export default class StaticContext extends ParseNodeFeature {
  enter() {
    bindingsStack.push(new Set());
  }
  
  exit(path, state) {
    const name = path.node.id?.name || '(anonymous)';
    const bindings = Array.from(bindingsStack.pop());
    console.log(`${name}@${loc2s(path.node.loc)} - referenced bindings:`, [''].concat(
      bindings.map((b) => binding2s(b))
    ).join('\n  '));
  }
}