import TraceType from '../constants/TraceType';

export default class Trace {
  applicationId: number;
  traceId: number;
  contextId: number;
  staticTraceId: number;
  staticContextId: number;
  
  type: TraceType;
  
  value: any;
  valueId: number;
}