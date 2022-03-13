import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import makeIncludeContext from './makeIncludeContext';

/** @typedef {import('./GraphDocument').default} GraphDocument */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ContextFilterManager');

const MaxHistoryLength = 50;

const DefaultPredicateCfg = {
  packageWhitelist: '.*',
  packageBlacklist: '',
};

const PredicateKeys = [
  'packageWhitelist',
  'packageBlacklist',
  'fileWhitelist',
  'fileBlacklist',
];

class History {
  constructor(records = []) {
    this._all = records;
  }

  top() {
    return this._all[0];
  }

  push(record) {
    this._all = [record, ...this._all.filter((r) => r !== record)].slice(0, MaxHistoryLength);
  }

  getAll() {
    return this._all;
  }
}

export default class ContextFilterManager {
  _rawPredicate = {};

  /**
   * 
   * @param {GraphDocument} graphDocument 
   */
  constructor(graphDocument) {
    this.doc = graphDocument;
  }

  get externals() {
    return this.doc.componentManager.externals;
  }

  getRawFilter(key) {
    if (key in this._rawPredicate) {
      return this._rawPredicate[key];
    }
    return DefaultPredicateCfg[key];
  }

  async setContextFilter(key) {
    const newValueItem = {
      label: 'New Filter',
      cb: () => this.externals.prompt('New context filter', this._rawPredicate[key])
    };
    const defaultFilterValue = DefaultPredicateCfg[key];
    const defaultItem = {
      label: `Clear Filter (${defaultFilterValue})`,
      cb: () => defaultFilterValue
    };
    const historyItems = this.history[key].getAll().map((val) => {
      return {
        label: wrapLabel(val),
        cb: () => val,
      };
    });
    const quickPickItems = [newValueItem, defaultItem, ...historyItems];
    const pickedItem = await this.externals.showQuickPick(quickPickItems, {
      // placeHolder: historyItems[0]?.label || ''
      placeHolder: '(select a filter below)' // this.getRawFilter(key)
    });
    if (pickedItem) {
      const result = (await pickedItem.cb?.()) ?? pickedItem.label;
      this.set(key, result);
    }
  }

  init() {
    this.history = {};
    this._rawPredicate = {};
    const saved = this.externals.getContextFilter() || EmptyObject;
    for (const key of PredicateKeys) {
      this.history[key] = new History(saved[key]);
      this._rawPredicate[key] = this.history[key].top() ?? DefaultPredicateCfg[key];
    }
    this.makeIncludePredicate();
  }

  _set(prop, value) {
    this._rawPredicate[prop] = value;
    this.history[prop].push(value);
    this.makeIncludePredicate();
    this.save();
  }

  set(prop, value) {
    this._set(prop, value);

    // future-work: also remember and re-initiate GraphNodeMode of all visible nodes
    return this.doc.maybeFullResetGraphs();
  }

  makeIncludePredicate() {
    this.includePredicate = makeIncludeContext(this._rawPredicate);
  }

  async save() {
    try {
      const value = {};
      for (const key of PredicateKeys) {
        value[key] = this.history[key].getAll();
      }
      await this.externals.setContextFilter(value);
    }
    catch (err) {
      logError(err);
    }
  }
}

function wrapLabel(str) {
  // return JSON.stringify(str);
  return str;
}