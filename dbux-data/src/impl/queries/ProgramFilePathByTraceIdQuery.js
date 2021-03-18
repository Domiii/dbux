import CachedQuery from '../../queries/CachedQuery';
import RuntimeDataProvider from '../../RuntimeDataProvider';


export default class ProgramFilePathByTraceIdQuery extends CachedQuery {
  constructor() {
    super('programFilePathByTraceId', {
      collectionNames: ['traces']
    });
  }

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {*} traceId 
   */
  executeQuery(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const { programId } = dp.collections.staticContexts.getById(staticContextId);
    const { filePath } = dp.collections.staticProgramContexts.getById(programId);

    return filePath;
  }
}