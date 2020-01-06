export function mergeVisitors(...visitorCollections) {
  // one concern is: running subsequent visitors on generated nodes of previous visitors;
  //    luckily, this will work fine, since newly generated nodes will be culled by the instrumentors.
  const result = {};
  for (const collection of visitorCollections) {
    for (const visitorName in collection) {
      let nextVisitor = collection[visitorName];
      const previousVisitor = result[visitorName];
      if (previousVisitor) {
        // merge
        nextVisitor = function _mergedVisitor(previousVisitor, nextVisitor, ...args) {
          previousVisitor(...args);
          nextVisitor(...args);
        }.bind(null, previousVisitor, nextVisitor);
      }
      result[visitorName] = nextVisitor;
    }
  }
  return result;
}