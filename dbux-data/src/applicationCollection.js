import NanoEvents from 'nanoevents';
import { newLogger } from 'dbux-common/src/log/logger';
import isString from 'lodash/isString';
import pull from 'lodash/pull';


import Application from './Application';
import { areArraysEqual } from '../../dbux-common/src/util/arrayUtil';

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
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback fileSelectedApplicationCallback
 * @param {Application} application
 * @param {number} programId
 */

/**
 * ApplicationCollection manages all application throughout the life-time of the dbux-data module.
 */
class ApplicationCollection {
  _selectedApplicationIds = new Set();
  _selectedApplications = [];
  _all = [null];
  _activeApplications = new Map();


  _emitter = new NanoEvents();

  constructor() {
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
  // Manage selected applications
  // ###########################################################################
  
  getSelectedApplications() {
    return this._selectedApplications;
  }

  hasSelectedApplications() {
    return !!this._selectedApplications.length;
  }
  
  isApplicationSelected(applicationOrIdOrEntryPointPath) {
    const application = this.getApplication(applicationOrIdOrEntryPointPath);
    return this._selectedApplicationIds.has(application.applicationId);
  }

  selectApplication(applicationOrIdOrEntryPointPath) {
    if (this.isApplicationSelected(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.getApplication(applicationOrIdOrEntryPointPath);

    this._selectedApplicationIds.add(application.applicationId);
    this._selectedApplications.push(application);
    this._emitter.emit('selectionChanged', this._selectedApplications);
  }

  deselectApplication(applicationOrIdOrEntryPointPath) {
    if (!this.isApplicationSelected(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.getApplication(applicationOrIdOrEntryPointPath);

    this._selectedApplicationIds.delete(application.applicationId);
    pull(this._selectedApplications, application);
    this._emitter.emit('selectionChanged', this._selectedApplications);
  }

  deselectAllApplications() {
    return this._selectedApplications();
  }

  _setSelectedApplications(...applications) {
    if (areArraysEqual(this._selectedApplications, applications)) {
      return;
    }

    this._selectedApplicationIds = new Set(applications.map(app => app.applicationId));
    this._selectedApplications = applications;
    this._emitter.emit('selectionChanged', this._selectedApplications);
  }

  /**
   * @param {fileSelectedApplicationCallback} cb
   */
  mapSelectedApplicationsOfFilePath(fpath, cb) {
    const applications = this._selectedApplications;

    for (const application of applications) {
      const { dataProvider } = application;

      const programId = dataProvider.queries.programIdByFilePath(fpath);
      if (!programId) {
        // program did not execute for this application
        continue;
      }

      cb(application, programId);
    }
  }

  // ###########################################################################
  // add + remove applications
  // ###########################################################################

  /**
   * @private
   */
  _addApplication(entryPointPath) {
    const applicationId = this._all.length;
    const application = new Application(applicationId, entryPointPath, this);
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

    if (previousApplication && this.isApplicationSelected(previousApplication)) {
      // application restarted -> automatically deselect previous instance
      this.deselectApplication(previousApplication);
    }
    
    // always add new application to set of selected applications
    this.selectApplication(application);

    return application;
  }

  removeApplication(applicationOrId) {
    const application = this.getApplication(applicationOrId);

    if (!application) {
      throw new Error('invalid applicationOrId in `removeApplication`: ' + applicationOrId);
    }

    // deselect (will also trigger event)
    if (this._selectedApplications === application) {
      this.deselectApplication(application.applicationId);
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

    this._setSelectedApplications(null);

    this._emitter.emit('clear');
  }

  /**
   * Clears all applications that have already been restarted.
   */
  clearRestarted() {
    // TODO: clear all applications that are in  `_all` but not in `activeApplications`
    throw new Error('NYI');
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  onSelectionChanged(cb) {
    const unsubscribe = this._emitter.on('selectionChanged', cb);
    if (this._selectedApplications) {
      cb(this._selectedApplications);
    }
    return unsubscribe;
  }

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

const applicationCollection = new ApplicationCollection();

export default applicationCollection;