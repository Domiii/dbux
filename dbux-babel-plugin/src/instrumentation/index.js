import { instrumentInstructionFlowEventStream as instrumentBodyEventStream } from './eventStreams';


const visited = new Set();

/**
 * NOTE: each node might be visited more than once.
 * This function keeps track of that and returns whether this is the first time visit.
 */
function onInstrument(path) {
  if (visited.has(path)) {
    return false;
  }
  visited.add(path);
  return true;
}

export function instrumentBodyRegister(path) {
  // TODO
}

export function instrumentProgram(path) {
  if (!onInstrument(path)) return;


  const bodyPath = path.get('body');
  instrumentBodyEventStream(bodyPath);
}

export function instrumentFunction(path) {
  if (!onInstrument(path)) return;

  const bodyPath = path.get('body');
  instrumentBodyRegister(path);
  instrumentBodyEventStream(bodyPath);
}