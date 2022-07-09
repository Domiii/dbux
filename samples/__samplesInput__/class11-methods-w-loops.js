class A {
  f(module) {
    for (module of queue) {
      queue.delete(module);
      depth = moduleGraph.getDepth(module) + 1;

      for (const connection of moduleGraph.getOutgoingConnections(module)) {
        const refModule = connection.module;
        if (refModule) {
          processModule(refModule);
        }
      }
    }
  }
}