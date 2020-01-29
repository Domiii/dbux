import { arePathsIdenticalDontResolve } from 'dbux-common/src/util/fileUtil';
import CachedQuery from '../../queries/CachedQuery';


export default class VisitedStaticTracesByFilePathQuery extends CachedQuery {
  constructor() {
    super('visitedStaticTracesByFilePath', {
      versionDependencies: ['staticTraces']
    });
  }

  execute(dp, fpath) {
    return dp.collections.staticProgramContexts.find(programContext =>
      arePathsIdenticalDontResolve(programContext.filePath, fpath)
    )?.programId;
  }
}