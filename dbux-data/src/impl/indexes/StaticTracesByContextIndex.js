import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class StaticTracesByContextIndex extends CollectionIndex {
  constructor() {
    super('staticTraces', 'byContext');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {StaticTrace} { staticContextId }
   */
  makeKey(dp, { staticContextId }) {
    return staticContextId;
  }
}