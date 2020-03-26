import TraceType from '../constants/TraceType';
import HasValue from './HasValue';

export default class Trace extends HasValue {
  traceId: number;
  staticTraceId: number;
  applicationId: number;
  runId: number;
  contextId: number;

  loopId: number;

  /**
   * Whether this is the last trace (before the pop(s) in a context).
   */
  isLastInContext: boolean;

  /**
   * NOTE: this is the dynamic type only.
   *       Use DataProvider.util.getTraceType to get actual TraceType.
   */
  type: TraceType;
}