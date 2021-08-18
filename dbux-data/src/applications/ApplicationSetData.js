/** @typedef {import('./ApplicationSet').default} ApplicationSet */

import AsyncNodesInOrder from './AsyncNodesInOrder';
import AsyncThreadsInOrder from './AsyncThreadsInOrder';
import { ThreadSelection } from './ThreadSelection';

/**
 * Encapsulates all data that is related to the set of selected applications;
 * specifically, any data that changes when selected applications change.
 * 
 * Also provides muliti-casted utility methods that work with the dataProviders of all selected applications.
 */
export default class ApplicationSetData {
  /**
   * @param {ApplicationSet} applicationSet 
   */
  constructor(applicationSet) {
    this.applicationSet = applicationSet;
    this.threadSelection = new ThreadSelection();
    this.asyncNodesInOrder = new AsyncNodesInOrder(this);
    this.asyncThreadsInOrder = new AsyncThreadsInOrder(this);
    // this.firstTracesInOrder = new FirstTracesInOrder(this);

    // this.applicationSet._emitter.on('_applicationsChanged0', this._handleApplicationsChanged);
    this.applicationSet.onApplicationsChanged(this._handleApplicationsChanged);
  }

  get set() {
    return this.applicationSet;
  }

  _handleApplicationsChanged = () => {
    // this.firstTracesInOrder._handleApplicationsChanged();
    this.asyncNodesInOrder._handleApplicationsChanged();
    this.asyncThreadsInOrder._handleApplicationsChanged();
  }

  getTrace(applicationId, traceId) {
    const application = this.set.getApplication(applicationId);
    return application?.dataProvider.collections.traces.getTrace(traceId);
  }

  /**
   * Return amount of applications that have executed given file.
   */
  getApplicationCountAtPath(fpath) {
    const applications = this.set.getAll();
    return applications.reduce((sum, { dataProvider }) => {
      const programId = dataProvider.queries.programIdByFilePath(fpath);
      return sum + !!programId;
    }, 0);
  }

  /**
   * @callback fileSelectedApplicationCallback
   * @param {Application} application
   * @param {number} programId
   */

  /**
   * @param {fileSelectedApplicationCallback} cb
   */
  mapApplicationsOfFilePath(fpath, cb) {
    const applications = this.set.getAll();
    const results = [];

    for (const application of applications) {
      const { dataProvider } = application;

      const programId = dataProvider.queries.programIdByFilePath(fpath);
      if (!programId) {
        // program did not execute for this application
        continue;
      }

      const result = cb(application, programId);
      if (Array.isArray(result)) {
        results.push(...result);
      }
      else {
        results.push(result);
      }
    }

    return results;
  }
}
