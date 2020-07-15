import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class StaticTracesByContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('staticTraces', 'byContext');
  }

  makeKey(dp: DataProvider, { staticContextId }: StaticTrace) {
    return staticContextId;
  }
}