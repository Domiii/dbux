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

  let { state, stateStartTime } = get(mementoKeyName, { state: startState, stateStartTime: Date.now() });

  if (state !== 'end') {
    while (state !== null) {
      if (!graph.nodes[state]) {
        throw new Error(`DialogNode '${state}' not exist`);
      }

      debug(`set dialogState: ${state}`);

      const node = graph.nodes[state];
      const NodeClass = _nodeRegistry[node.kind];

      await node.enter?.();

      if (!NodeClass) {
        throw new Error(`DialogNodeKind '${DialogNodeKind.getName(node.kind)}' not registed`);
      }

      const result = await NodeClass.render(state, node, graph.defaultEdges);

      state = result;
      stateStartTime = Date.now();

      if (state !== null) {
        await set(mementoKeyName, { state, stateStartTime });
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