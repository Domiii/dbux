import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import { newLogger } from '@dbux/common/src/log/logger';
import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import ProgressLogController from './dataLib/ProgressLogController';
import Stopwatch from './stopwatch/Stopwatch';


const logger = newLogger('dbux-projects');
const { debug } = logger;

/** @typedef {import('./projectLib/Bug').default} Bug */
/** @typedef {import('./projectLib/Project').default} Project */

export default class ProjectsManager {
  config;
  externals;
  projects;
  runner;

  /**
   * @param {Object} externals 
   * @param {ExternalStorage} externals.storage
   */
  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;
    this.editor = externals.editor;
    this.stopwatch = new Stopwatch();

    this.progressLogController = new ProgressLogController(externals.storage);
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
        let keepRunning = await this.externals.showMessage.showWarningMessage(`Failed when applying previous progress of this bug.`, {
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

  async installDependencies() {
    await this.installDbuxDependencies();
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


  isDependencyInstalled(name) {
    const { dependencyRoot } = this.config;
    return sh.test('-d', path.join(dependencyRoot, 'node_modules', name));
  }

  getDbuxCliBinPath() {
    const { dependencyRoot } = this.config;
    return path.join(dependencyRoot, 'node_modules/@dbux/cli/bin/dbux.js');
  }

  async installDbuxDependencies() {
    // await exec('pwd', this.logger);
    if (!process.env.DBUX_VERSION) {
      throw new Error('installDbuxDependencies() failed. DBUX_VERSION was not set.');
    }

    // NOTE: in development mode, we have @dbux/cli (and it's dependencies) all linked up to the dev folder anyway
    if (process.env.NODE_ENV === 'production') {
      const { dependencyRoot } = this.config;
      const execOptions = {
        processOptions: {
          cwd: dependencyRoot
        }
      };
      const rootPackageJson = path.join(dependencyRoot, 'package.json');
      if (!await sh.test('-f', rootPackageJson)) {
        // make sure, we have a local `package.json`
        await this.runner._exec('npm init -y', logger, execOptions);
      }
      else if (this.isDependencyInstalled('@dbux/cli')) {
        // already done!
        // TODO: check correct version? should not be necessary in the code extension case...
        return;
      }

      // delete previously installed node_modules
      // NOTE: if we don't do it, we (sometimes randomly) bump against https://github.com/npm/npm/issues/13528#issuecomment-380201967
      // await sh.rm('-rf', path.join(projectsRoot, 'node_modules'));

      // install @dbux/cli
      const dbuxDeps = [
        '@dbux/cli'

        // NOTE: these are already dependencies of `@dbux/cli`
        // NOTE: npm flattens dependency tree by default
        //        see: https://docs.npmjs.com/cli/install#algorithm
        //        see: https://visbud.blogspot.com/2019/06/how-to-prevent-nested-nodemodules.html

        // '@dbux/runtime',
        // '@dbux/babel-plugin'
      ];

      const allDeps = [
        ...dbuxDeps.map(dep => `${dep}@${process.env.DBUX_VERSION}`),
        // 'object.fromentries'
      ];

      // debug(`Verifying NPM cache. This might (or might not) take a while...`);
      // await this.runner._exec('npm cache verify', logger, execOptions);


      await this.runner._exec(`npm i ${allDeps.join(' ')}`, logger, execOptions);
    }
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
}