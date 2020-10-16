import NanoEvents from 'nanoevents';
import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';

import Application from './Application';
import ApplicationSelection from './ApplicationSelection';

// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('applications');


/**
 * @callback applicationsChangedCallback
 * @param {Application[]} applications
 */

/**
 * ApplicationCollection manages all application throughout the life-time of the dbux-data module.
 */
export class AllApplications {
  DefaultApplicationClass = Application;

  /**
   * @type {Application[]}
   */
  _all = [null];
  _activeApplicationsByPath = new Map();

  _emitter = new NanoEvents();

  constructor() {
    this.applicationSelection = new ApplicationSelection(this);
  }

  getAllCount() {
    return this._activeApplicationsByPath.size;
  }

  /**
   * @param {number} applicationId
   */
  getById(applicationId) {
    return this._all[applicationId];
  }

  /**
   * @param {number | string | Application} applicationOrIdOrEntryPointPath 
   * @return {Application}
   */
  getApplication(applicationOrIdOrEntryPointPath) {
    const application = this.tryGetApplication(applicationOrIdOrEntryPointPath);
    if (!application) {
      throw new Error('invalid applicationOrIdOrEntryPointPath: ' + applicationOrIdOrEntryPointPath);
    }
    return application;
  }

  getAllActive() {
    return Array.from(this._activeApplicationsByPath.values());
  }

  getAll() {
    return this._all.filter(app => !!app);
  }

  /**
   * @param {number | string | Application} applicationOrIdOrEntryPointPath
   * @return {Application}
   */
  tryGetApplication(applicationOrIdOrEntryPointPath) {
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
    return this._activeApplicationsByPath.get(entryPointPath);
  }

  isApplicationActive(applicationOrIdOrEntryPointPath) {
    const application = this.getApplication(applicationOrIdOrEntryPointPath);
    return application && (application === this.getActiveApplicationByEntryPoint(application.entryPointPath));
  }

  // ###########################################################################
  // add + remove applications
  // ###########################################################################

  addApplication(initialData) {
    const {
      entryPointPath,
      createdAt
    } = initialData;

    const applicationId = this._all.length;
    const application = new this.DefaultApplicationClass(applicationId, entryPointPath, createdAt, this);
    const previousApplication = this.getActiveApplicationByEntryPoint(entryPointPath);

    this._activeApplicationsByPath.set(entryPointPath, application);
    this._all[applicationId] = application;

    if (previousApplication) {
      this._emitter.emit('restarted', application, previousApplication);
      debug('restarted', entryPointPath);
    }
    else {
      this._emitter.emit('added', application);
      debug('added', entryPointPath);
    }

    if (previousApplication && this.selection.containsApplication(previousApplication)) {
      // application restarted -> automatically deselect previous instance and add new one
      this.applicationSelection.replaceApplication(previousApplication, application);
    }
    else {
      // add new application to set of selected applications
      this.applicationSelection.addApplication(application);
    }
    

    return application;
  }

  removeApplication(applicationOrId) {
    const application = this.getApplication(applicationOrId);

    if (!application) {
      throw new Error('invalid applicationOrId in `removeApplication`: ' + applicationOrId);
    }

    // deselect (will also trigger event)
    this.selection.removeApplication(application);

    // remove
    const { applicationid, entryPointPath } = application;
    this._all[applicationid] = null;
    if (this.getActiveApplicationByEntryPoint(entryPointPath) === application) {
      this._activeApplicationsByPath.delete(entryPointPath);
    }

    // `removed` event
    this._emitter.emit('removed', application);
  }

  clear() {
    this._all = [null];
    this._activeApplicationsByPath = new Map();

    this.applicationSelection.clear();

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
 * @type {AllApplications}
 */
let allApplications;
try {
  allApplications = new AllApplications();
}
catch (err) {
  logError(err);
  debugger;
}

export default allApplications;