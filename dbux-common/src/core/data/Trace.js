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
   * This is currently only set for `Pop` traces (to enable error tracking).
   */
  previousTrace: number;

  /**
   * NOTE: this is the dynamic type only.
   *       Use DataProvider.util.getTraceType to get actual TraceType.
   */
  type: TraceType;
}