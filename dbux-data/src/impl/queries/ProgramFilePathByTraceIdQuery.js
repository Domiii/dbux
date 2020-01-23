import CachedQuery from '../../queries/CachedQuery';
import path from 'path';
import DataProvider from '../../DataProvider';


export default class ProgramFilePathByTraceId extends CachedQuery {
  constructor() {
    super('programFilePathByTraceId', {
      // TODO: optimization (only need to flush `null` values on version update)
      versionDependencies: ['traces']
    });
  }

  execute(dp: DataProvider, traceId) {

    const { contextId } = dp.collections.traces.getById(traceId);
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const { programId } = dp.collections.staticContexts.getById(staticContextId);
    const { filePath } = dp.collections.staticProgramContexts.getById(programId);

    return filePath;
  }
}