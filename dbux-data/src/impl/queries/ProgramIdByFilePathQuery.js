import CachedQuery from '../../queries/CachedQuery';

export default class ProgramIdByFilePathQuery extends CachedQuery {
  constructor() {
    super('programIdByFilePath', {
      // adding new data does not affect already cached data
      versionDependencies: []
    });
  }

  execute(dp, fpath) {
    return dp.collections.staticProgramContexts.all.find(e => e.filePath === fpath)?.programId;
  }
}