import StaticTrace from '@dbux/common/src/types/StaticTrace';
import CollectionIndex from '../../indexes/CollectionIndex';


/** @extends {CollectionIndex<StaticTrace>} */
export default class StaticTracesByFileIndex extends CollectionIndex {
  /**
   * debug-only: Usually, indexes are partitions of underlying collections. This index is not.
   */
  manyToMany = true;

  constructor() {
    super('traces', 'byPurpose');
  }

  /** 
   * @override
   */
  addEntry(trace) {
    if (trace.purposes) {
      for (const purpose of trace.purposes) {
        const key = purpose.type;
        if (!key) {
          this.logger.warn(`Trace #${trace.traceId} had purposes, but type was not set:`, trace);
          continue;
        }
        this.addEntryToKey(key, trace);
      }
    }
  }
}
