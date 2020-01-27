import NanoEvents from 'nanoevents';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import isString from 'lodash/isString';

import Application from './Application';

const { log, debug, warn, error: logError } = newLogger('applications');

function extractFilePathFromInitialData(initialData) {
  const staticProgramContexts = initialData?.staticProgramContexts;
  const entryPoint = staticProgramContexts && staticProgramContexts[0];
  if (entryPoint && entryPoint.programId === 1) {
    return entryPoint.filePath;
  }
  return null;
}

class ApplicationCollection {
  _selectedApplication;
  _all = [null];
  _activeApplications = new Map();


  _emitter = new NanoEvents();

  constructor() {
  }

  getById(applicationId : Application) {
    return this._all[applicationId];
  }

  getApplication(applicationOrIdOrEntryPointPath : number | string | Application): Application {
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

  getOrCreateApplication(initialData) : Application {
    const entryPointPath = extractFilePathFromInitialData(initialData);
    if (!entryPointPath) {
      return null;
    }
    const application = this._createApplication(entryPointPath);
    return application;
  }

  getSelectedApplication() {
    return this._selectedApplication;
  }

  setSelectedApplication(application) {
    this._selectedApplication = application;
    this._emitter.emit('selectionChanged', application);
  }

  removeApplication(applicationOrId) {
    const application = this.getApplication(applicationOrId);

    if (!application) {
      throw new Error('invalid applicationOrId: ' + applicationOrId);
    }

    const { applicationid, entryPointPath } = application;
    this._all[applicationid] = null;
    if (this.getActiveApplicationByEntryPoint(entryPointPath) === application) {
      this._activeApplications.delete(entryPointPath);
    }
  }

  clear() {
    this._all = [null];
    this._activeApplications = new Map();

    this.setSelectedApplication(null);

    this._emitter.emit('clear');
  }

  /**
   * Clears all applications that have already been restarted.
   */
  clearRestarted() {
    // TODO: clear all applications that are in  `_all` but not in `activeApplications`
    throw new Error('NYI');
  }

  _createApplication(entryPointPath) {
    const applicationId = this._all.length;
    const application = new Application(applicationId, entryPointPath, this);
    const previousApplication = this.getActiveApplicationByEntryPoint(entryPointPath);

    this._activeApplications.set(entryPointPath, application);
    this._all[applicationId] = application;

    if (previousApplication) {
      this._emitter.emit('restarted', application, previousApplication);
      debug('Application RESTART @', entryPointPath);
    }
    else {
      this._emitter.emit('added', application);
      debug('Application ADD @', entryPointPath);
    }

    if (!this._selectedApplication || previousApplication === this._selectedApplication) {
      // first application -> automatically select it
      this.setSelectedApplication(application);
    }
    return application;
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  onSelectionChanged(cb) {
    const unsubscribe = this._emitter.on('selectionChanged', cb);
    if (this._selectedApplication) {
      cb(this._selectedApplication);
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