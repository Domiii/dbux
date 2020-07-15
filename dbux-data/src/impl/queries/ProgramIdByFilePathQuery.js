import { arePathsIdenticalDontResolve } from '@dbux/common/src/util/fileUtil';
import CachedQuery from '../../queries/CachedQuery';


export default class ProgramIdByFilePathQuery extends CachedQuery {
  constructor() {
    super('programIdByFilePath', {
      versionDependencies: ['staticProgramContexts']
    });
  }

  execute(dp, fpath) {
    return dp.collections.staticProgramContexts.find(programContext => 
      arePathsIdenticalDontResolve(programContext.filePath, fpath)
    )?.programId;
  }
}