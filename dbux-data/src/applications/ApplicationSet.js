import pull from 'lodash/pull';
import isArray from 'lodash/isArray';
import { areArraysEqual } from '@dbux/common/src/util/arrayUtil';
import NanoEvents from 'nanoevents';
import ApplicationSetData from './ApplicationSetData';

/** @typedef {import('./Application').default} Application */

export default class ApplicationSet {
  _unsubscribeCallbacks = [];
  _applicationIds = new Set();
  /**
   * @type {Application[]}
   */
  _applications = [];

  _emitter = new NanoEvents();

  constructor(allApplications) {
    this.allApplications = allApplications;
    this.applicationSetData = new ApplicationSetData(this);
  }

  get data() {
    return this.applicationSetData;
  }

  get count() {
    return this._applicationIds.size;
  }

  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  /**
   * @return {Application[]}
   */
  getAll() {
    return this._applications;
  }

  getFirst() {
    return this._applications[0];
  }

  getById(applicationId) {
    return this.getApplication(applicationId);
  }

  // /**
  //  * Guess name of application s.t. it is short but also unique between all application in this set.
  //  */
  // guessUniqueName(application) {
  //   throw new Error('Not Yet Implemented');
  // }

  isEmpty() {
    return !this._applications.length;
  }

  containsApplication(applicationOrIdOrEntryPointPath) {
    const application = this.allApplications.tryGetApplication(applicationOrIdOrEntryPointPath);
    return application && this._applicationIds.has(application.applicationId) || false;
  }

  tryGetApplication(applicationOrIdOrEntryPointPath) {
    const application = this.allApplications.tryGetApplication(applicationOrIdOrEntryPointPath);

    if (this._applicationIds.has(application.applicationId)) {
      return application;
    }
    return null;
  }

  getApplication(applicationOrIdOrEntryPointPath) {
    const application = this.allApplications.getApplication(applicationOrIdOrEntryPointPath);
    if (this._applicationIds.has(application.applicationId)) {
      return application;
    }
    return null;
  }

  addApplication(applicationOrIdOrEntryPointPath) {
    if (this.containsApplication(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.allApplications.getApplication(applicationOrIdOrEntryPointPath);

    this._applicationIds.add(application.applicationId);
    this._applications.push(application);
    this._notifyChanged();
  }

  removeApplication(applicationOrIdOrEntryPointPath) {
    if (!this.containsApplication(applicationOrIdOrEntryPointPath)) {
      return;
    }
    const application = this.allApplications.getApplication(applicationOrIdOrEntryPointPath);

    this._applicationIds.delete(application.applicationId);
    pull(this._applications, application);

    this._notifyChanged();
  }

  /**
   * Replace previousApplication with newApplication and sends only one event
   * @param {Application|Application[]} previousApplications 
   * @param {Application} newApplication 
   */
  replaceApplication(previousApplications, newApplication) {
    if (!isArray(previousApplications)) {
      previousApplications = [previousApplications];
    }

    for (const prevApps of previousApplications) {
      if (this.containsApplication(prevApps)) {
        this._applicationIds.delete(prevApps.applicationId);
        pull(this._applications, prevApps);
      }
    }

    this._applicationIds.add(newApplication.applicationId);
    this._applications.push(newApplication);


    this._notifyChanged();
  }

  clear() {
    return this._setApplications();
  }

  _setApplications(...applications) {
    if (areArraysEqual(this._applications, applications)) {
      return;
    }

    this._applicationIds = new Set(applications.map(app => app.applicationId));
    this._applications = applications;

    this._notifyChanged();
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  _notifyChanged() {
    this.unsubscribeAll();
    this._emitter.emit('_applicationsChanged0', this._applications);   // used internally
    this._emitter.emit('applicationsChanged', this._applications);
  }

  /**
   * @param {applicationsChangedCallback} cb
   */
  onApplicationsChanged(cb, callImmediately = true) {
    const unsubscribe = this._emitter.on('applicationsChanged', cb);
    if (callImmediately && this._applications) {
      cb(this._applications);
    }
    return unsubscribe;
  }

  subscribe(...unsubscribeCallbacks) {
    this._unsubscribeCallbacks.push(...unsubscribeCallbacks);
  }

  /**
   * Stop listening on all events subscribed to with subscribe.
   * This will be called automatically whenever applications changes.
   */
  unsubscribeAll() {
    this._unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this._unsubscribeCallbacks = [];
  }
}