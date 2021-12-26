import SubscribableQuery from '../queries/SubscribableQuery';

export default class PackageQuery extends SubscribableQuery {
  constructor() {
    super('packagesByProgramId', {
      collectionNames: ['staticProgramContext']
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
