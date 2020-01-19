import CachedQuery from '../../queries/CachedQuery';

export default class ProgramIdByFilePathQuery extends CachedQuery {
  constructor() {
    super('programIdByFilePath', {
      // TODO: optimization (only need to flush `null` values on version update)
      versionDependencies: ['staticProgramContexts']
    });
  }

  execute(dp, fpath) {
    return dp.collections.staticProgramContexts.all.find(e => e.filePath === fpath)?.programId;
  }
}