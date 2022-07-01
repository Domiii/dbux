// /** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
// /** @typedef {import('./DataDependencyGraph').default} DataDependencyGraph */




// TODO: the PDGView parameterizes control of the PDG
//    Specifically: it allows to easily merge/unmerge PDG subgraphs





// mergeGroups() {
//   const visited = new Set();
//   for (let i = allPDGNodes.length-1; i >= 0; --i) {
//     const n = allPDGNodes[i];
//     handleVisited;

//     this.mergeComputesFromWrite(n);

//     // TODO: also merge constant Create nodes into one
//     //    → when a Create node is found: recursively merge all all constants and Create nodes into it (e.g. `{ a: [1, 2], b: 3 }` should only be one node)
//   }
// }
// mergeComputesFromWrite(n) {
//   if (!isWriteNode(n)) {
//     return;
//   }

//   for (const input of n.getInputs()) {
//     // NOTE: n.inputs.length should usually be 1 (for a write node), but who knows...

//     if (!isComputeNode(input)) {
//       continue;
//     }

//     const mergeState = {
//       isWatched: false, 
//       mergeSet: [],
//       fringe: new Map() // maps fringe node → count
//     };
//     this._mergeComputesFromWrite(input, mergeState);

//     if (mergeState.isWatched) {
//       if (mergeState.mergeSet.length > 1) {
//         remove mergeSet from graph;
//         for ([f, count] of fringe.entries()) { 
//           add(new PDGGroupEdge(f, firstInput, count));
//         }
//       }
//     }
//     else {
//         remove input from graph;
//         remove mergeSet from graph;
//         for ([f, count] of fringe.entries()) { 
//           add(new PDGGroupEdge(f, n, count));
//         }
//     }
//   }
// }

// _mergeComputesFromWrite(n, mergeState) {
//   if (isWatched(n)) {
//     mergeState.isWatched = true;
//     // mergeState.fringe.add(n); // TODO: keep count
//   }
//   else {
//     for (const input of n.inputs) {
//       if (
//         isWriteNode(n) ||
//         (!isComputeNode(n) && !hasInputs(n))    // e.g. constant inputs
//       ) {
//         // mergeState.fringe.add(n); // TODO: keep count
//       }
//       else {
//         mergeState.mergeSet.push(n);

//         // recurse
//         this._mergeComputesFromWrite(n, mergeState);
//       }
//     }
//   }
// }