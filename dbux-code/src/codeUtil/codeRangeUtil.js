import allApplications from '@dbux/data/src/applications/allApplications';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * @param {Trace} trace 
 */
export function getRangeByTrace(trace) {
  const { applicationId, staticTraceId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;
  const { loc } = dp.collections.staticTraces.getById(staticTraceId);
  return babelLocToCodeRange(loc);
}

/**
 * Compare two traces with their range:
 *  returns 0  if they are equal,
 *  returns 1  if t1 contains t2,
 *  returns -1 if t2 contains t1
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
export function compareTraceInner(t1, t2) {
  const range1 = getRangeByTrace(t1);
  const range2 = getRangeByTrace(t2);

  if (range1.contains(range2)) {
    if (range1.isEqual(range2)) {
      return 0;
    }
    return 1;
  }
  return -1;
}

export function tracesIntersection(t1, t2) {
  const range1 = getRangeByTrace(t1);
  const range2 = getRangeByTrace(t2);

  return range1.intersection(range2) || null;
}