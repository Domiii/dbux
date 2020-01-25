import CachedQuery from '../../queries/CachedQuery';
import { arePathsIdenticalDontResolve } from 'dbux-common/src/util/fileUtil';
import path from 'path';


export default class ProgramIdByFilePathQuery extends CachedQuery {
  constructor() {
    super('programIdByFilePath', {
      // TODO: optimization (only need to flush `null` values on version update)
      versionDependencies: ['staticProgramContexts']
    });
  }

  execute(dp, fpath) {
    return dp.collections.staticProgramContexts.find(programContext => 
      arePathsIdenticalDontResolve(programContext.filePath, fpath)
    )?.programId;
  }
}