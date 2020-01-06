function mergeOne(visitorName, ...visitors) {
  let actionKeys = visitors.map(v => Object.keys(v));
  actionKeys = new Set(actionKeys.flat());
  const result = {};
  for (const actionKey of actionKeys) {
    const actions = visitors.map(v => v[actionKey]).filter(v => !!v);
    const f = function _mergedVisitor(actions, ...args) {
      for (const action of actions) {
        action.apply(this, args);
      }
    }.bind(null, actions);
    result[actionKey] = f;
  }
  return result;
}

export function mergeVisitors(...visitorCollections) {
  // one concern is: running subsequent visitors on generated nodes of previous visitors;
  //    luckily, this will work fine, since newly generated nodes will be culled by the instrumentors.
  const result = {};
  for (const collection of visitorCollections) {
    for (const visitorName in collection) {
      let newVisitor = collection[visitorName];
      const previousVisitor = result[visitorName];
      if (previousVisitor) {
        // merge
        newVisitor = mergeOne(visitorName, newVisitor, previousVisitor);
      }
      result[visitorName] = newVisitor;
    }
  }
  return result;
}