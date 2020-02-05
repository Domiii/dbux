import pull from 'lodash/pull';
import { areArraysEqual } from 'dbux-common/src/util/arrayUtil';
import ApplicationSelectionData from './ApplicationSelectionData';
import NanoEvents from 'nanoevents';

export default class ApplicationSelection {
  _unsubscribeCallbacks = [];
  _selectedApplicationIds = new Set();
  _selectedApplications = [];

  _emitter = new NanoEvents();

  constructor(applicationCollection) {
    this.applicationCollection = applicationCollection;
    this.applicationSelectionData = new ApplicationSelectionData(this);
  }
  
  get data() {
    return this.applicationSelectionData;
  }

  get collection() {
    return this.applicationCollection;
  }
  
  // ###########################################################################
  // Manage selected applications
  // ###########################################################################
  
  /**
   * 
   */
  getSelectedApplications() {
    return this._selectedApplications;
  }

  hasSelectedApplications() {
    return !!this._selectedApplications.length;
  }
  
  isApplicationSelected(applicationOrIdOrEntryPointPath) {
    const application = this.applicationCollection.getApplication(applicationOrIdOrEntryPointPath);
    return this._selectedApplicationIds.has(application.applicationId);
  }

  selectApplication(applicationOrIdOrEntryPointPath) {
    if (this.isApplicationSelected(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.applicationCollection.getApplication(applicationOrIdOrEntryPointPath);

    this._selectedApplicationIds.add(application.applicationId);
    this._selectedApplications.push(application);
    this._notifySelectionChanged();
  }

  deselectApplication(applicationOrIdOrEntryPointPath) {
    if (!this.isApplicationSelected(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.applicationCollection.getApplication(applicationOrIdOrEntryPointPath);

    this._selectedApplicationIds.delete(application.applicationId);
    pull(this._selectedApplications, application);
    
    this._notifySelectionChanged();
  }

  deselectAllApplications() {
    return this._setSelectedApplications();
  }

  _setSelectedApplications(...applications) {
    if (areArraysEqual(this._selectedApplications, applications)) {
      return;
    }

    this._selectedApplicationIds = new Set(applications.map(app => app.applicationId));
    this._selectedApplications = applications;

    this._notifySelectionChanged();
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
  // event listeners
  // ###########################################################################

  _notifySelectionChanged() {
    this.unsubscribeAll();
    this._emitter.emit('_selectionChanged0', this._selectedApplications);   // used internally
    this._emitter.emit('selectionChanged', this._selectedApplications);
  }

  /**
   * @param {selectionChangedCallback} cb 
   */
  onSelectionChanged(cb) {
    const unsubscribe = this._emitter.on('selectionChanged', cb);
    if (this._selectedApplications) {
      cb(this._selectedApplications);
    }
    return unsubscribe;
  }
  
  subscribe(...unsubscribeCallbacks) {
    this._unsubscribeCallbacks.push(...unsubscribeCallbacks);
  }

  /**
   * Stop listening on all events subscribed to with subscribe.
   * This will be called automatically whenever selection changes.
   */
  unsubscribeAll() {
    this._unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this._unsubscribeCallbacks = [];
  }
}