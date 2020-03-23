import DataProvider from '../DataProvider';
import { newDataProvider } from '../dataProviderImpl';
import { getFileName, getPackageJson, getClosestPackageJsonNameOrPath } from '../util/nodeUtil';


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
    this.createdAt = this.updatedAt = createdAt || Date.now();
  }

  addData(allData) {
    this.dataProvider.addData(allData);
    this.updatedAt = Date.now();

    // if (this.allApplications.getSelectedApplication() === this) {
    //   this.allApplications._emitter.emit('selectedApplicationData', this);
    // }
  }

  getRelativeFolder() {
    // Needs external help to do it; e.g. in VSCode, can use workspace-relative path.
    return this.entryPointPath;
  }

  /**
   * TODO: make this cross-platform (might run this where we don't have Node)
   */
  async guessName() {
    const { staticProgramContexts } = this.dataProvider.collections;
    const fileCount = staticProgramContexts.size;
    if (!fileCount) {
      return '(unknown)';
    }
    
    const file = staticProgramContexts.getById(1)?.filePath;
    if (fileCount > 1) {
      // multiple files -> look for package.json
      return getClosestPackageJsonNameOrPath(file);
    }

    // just a single file -> return file name
    return getFileName(file);
  }

  async guessSafeFileName() {
    return (await this.guessName())?.replace(/[:\\/]/, '-');
  }
}