import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByRealContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byRealContext');
  }

  makeKey(dp: DataProvider, { traceId }: Trace) {
    return dp.util.getRealContextId(traceId);
  }
}