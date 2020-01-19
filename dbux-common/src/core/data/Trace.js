import TraceType from '../constants/TraceType';
import DataEntry from './DataEntry';

export default class Trace implements DataEntry {
  contextId: number;
  type: TraceType;
  value: any;
}