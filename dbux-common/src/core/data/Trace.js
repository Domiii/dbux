import TraceType from '../constants/TraceType';

export default class Trace {
  applicationId: number;
  traceId: number;
  runId: Number;
  contextId: number;
  staticTraceId: number;

  /**
   * NOTE: this is the dynamic type only.
   *       Use DataProvider.util.getTraceType to get actual TraceType.
   */
  type: TraceType;
  
  value: any;
  valueId: number;
}