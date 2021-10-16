import path from 'path';
import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
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
    if (!entry) {
      return;
    }
    if (!entry.filePath || !path.isAbsolute(entry.filePath)) {
      this.logger.error('invalid `staticProgramContext.filePath` is not absolute - don\'t know how to resolve', entry.fileName);
    }

    // set applicationId, so we can trace any data point back to it's application
    entry.applicationId = this.dp.application.applicationId;
    super.addEntry(entry);
  }

  /**
   * @param {StaticProgramContext} staticProgramContext 
   */
  serialize(staticProgramContext) {
    const staticProgramContextData = { ...staticProgramContext };
    staticProgramContextData.relativeFilePath = path.relative(this.dp.application.entryPointPath, staticProgramContext.filePath).replace(/\\/g, '/');
    delete staticProgramContextData.filePath;
    return staticProgramContextData;
  }

  deserialize(staticProgramContextData) {
    const staticProgramContext = { ...staticProgramContextData };
    staticProgramContext.filePath = path.join(this.dp.application.entryPointPath, staticProgramContext.relativeFilePath);
    delete staticProgramContext.relativeFilePath;
    return staticProgramContext;
  }
}
