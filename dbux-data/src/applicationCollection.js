import NanoEvents from 'nanoevents';
import { newLogger } from 'dbux-common/src/log/logger';
import isString from 'lodash/isString';
import pull from 'lodash/pull';


import Application from './Application';
import { areArraysEqual } from '../../dbux-common/src/util/arrayUtil';
import ApplicationSelection from './ApplicationSelection';
import ApplicationSelectionData from './ApplicationSelectionData';

const { log, debug, warn, error: logError } = newLogger('applications');

function extractFilePathFromInitialData(initialData) {
  const staticProgramContexts = initialData?.staticProgramContexts;
  const entryPoint = staticProgramContexts && staticProgramContexts[0];
  if (entryPoint && entryPoint.programId === 1) {
    return entryPoint.filePath;
  }
  return null;
}

/**
 * @callback selectionChangedCallback
 * @param {Application[]} applications
 */

/**
 * ApplicationCollection manages all application throughout the life-time of the dbux-data module.
 */
export class ApplicationCollection {
  DefaultApplicationClass = Application;

  _all = [null];
  _activeApplications = new Map();

  _emitter = new NanoEvents();

  constructor() {
    this.applicationSelection = new ApplicationSelection(this);
  }

  getById(applicationId: Application) {
    return this._all[applicationId];
  }

  getApplication(applicationOrIdOrEntryPointPath: number | string | Application): Application {
    const application = this.tryGetApplication(applicationOrIdOrEntryPointPath);
    if (!application) {
      throw new Error('invalid applicationOrIdOrEntryPointPath: ' + applicationOrIdOrEntryPointPath);
    }
    return application;
  }

  tryGetApplication(applicationOrIdOrEntryPointPath: number | string | Application): Application {
    let application;
    if (applicationOrIdOrEntryPointPath instanceof Application) {
      // application
      application = applicationOrIdOrEntryPointPath;
    }
    else if (isString(applicationOrIdOrEntryPointPath)) {
      // entryPointPath
      application = this.getActiveApplicationByEntryPoint(applicationOrIdOrEntryPointPath);
    }
    else {
      // applicationId
      application = this.getById(applicationOrIdOrEntryPointPath);
    }
    return application;
  }

  getActiveApplicationByEntryPoint(entryPointPath) {
    return this._activeApplications.get(entryPointPath);
  }

  isApplicationActive(applicationOrIdOrEntryPointPath) {
    const application = this.getApplication(applicationOrIdOrEntryPointPath);
    return application && !!this.getActiveApplicationByEntryPoint(application.entryPointPath);
  }

  getOrCreateApplication(initialData): Application {
    // TODO: fix this to support reconnects
    const entryPointPath = extractFilePathFromInitialData(initialData);
    if (!entryPointPath) {
      return null;
    }
    const application = this._addApplication(entryPointPath);
    return application;
  }

  // ###########################################################################
  // add + remove applications
  // ###########################################################################

  /**
   * @private
   */
  _addApplication(entryPointPath) {
    const applicationId = this._all.length;
    const application = new this.DefaultApplicationClass(applicationId, entryPointPath, this);
    const previousApplication = this.getActiveApplicationByEntryPoint(entryPointPath);

    this._activeApplications.set(entryPointPath, application);
    this._all[applicationId] = application;

    if (previousApplication) {
      this._emitter.emit('restarted', application, previousApplication);
      debug('restarted', entryPointPath);
    }
    else {
      this._emitter.emit('added', application);
      debug('added', entryPointPath);
    }

    if (previousApplication && this.selection.isApplicationSelected(previousApplication)) {
      // application restarted -> automatically deselect previous instance
      this.applicationSelection.deselectApplication(previousApplication);
    }
    
    // always add new application to set of selected applications
    this.applicationSelection.selectApplication(application);

    return application;
  }

  removeApplication(applicationOrId) {
    const application = this.getApplication(applicationOrId);

    if (!application) {
      throw new Error('invalid applicationOrId in `removeApplication`: ' + applicationOrId);
    }

    // deselect (will also trigger event)
    if (this._selectedApplications === application) {
      this.applicationSelection.deselectApplication(application.applicationId);
    }

    // remove
    const { applicationid, entryPointPath } = application;
    this._all[applicationid] = null;
    if (this.getActiveApplicationByEntryPoint(entryPointPath) === application) {
      this._activeApplications.delete(entryPointPath);
    }

    // `removed` event
    this._emitter.emit('removed', application);
  }

  clear() {
    this._all = [null];
    this._activeApplications = new Map();

    this.applicationSelection._setSelectedApplications(null);

    this._emitter.emit('clear');
  }

  /**
   * Clears all applications that have already been restarted.
   */
  clearRestarted() {
    // TODO: clear all applications that are in  `_all` but not in `activeApplications`
    throw new Error('NYI');
  }

  get selection() {
    return this.applicationSelection;
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  onAdded(cb) {
    return this._emitter.on('added', cb);
  }

  onRemoved(cb) {
    return this._emitter.on('removed', cb);
  }

  onClear(cb) {
    return this._emitter.on('clear', cb);
  }

  onRestarted(cb) {
    return this._emitter.on('restarted', cb);
  }
}

/**
 * @type {ApplicationCollection}
 */
let applicationCollection
try {
  applicationCollection = new ApplicationCollection();
}
catch (err) {
  logError(err);
  debugger;
}

export default applicationCollection;