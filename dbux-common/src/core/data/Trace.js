import TraceType from '../constants/TraceType';
import DataEntry from './DataEntry';

export default class Trace implements DataEntry {
  contextId: number;
  staticTraceId: number;
  
  type: TraceType;
  value: any;
}