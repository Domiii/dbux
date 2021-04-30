
function debugTag(obj) {
  return obj.debugTag || obj.name || obj.toString();
}

/**
 * Track read and write dependencies as we move through the AST.
 */
export default class DependencyTree {
  push(ParseStateClazz) {
    const { prop } = ParseStateClazz;
    if (!prop) {
      throw new Error(`ParseStateClazz.prop is missing for: ${debugTag(ParseStateClazz)}`);
    }

    // TODO
  }

  pop(ParseStateClazz) {
    // TODO
  }
}