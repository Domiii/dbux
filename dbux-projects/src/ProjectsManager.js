import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { readPackageJson } from '@dbux/cli/lib/package-util';
import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import ProgressLogController from './dataLib/ProgressLogController';
import Stopwatch from './stopwatch/Stopwatch';
import BackendController from './backend/BackendController';


const depsStorageKey = 'PracticeManager.deps';

const logger = newLogger('PracticeManager');
// eslint-disable-next-line no-unused-vars
const { debug, log, warn } = logger;

/** @typedef {import('./projectLib/Bug').default} Bug */
/** @typedef {import('./projectLib/Project').default} Project */


function canIgnoreDependency(name) {
  if (process.env.NODE_ENV === 'development' && name.startsWith('@dbux/')) {
    // NOTE: in development mode, we have @dbux dependencies (and their dependencies) all linked up to the monoroot folder anyway
    // NOTE: we need to short-circuit this for when we run the packaged extension in dev mode
    return true;
  }
  return false;
}

export default class ProjectsManager {
  // NOTE: npm flattens dependency tree by default, and other important dependencies are dependencies of @dbux/cli
  _sharedDependencyNames = [
    '@dbux/cli'
  ];

  config;
  externals;
  /**
   * @type {ProjectList}
   */
  projects;
  /**
   * @type {BugRunner}
   */
  runner;
  /**
   * @type {BackendController}
   */
  _backend;

  _pkg;

  /**
   * @param {Object} externals 
   * @param {ExternalStorage} externals.storage
   */
  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;
    this.editor = externals.editor;
    this.stopwatch = new Stopwatch();

    this._backend = new BackendController(this);
    this.progressLogController = new ProgressLogController(externals.storage);
    this._pkg = readPackageJson(this.config.dependencyRoot);

