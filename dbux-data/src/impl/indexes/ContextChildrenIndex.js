import CollectionIndex from '../../indexes/CollectionIndex';

import Trace from 'dbux-common/src/core/data/Trace';
import TraceType from 'dbux-common/src/core/constants/TraceType';

import DataProvider from '../../DataProvider';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  return context.parentContextId;
}


export default class ContextChildrenIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'children');
  }

  makeKey = makeKey
}