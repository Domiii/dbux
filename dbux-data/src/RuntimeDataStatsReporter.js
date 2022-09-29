import difference from 'lodash/difference';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTraceLabel } from './helpers/makeLabels';

/** @typedef { import("./RuntimeDataProvider").default } RuntimeDataProvider */

// ###########################################################################
// StatsBase
// ###########################################################################

class StatsBase {
  /**
   * @type {RuntimeDataStatsReporter}
   */
  reporter;

  constructor(reporter) {
    this.reporter = reporter;
  }

  get dp() { return this.reporter.dp; }

  get dpUtil() { return this.reporter.dp.util; }

  init() { }

  preData() { }

  collect() {
    this.result = [];
    this.collectNewStats();
    return this.result;
  }

  collectNewStats() { }

  add(x) {
    this.result.push(x);
  }

  addMessage(txt, allArr, newArr) {
    this.add(
      `${txt} (${newArr?.length || 0}/${allArr?.length || 0})${newArr?.length && `: ${newArr?.join(',')}` || ''}`
    );
  }
}

// ###########################################################################
// Modules
// ###########################################################################

/**
 * TODO: normalize module paths
 * TODO: import + dynamic `import`
 */
class ModuleStats extends StatsBase {
  preData() {
    this.oldRequireModuleNames = this.dpUtil.getAllRequirePackageNames();
  }

  reset() {
    this.oldRequireModuleNames = EmptyArray;
  }

  collectNewStats() {
    const { dpUtil: util } = this;

    const { oldRequireModuleNames, reporter: { collectionStats } } = this;

    const allRequireModuleNames = util.getAllRequirePackageNames();
    const newRequireModuleNames = difference(allRequireModuleNames, oldRequireModuleNames);

    // program stats
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;

    // loaded modules
    const allModuleNames = util.getAllPackageNames();
    const newModuleNames = minProgramId && util.getAllPackageNames(minProgramId);

    // untraced modules
    const allUntracedModules = difference(allRequireModuleNames, allModuleNames);
    const newUntracedModules = difference(newRequireModuleNames, allModuleNames);

    newRequireModuleNames.length && 
      this.addMessage('Newly required external modules', allRequireModuleNames, newRequireModuleNames);
    newModuleNames?.length && 
      this.addMessage('Newly traced external modules', allModuleNames, newModuleNames);
    newUntracedModules.length &&
      this.addMessage('Required but untraced external modules', allUntracedModules, newUntracedModules);
  }

  collectAllMessages() {
    // TODO
  }
}

// ###########################################################################
// Functions
// ###########################################################################

class FunctionStats extends StatsBase {
  preData() {
    this.oldUntracedFunctionCallsByRefId = this.dpUtil.getAllUntracedFunctionCallsByRefId();
  }

  collectNewStats() {
    const { dpUtil: util } = this;

    const { oldUntracedFunctionCallsByRefId } = this;
    const oldUntracedRefIds = Object.keys(oldUntracedFunctionCallsByRefId);

    // untraced functions
    const allUntracedFunctionCallTracesByRefId = util.getAllUntracedFunctionCallsByRefId();
    const allUntracedRefIds = Object.keys(allUntracedFunctionCallTracesByRefId);
    const newUntracedRefIds = difference(allUntracedRefIds, oldUntracedRefIds);
    const newUntracedNames = newUntracedRefIds
      .map(refId => allUntracedFunctionCallTracesByRefId[refId][0])       // first BCE of refId
      .map(trace => util.getCalleeTrace(trace.traceId))                   // -> callee
      .map(makeTraceLabel);                                               // -> label

    newUntracedNames.length && 
      this.addMessage('Untraced functions', allUntracedRefIds, newUntracedNames);
  }
}

// ###########################################################################
// RuntimeDataStatsReporter
// ###########################################################################

export default class RuntimeDataStatsReporter {
  /**
   * @type {RuntimeDataProvider}
   */
  dp;

  statsClasses = [
    ModuleStats,
    FunctionStats
  ];

  /**
   * @type {Array.<StatsBase>}
   */
  statsInstances;

  constructor(dp) {
    this.dp = dp;

    this.statsInstances = this.statsClasses.map(Clazz => {
      const stats = new Clazz(this);
      stats.init();
      return stats;
    });
  }

  preData(data) {
    this.collectionStats = Object.fromEntries(
      Object.entries(data)
        .map(([key, arr]) => ([key, {
          len: arr.length,
          min: minBy(arr, entry => entry?._id || 0)?._id || 0,
          max: maxBy(arr, entry => entry?._id || 0)?._id || 0
        }]))
    );

    // NOTE: disabled for performance reasons ↓
    // this.statsInstances.forEach(stats => stats.preData());
  }

  reportNewData(newData) {
    // NOTE: disabled for performance reasons ↓
    // const { collectionStats } = this;

    // // collection stats
    // const collectionInfo = Object.entries(collectionStats)
    //   .map(([key, { len, min, max }]) => `${len} ${key} (${min}~${max})`)
    //   .join(', ');

    // // final messages
    // const msgs = [
    //   `##### Data received ##### ${collectionInfo}`,
    //   ...this.statsInstances
    //     .map(stats => stats.collect(newData)?.join(''))
    //     .filter(s => !!s)
    // ];

    // this.dp.logger.debug(msgs.join('\n '));
  }

  reportAllData() {

  }
}
