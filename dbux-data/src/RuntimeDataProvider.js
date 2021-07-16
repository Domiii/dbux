import difference from 'lodash/difference';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import AsyncNode from '@dbux/common/src/types/AsyncNode';

import Collection from './Collection';

import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';



// ###########################################################################
// RDP
// ###########################################################################

export default class RuntimeDataProvider extends DataProviderBase {
  /**
   * @type {DataProviderUtil}
   */
  util;

  constructor(application) {
    super('RuntimeDataProvider');

    this.application = application;

    // NOTE: we have to hardcode these so we get Intellisense
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this),
      dataNodes: new DataNodeCollection(this),
      values: new ValueRefCollection(this),
      asyncNodes: new AsyncNodeCollection(this),
      asyncEvents: new AsyncEventCollection(this)
    };

    // const collectionClasses = [
    //   StaticProgramContextCollection,
    //   StaticContextCollection,
    //   StaticTraceCollection,

    //   ExecutionContextCollection,
    //   TraceCollection,
    //   ValueCollection
    // ];
    // this.collections = Object.fromEntries(collectionClasses.map(Col => {
    //   const col = new Col(this);
    //   return [col.name, col];
    // }));
  }

  addData(data, isRaw = true) {
    const oldRequireModuleNames = this.util.getAllRequireModuleNames();
    const result = super.addData(data, isRaw);

    this._reportNewDataStats(data, oldRequireModuleNames);

    return result;
  }

  _reportNewDataStats(data, oldRequireModuleNames) {
    const collectionStats = Object.fromEntries(
      Object.entries(data)
        .map(([key, arr]) => ([key, {
          len: arr.length,
          min: minBy(arr, entry => entry._id)?._id,
          max: maxBy(arr, entry => entry._id)?._id
        }]))
    );

    // collection stats
    const collectionInfo = Object.entries(collectionStats)
      .map(([key, { len, min, max }]) => `${len} ${key} (${min}~${max})`)
      .join('\n ');

    // require stats
    // TODO: import + dynamic `import``
    const allRequireModuleNames = this.util.getAllRequireModuleNames();
    const newRequireModuleNames = difference(allRequireModuleNames, oldRequireModuleNames);
    const requireInfo = `Newly required external modules (${newRequireModuleNames.length}/${allRequireModuleNames.length}):\n  ${newRequireModuleNames.join(',')}`;

    // program stats
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;
    const allModuleNames = this.util.getAllExternalProgramModuleNames();
    const newModuleNames = minProgramId && this.util.getAllExternalProgramModuleNames(minProgramId);
    const moduleInfo = `Newly traced external modules (${newModuleNames?.length || 0}/${allModuleNames.length}):\n  ${newModuleNames?.join(',') || ''}`;

    const allMissingModules = difference(allRequireModuleNames, allModuleNames);
    const newMissingModules = difference(newRequireModuleNames, allModuleNames);
    const missingModuleInfo = newMissingModules.length &&
      `Required but untraced external modules (${newMissingModules.length}/${allMissingModules.length}):\n  ${newMissingModules.join(',')}`;

    // final message
    const msgs = [
      `##### Data received #####\nCollection Data:\n ${collectionInfo}`,
      '',
      requireInfo,
      moduleInfo,
      missingModuleInfo
    ];
    this.logger.debug(msgs.join('\n'));
  }
}
