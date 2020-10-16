import CachedQuery from '../../queries/CachedQuery';
import RuntimeDataProvider from '../../RuntimeDataProvider';


export default class ProgramFilePathByTraceIdQuery extends CachedQuery {
  constructor() {
    super('programFilePathByTraceId', {
      versionDependencies: ['traces']
    });
  }

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {*} traceId 
   */
  execute(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const { programId } = dp.collections.staticContexts.getById(staticContextId);
    const { filePath } = dp.collections.staticProgramContexts.getById(programId);

    return filePath;
  }
}