import TraceType from '../constants/TraceType';

export default class Trace {
  applicationId: number;
  traceId: number;
  runId: Number;
  contextId: number;
  staticTraceId: number;
  
  type: TraceType;
  
  value: any;
  valueId: number;
}