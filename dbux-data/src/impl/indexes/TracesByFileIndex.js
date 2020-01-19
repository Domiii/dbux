import CollectionIndex from '../../indexes/CollectionIndex';

import Trace from 'dbux-common/src/core/data/Trace';
import TraceType from 'dbux-common/src/core/constants/TraceType';

function makeKey(dp: DataProvider, trace: Trace) {
  const {
    contextId,
    // type: dynamicType,
    // staticTraceId,
    // value 
  } = trace;

  const context = dp.collections.executionContexts.getById(contextId);

  const {
    staticContextId,
    // stackDepth
  } = context;

  const staticContext = dp.collections.staticContexts.getById(staticContextId);
  const { programId } = staticContext;

  return programId;
}


export default class TracesByFileIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byFile');
  }

  makeKey = makeKey
}