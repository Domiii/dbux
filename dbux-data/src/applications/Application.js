import path from 'path';
import process from 'process';
import DataProvider from '../DataProvider';
import { newDataProvider } from '../dataProviderImpl';


/**
 * A user-run application, consisting of many `Program`s.
 * The first executed `Program` of an `Application` is its `entryPoint`
 */
export default class Application {
  /**
  * @readonly
  */
  applicationId: number;
  /**
   * @readonly
   */
  entryPointPath: string;
  /**
   * @readonly
   */
  allApplications;
  /**
   * @readonly
   */
  dataProvider: DataProvider;
  /**
   * time of creation in milliseconds since vscode started
   */
  createdAt: number;
  /**
   * time of last update in milliseconds since vscode started
   */
  updatedAt: number;

  constructor(applicationId, entryPointPath, createdAt, allApplications) {
    this.applicationId = applicationId;
    this.entryPointPath = entryPointPath;
    // this.relativeEntryPointPath = path.relative(entryPointPath, process.cwd()); // path relative to cwd
    this.allApplications = allApplications;
    this.dataProvider = newDataProvider(this);
    // this.createdAt = this.updatedAt = libs.performance.now();
    this.createdAt = this.updatedAt = createdAt || Date.now();
  }

  addData(allData) {
    this.dataProvider.addData(allData);
    // this.updatedAt = libs.performance.now();
    this.updatedAt = Date.now();

    // if (this.allApplications.getSelectedApplication() === this) {
    //   this.allApplications._emitter.emit('selectedApplicationData', this);
    // }
  }

  getRelativeFolder() {
    // Needs external help to do it; e.g. in VSCode, can use workspace-relative path.
    return this.entryPointPath;
  }
}