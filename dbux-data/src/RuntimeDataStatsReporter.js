import difference from 'lodash/difference';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

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

  collectNewStats() { }

  makeNewMessage(txt, allArr, newArr) {
    return `${txt} (${newArr.length}/${allArr.length})${newArr.length && `:\n  ${newArr.join(',')}` || ''}`;
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
    this.oldRequireModuleNames = this.dpUtil.getAllRequireModuleNames();
  }

  reset() {
    this.oldRequireModuleNames = EmptyArray;
  }

  collectNewStats() {
    const { dpUtil: util } = this;

    const { oldRequireModuleNames, reporter: { collectionStats } } = this;

    const allRequireModuleNames = util.getAllRequireModuleNames();
    const newRequireModuleNames = difference(allRequireModuleNames, oldRequireModuleNames);

    // program stats
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;

    // loaded modules
    const allModuleNames = util.getAllExternalProgramModuleNames();
    const newModuleNames = minProgramId && util.getAllExternalProgramModuleNames(minProgramId);

    // untraced modules
    const allUntracedModules = difference(allRequireModuleNames, allModuleNames);
    const newUntracedModules = difference(newRequireModuleNames, allModuleNames);

    return [
      this.makeNewMessage('Newly required external modules', allRequireModuleNames, newRequireModuleNames),
      this.makeNewMessage('Newly traced external modules', allModuleNames, newModuleNames),
      this.makeNewMessage('Required but untraced external modules', allUntracedModules, newUntracedModules)
    ];
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
    // this.oldRequireModuleNames = util.getAllRequireModuleNames();
  }

  collectNewStats() {
    const { dpUtil: util } = this;

    // const { oldRequireModuleNames, reporter: { collectionStats } } = this;

    // required modules
    const allRequireModuleNames = util.getAllRequireModuleNames();
    const newRequireModuleNames = difference(allRequireModuleNames, oldRequireModuleNames);

    // traced modules
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;
    const allModuleNames = util.getAllExternalProgramModuleNames();
    const newModuleNames = minProgramId && util.getAllExternalProgramModuleNames(minProgramId);

    // untraced modules
    const allUntracedModules = difference(allRequireModuleNames, allModuleNames);
    const newUntracedModules = difference(newRequireModuleNames, allModuleNames);

    return [
      this.makeNewMessage('Newly required external modules', allRequireModuleNames, newRequireModuleNames),
      this.makeNewMessage('Newly traced external modules', allModuleNames, newModuleNames),
      this.makeNewMessage('Required but untraced external modules', allUntracedModules, newUntracedModules)
    ];
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
          min: minBy(arr, entry => entry._id)?._id,
          max: maxBy(arr, entry => entry._id)?._id
        }]))
    );

    this.statsInstances.forEach(stats => stats.preData());
  }

  reportNewData(newData) {
    const { collectionStats } = this;

    // collection stats
    const collectionInfo = Object.entries(collectionStats)
      .map(([key, { len, min, max }]) => `${len} ${key} (${min}~${max})`)
      .join('\n ');

    // final messages
    const msgs = [
      `##### Data received #####\nCollection Data:\n ${collectionInfo}`,
      '',
      ...this.statsInstances.map(stats => stats.collectNewStats(newData))
    ];
    this.logger.debug(msgs.join('\n'));
  }

  reportAllData() {
    
  }
}
