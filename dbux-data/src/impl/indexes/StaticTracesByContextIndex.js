import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class StaticTracesByContextIndex extends CollectionIndex {
  constructor() {
    super('staticTraces', 'byContext');
  }

  /** 
   * @param {DataProvider} dp
   * @param {StaticTrace} { staticContextId }
   */
  makeKey(dp, { staticContextId }) {
    return staticContextId;
  }
}