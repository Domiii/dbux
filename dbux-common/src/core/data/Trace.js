import TraceType from '../constants/TraceType';

export default class Trace {
  traceId: number;
  applicationId: number;
  contextId: number;
  staticTraceId: number;
  staticContextId: number;
  
  type: TraceType;
  
  value: any;
  valueId: number;
}