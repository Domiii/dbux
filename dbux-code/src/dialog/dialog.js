import { newLogger } from '@dbux/common/src/log/logger';
import { get, set } from '../memento';
import DialogNodeKind from './DialogNodeKind';
import _nodeRegistry from './nodes/_nodeRegistry';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Dialog');

async function _startDialog(graph, startState) {
  const mementoKeyName = `${graph.name}`;

  // for debugging
  await set(mementoKeyName, undefined);

  let graphState = get(mementoKeyName, { state: startState, stateStartTime: Date.now() });

  if (graphState.state !== 'end') {
    while (graphState.state !== null) {
      if (!graph.nodes[graphState.state]) {
        throw new Error(`DialogNode '${graphState.state}' not exist`);
      }

      debug(`set dialogState: ${graphState.state}`);

      const node = graph.nodes[graphState.state];
      const NodeClass = _nodeRegistry[node.kind];

      await node.enter?.(graphState);

      if (!NodeClass) {
        throw new Error(`DialogNodeKind '${DialogNodeKind.getName(node.kind)}' not registed`);
      }

      const result = await NodeClass.render(graphState, node, graph.defaultEdges);

      graphState.state = result;
      graphState.stateStartTime = Date.now();

      if (graphState.state !== null) {
        await set(mementoKeyName, graphState);
      }
    }
  }
}

function _errWrap(f) {
  return async (...args) => {
    try {
      await f(...args);
    }
    catch (err) {
      logError(`Error in dialog:`, err);
    }
  };
}

export function startDialog(graph, startState = 'start') {
  _errWrap(_startDialog)(graph, startState);
}