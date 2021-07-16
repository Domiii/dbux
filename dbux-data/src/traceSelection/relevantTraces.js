import Trace from '@dbux/common/src/types/Trace';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import traceSelection from './index';
import allApplications from '../applications/allApplications';

/**
 * Return an array of traces sorted by the selected trace.
 * @param {Array<Trace>} traces 
 */
export function getSortedReleventTraces(traces) {
  const selectedTrace = traceSelection.selected;

  if (selectedTrace) {
    const sortedTraces = traces.slice().sort(compareTraces);
    return sortedTraces;
  }
  else {
    return traces;
  }
}

// ###########################################################################
//  Compare Util
// ###########################################################################

/**
 * Compare the importance of two traces, return 1 if t1 < t2, return -1 if t1 > t2.
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
export function compareTraces(t1, t2) {
  /**
   * Sort rules:
   *  1. prefer traces of minimum `contextId` (or, if `Resume` or `Await`, `parentContextId`) distance
   *  2. prefer traces of minimum `runId` distance
   *  3. prefer traces of minimum `traceId` distance
   */
  // TODO: In 2., sort by 'firstTracesInOrder' instead of 'runId'
  // TODO: Consider the application difference
  return compareByContextId(t1, t2) ||
    compareByRunId(t1, t2) ||
    compareByTraceId(t1, t2);
}

/**
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
function compareByContextId(t1, t2) {
  const { selected } = traceSelection;
  if (areBothResumeAwait(t1, t2) && getParentContextId(selected)) {
    const t1Distance = Math.abs(getParentContextId(t1) - getParentContextId(selected));
    const t2Distance = Math.abs(getParentContextId(t2) - getParentContextId(selected));
    if (t1Distance < t2Distance) return -1;
    if (t1Distance > t2Distance) return 1;
    return 0;
  }
  else {
    const t1Distance = Math.abs(t1.contextId - selected.contextId);
    const t2Distance = Math.abs(t2.contextId - selected.contextId);
    if (t1Distance < t2Distance) return -1;
    if (t1Distance > t2Distance) return 1;
    return 0;
  }
}

/**
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
function compareByRunId(t1, t2) {
  const { selected } = traceSelection;
  const t1Distance = Math.abs(t1.runId - selected.runId);
  const t2Distance = Math.abs(t2.runId - selected.runId);
  if (t1Distance < t2Distance) return -1;
  if (t1Distance > t2Distance) return 1;
  return 0;
}

/**
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
function compareByTraceId(t1, t2) {
  const { selected } = traceSelection;
  const t1Distance = Math.abs(t1.traceId - selected.traceId);
  const t2Distance = Math.abs(t2.traceId - selected.traceId);
  if (t1Distance < t2Distance) return -1;
  if (t1Distance > t2Distance) return 1;
  return 0;
}

/**
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
function areBothResumeAwait(t1, t2) {
  const t1Type = getTraceType(t1);
  const t2Type = getTraceType(t2);

  // TODO: trace-type
  if (t1Type === TraceType.Resume || t1Type === TraceType.Await) {
    if (t2Type === TraceType.Resume || t2Type === TraceType.Await) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Trace} trace 
 */
function getTraceType(trace) {
  const dp = allApplications.getById(trace.applicationId).dataProvider;
  return dp.util.getTraceType(trace.traceId);
}

/**
 * @param {Trace} trace 
 */
function getParentContextId(trace) {
  const dp = allApplications.getById(trace.applicationId).dataProvider;
  return dp.collections.executionContexts.getById(trace.contextId).parentContextId || null;
}