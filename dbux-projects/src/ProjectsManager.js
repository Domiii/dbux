import path from 'path';
import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import getOrCreateProgressLog from './dataLib';
import processLogHandler from './dataLib/progressLog';
import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';


const logger = newLogger('dbux-projects');
const { debug } = logger;


function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}

function readPackageJson(folder) {
  const packageJsonPath = path.join(folder, 'package.json');
  return readJsonFile(packageJsonPath);
}


class ProjectsManager {
  config;
  externals;
  projects;
  runner;

  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;
    this.editor = externals.editor;
    this.progressLog = getOrCreateProgressLog(externals.storage);
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
      const runner = this.runner = new BugRunner(this, this.progressLog);
      runner.start();
    }
    return this.runner;
  }

  async saveRunningBug(bug) {
    let patchString = await bug.project.getPatchString();
    if (patchString) {
      // TODO: prompt? or something else
      processLogHandler.processUnfinishTestRun(this.progressLog, bug, patchString);
    }
  }

  async applyNewBugPatch(bug) {
    let testRuns = processLogHandler.getTestRunsByBug(this.progressLog, bug);
    let testRun = testRuns.reduce((a, b) => {
      if (!a) {
        return b;
      }
      return a.createAt > b.createAt ? a : b;
    }, undefined);
    let patchString = testRun?.patch;

    if (patchString) {
      await bug.project.applyPatchString(patchString);
    }
  }

  async installDependencies() {
    await this.installDbuxCli();
  }

  async installDbuxCli() {
    // await exec('pwd', this.logger);

    if (!process.env.DBUX_VERSION) {
      throw new Error('installDbuxCli() failed. DBUX_VERSION was not set.');
    }

    let dbuxDeps;

    if (process.env.NODE_ENV === 'production') {
      // in stand-alone mode, npm flattens the dependency tree in `node_modules`, thereby adding all other required dependencies
      dbuxDeps = [
        '@dbux/cli'
      ];

      dbuxDeps = dbuxDeps.map(dep => `${dep}@${process.env.DBUX_VERSION}`);
      
      const { projectsRoot } = this.config;
      const options = {
        processOptions: {
          cwd: projectsRoot
        }
      };
      
      debug(`Verifying NPM cache. This might (or might not) take a while...`);
      await this.runner._exec('npm cache verify', logger, options);
      await this.runner._exec(`npm i ${dbuxDeps.join(' ')}`, logger, options);
    }
    else {
      // NOTE: hoisting takes care of everything for us

      // // hackfix: read socket.io version from dbux-runtime package.json
      // // const pkgPath = path.join(__dirname, '..', '..', '..', 'dbux-runtime');

      // // NOTE: __dirname is actually "..../dbux-code/dist", because of webpack
      // const pkgPath = path.join(__dirname, '..', '..', 'dbux-runtime');
      // const pkg = readPackageJson(pkgPath);
      // const socketIoName = 'socket.io-client';
      // const socketIoVersion = pkg?.dependencies?.
      //   [socketIoName]?.
      //   match(/\d+\.\d+.\d+/)?.[0];

      // if (!socketIoVersion) {
      //   throw new Error(`'Could not retrieve version of ${socketIoName} in "${pkgPath}"`);
      // }
      // dbuxDeps = [
      //   'file://../dbux-common',
      //   'file://../dbux-runtime',
      //   'file://../dbux-cli',
      //   `${socketIoName}@${socketIoVersion}`
      // ];
    }
  }
}

export default ProjectsManager;