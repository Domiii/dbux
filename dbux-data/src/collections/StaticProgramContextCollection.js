import path from 'path';
import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
import { pathJoin, pathNormalized, pathRelative } from '@dbux/common-node/src/util/pathUtil';
import Collection from '../Collection';

// ###########################################################################
// StaticProgramContextCollection
// ###########################################################################

/**
 * @extends {Collection<StaticProgramContext>}
 */
export default class StaticProgramContextCollection extends Collection {
  constructor(dp) {
    super('staticProgramContexts', dp);
  }

  addEntry(entry) {
    super.addEntry(entry);
    if (entry) {
      if (!entry.filePath || !path.isAbsolute(entry.filePath)) {
        this.logger.error('invalid `staticProgramContext.filePath` is not absolute - don\'t know how to resolve', entry.fileName);
      }
       
      // set applicationId, so we can trace any data point back to it's application
      entry.applicationId = this.dp.application.applicationId;
    }
  }

  postAddRaw(entries) {
    for (const entry of entries) {
      entry.filePath = pathNormalized(entry.filePath);
    }
  }

  /**
   * @param {StaticProgramContext} staticProgramContext 
   */
  serialize(staticProgramContext) {
    const staticProgramContextData = { ...staticProgramContext };
    staticProgramContextData.relativeFilePath = pathRelative(this.dp.application.entryPointPath, staticProgramContext.filePath);
    delete staticProgramContextData.filePath;
    return staticProgramContextData;
  }

  deserialize(staticProgramContextData) {
    const staticProgramContext = { ...staticProgramContextData };
    staticProgramContext.filePath = pathJoin(this.dp.application.entryPointPath, staticProgramContext.relativeFilePath);
    delete staticProgramContext.relativeFilePath;
    return staticProgramContext;
  }
}