    this._sharedDependencyNamesAll = [
      ...this._sharedDependencyNames,
      ...Object.entries(this._pkg.dependencies).
        map(([name, version]) => `${name}@${version}`)
    ];
  }

  async getAndInitBackend() {
    await this._backend.init();
    return this._backend;
  }

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   */
  getOrCreateDefaultProjectList() {
    if (!this.projects) {
      // fix up names
      for (const name in caseStudyRegistry) {
        const Clazz = caseStudyRegistry[name];

        // NOTE: function/class names might get mangled by Webpack (or other bundlers/tools)
        Clazz.constructorName = name;
      }

      // sort all classes by name
      const classes = Object.values(caseStudyRegistry);
      classes.sort((a, b) => {
        const nameA = a.constructorName.toLowerCase();
        const nameB = b.constructorName.toLowerCase();
        return nameB.localeCompare(nameA);
      });

      // build + return ProjectList
      const list = new ProjectList(this);
      list.add(...classes.map(ProjectClazz =>
        new ProjectClazz(this)
      ));

      this.projects = list;
    }

    return this.projects;
  }

  /**
   * @return {BugRunner}
   */
  getOrCreateRunner() {
    if (!this.runner) {
      const runner = this.runner = new BugRunner(this);
      runner.start();
    }
    return this.runner;
  }

  async saveRunningBug(bug) {
    let patchString = await bug.project.getPatchString();
    if (patchString) {
      // TODO: prompt? or something else
      this.progressLogController.util.processUnfinishTestRun(bug, patchString);
    }
  }

  /**
   * @param {Bug} bug 
   */
  async resetBug(bug) {
    await bug.project.gitResetHard(true, 'This will discard all your changes on this bug.');
    await this.progressLogController.util.processUnfinishTestRun(bug, '');
  }

  async applyNewBugPatch(bug) {
    let testRuns = this.progressLogController.util.getTestRunsByBug(bug);
    let testRun = testRuns.reduce((a, b) => {
      if (!a) {
        return b;
      }
      return a.createAt > b.createAt ? a : b;
    }, undefined);
    let patchString = testRun?.patch;

    if (patchString) {
      try {
        await bug.project.applyPatchString(patchString);
        return true;
      } catch (err) {
        let keepRunning = await this.externals.showMessage.warning(`Failed when applying previous progress of this bug.`, {
          'Show diff in new tab and cancel': () => {
            this.externals.editor.showTextInNewFile(`diff.diff`, patchString);
            return false;
          },
          'Ignore and keep running': () => {
            return true;
          },
        }, { modal: true });
        return keepRunning;
      }
    } else {
      return true;
    }
  }

  getDevPackageRoot() {
    // NOTE: __dirname is actually "..../dbux-code/dist", because of webpack
    return fs.realpathSync(path.join(__dirname, '..', '..'));
  }

  // _convertPkgToLocalIfNecessary(pkgName, version = null) {
  //   // NOTE: only dbux packages are available locally
  //   const packageRoot = this.getDevPackageRoot();

  //   if (process.env.NODE_ENV === 'development') {
  //     const match = pkgName.match(/@dbux\/(.+)/);
  //     if (match) {
  //       // available locally
  //       return `file://${packageRoot}/dbux-${match[1]}`;
  //     }
  //   }
  //   if (!version) {
  //     throw new Error('no version given for package: ' + pkgName);
  //   }
  //   return `${pkgName}@${version}`;
  // }

  // _readLocalPkgDeps(pkgFolder, ...depNames) {
  //   const pkg = readPackageJson(pkgFolder);
  //   let deps;
  //   if (depNames.length) {
  //     deps = pick(pkg.dependencies, depNames);
  //     if (size(deps) !== depNames.length) {
  //       throw new Error(`Could not read (some subset of the following) local package dependencies: ${depNames.join(', ')}`);
  //     }
  //   }
  //   else {
  //     deps = pkg.dependencies;
  //   }
  //   return Object.
  //     entries(deps).
  //     map(([pkgName, version]) => `${this._convertPkgToLocalIfNecessary(pkgName, version)}`);
  // }

  getDbuxCliBinPath() {
    const { dependencyRoot } = this.config;
    return path.join(dependencyRoot, 'node_modules/@dbux/cli/bin/dbux.js');
  }


  // ###########################################################################
  // Dependency Management
  // ###########################################################################

  async installDependencies() {
    await this.installDbuxDependencies();
  }

  isInstallingSharedDependencies() {
    return !!this._installPromise;
  }

  async waitForInstall() {
    return this._installPromise;
  }

  _getAllDependencies(deps) {
    return [
      ...this._sharedDependencyNamesAll,
      ...deps || EmptyArray
    ];
  }

  hasInstalledSharedDependencies() {
    return this.areDependenciesInstalled([]);
  }

  areDependenciesInstalled(deps) {
    deps = this._getAllDependencies(deps);
    return deps.every(this.isDependencyInstalled);
  }

  isDependencyInstalled = (dep) => {
    // TODO: check correct version?
    //    should not be necessary for the VSCode extension because it will create a new extension folder for every version update anyway

    // get name without version
    const name = dep.match('(@?[^@]+)(?:@.*)?')[1];
    if (canIgnoreDependency(name)) {
      // NOTE: in development mode, we have @dbux dependencies (and their dependencies) all linked up to the monoroot folder anyway
      // NOTE: we need to short-circuit this for when we run the packaged extension in dev mode
      return true;
    }
    const { dependencyRoot } = this.config;

    if (process.env.NODE_ENV === 'production' && !this.externals.storage.get(depsStorageKey)?.[dep]) {
      // we don't have any record of a successful install
      return false;
    }

    const target = path.join(dependencyRoot, 'node_modules', name);
    // warn('isDependencyInstalled', qualifiedDependencyName, target);

    return sh.test('-d', target);
  }

  async installDbuxDependencies() {
    // set correct version
    if (!process.env.DBUX_VERSION) {
      throw new Error('installDbuxDependencies() failed. DBUX_VERSION was not set.');
    }

    const deps = this._sharedDependencyNames.
      filter(dep => !canIgnoreDependency(dep));

    await this.installModules(deps);
  }

  async installModules(deps) {
    await this._installPromise;
    return (this._installPromise = this._doInstallModules(deps));
  }

  async _doInstallModules(deps) {
    try {
      const { dependencyRoot } = this.config;
      // const execOptions = {
      //   processOptions: {
      //     cwd: dependencyRoot
      //   }
      // };
      // if (!await sh.test('-f', rootPackageJson)) {
      //   // make sure, we have a local `package.json`
      //   await this.runner._exec('npm init -y', logger, execOptions);
      // }
      if (this.areDependenciesInstalled(deps)) {
        // already done!
        return;
      }

      // delete previously installed node_modules
      // NOTE: if we don't do it, we (sometimes randomly) bump against https://github.com/npm/npm/issues/13528#issuecomment-380201967
      // await sh.rm('-rf', path.join(projectsRoot, 'node_modules'));

      // debug(`Verifying NPM cache. This might (or might not) take a while...`);
      // await this.runner._exec('npm cache verify', logger, execOptions);

      // this.externals.showMessage.info(`Installing dependencies: "${deps.join(', ')}" This might (or might not) take a while...`);

      const moreDeps = deps.length && ` && npm i ${deps.join(' ')}` || '';
      const command = `npm install --only=prod${moreDeps}`;
      // await this.runner._exec(command, logger, execOptions);
      await this.execInTerminal(dependencyRoot, command);

      // remember all installed dependencies
      const newDeps = this._getAllDependencies();
      let storedDeps = this.externals.storage.get(depsStorageKey) || {};
      storedDeps = {
        ...storedDeps, 
        ...Object.fromEntries(newDeps.map(dep => [dep, true]))
      };
      await this.externals.storage.set(depsStorageKey, storedDeps);

      // else {
      //   // we need socket.io for TerminalWrapper. Its version should match dbux-runtime's.
      //   // const pkgPath = path.join(__dirname, '..', '..', '..', 'dbux-runtime');

      //   const packageRoot = process.env.DBUX_ROOT;
      //   const cliPath = path.join(packageRoot, 'dbux-cli');
      //   const cliDeps = this._readLocalPkgDeps(cliPath);

      //   const runtimePath = path.join(packageRoot, 'dbux-runtime');
      //   const socketIoDeps = this._readLocalPkgDeps(runtimePath, 'socket.io-client');
      //   // const socketIoVersion = pkg?.dependencies?.[socketIoName]; // ?.match(/\d+\.\d+.\d+/)?.[0];

      //   // if (!socketIoVersion) {
      //   //   throw new Error(`'Could not retrieve version of ${socketIoName} in "${runtimePath}"`);
      //   // }

      //   allDeps = [
      //     // NOTE: installing local refs actually *copies* them. We don't want that.
      //     // we will use `module-alias` in `_dbux_inject.js` instead
      //     // this._convertPkgToLocalIfNecessary('@dbux/cli'),
      //     ...cliDeps.filter(dep => !dep.includes('dbux-')),
      //     ...socketIoDeps
      //   ];

      //   // NOTE: `link-module-alias` can cause problems. See: https://github.com/Rush/link-module-alias/issues/3
      //   // // add dbux deps via `link-module-alias`
      //   // const dbuxDeps = [
      //   //   'common',
      //   //   'cli',
      //   //   'babel-plugin',
      //   //   'runtime'
      //   // ];
      //   // let pkg = readPackageJson(projectsRoot);
      //   // pkg = {
      //   //   ...pkg,
      //   //   script: {
      //   //     postinstall: "npx link-module-alias"
      //   //   },
      //   //   _moduleAliases: Object.fromEntries(
      //   //     dbuxDeps.map(name => [`@dbux/${name}`, `../dbux/dbux-${name}`])
      //   //   )
      //   // };

      //   // await this.runner._exec(`npm i --save link-module-alias`, logger, execOptions);
      //   // writePackageJson(projectsRoot, pkg);
      //   await this.runner._exec(`npm i --save ${allDeps.join(' ')}`, logger, execOptions);
      // }
    }
    finally {
      this._installPromise = null;
    }
  }

  // ###########################################################################
  // submit
  // ###########################################################################

  async askForSubmit() {
    const confirmString = 'You have passed the test for the first time, would you like to submit the result?';
    const shouldSubmit = await this.externals.confirm(confirmString);

    if (shouldSubmit) {
      this.submit();
    }
  }

  /**
   * Record the practice session data after user passed all tests.
   */
  submit() {
    // TODO
  }


  // ###########################################################################
  // utilities
  // ###########################################################################

  async execInTerminal(cwd, command, args) {
    try {
      this._terminalWrapper = this.externals.TerminalWrapper.execInTerminal(cwd, command, args);
      return await this._terminalWrapper.waitForResult();
    }
    finally {
      this._terminalWrapper?.cancel();
      this._terminalWrapper = null;
    }
  }

  onTestFinished(cb) {
    return this.runner._emitter.on('testFinished', cb);
  }
}