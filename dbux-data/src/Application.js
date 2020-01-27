import libs from '../../dbux-common/src/util/universalLibs';
import DataProvider from './DataProvider';
import { newDataProvider } from './dataProviderImpl';


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
  applicationCollection;
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

  constructor(applicationId, entryPointPath, applicationCollection) {
    this.applicationId = applicationId;
    this.entryPointPath = entryPointPath;
    this.applicationCollection = applicationCollection;
    this.dataProvider = newDataProvider(entryPointPath);
    // this.createdAt = this.updatedAt = libs.performance.now();
    this.createdAt = this.updatedAt = Date.now();
  }

  addData(allData) {
    this.dataProvider.addData(allData);
    // this.updatedAt = libs.performance.now();
    this.updatedAt = Date.now();

    // if (this.applicationCollection.getSelectedApplication() === this) {
    //   this.applicationCollection._emitter.emit('selectedApplicationData', this);
    // }
  }
}