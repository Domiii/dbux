import Trace from '@dbux/common/src/types/Trace';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import CollectionIndex from '../../indexes/CollectionIndex';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByPurposeIndex extends CollectionIndex {
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
      // multiple, complex purposes
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
