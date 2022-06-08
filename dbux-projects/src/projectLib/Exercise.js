import fs from 'fs';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import isEqual from 'lodash/isEqual';
import RunStatus from './RunStatus';
import ExerciseConfig from './ExerciseConfig';

/** @typedef {import('./Project').default} Project */
/** @typedef {import('../ProjectsManager').default} PracticeManager */

export class ExerciseLocation {
  /**
   * @type {string}
   */
  file;
  /**
   * @type {number}
   */
  line;
}

export default class Exercise extends ExerciseConfig {
  /**
   * @param {Project} project 
   * @param {ExerciseConfig} cfg 
   */
  constructor(project, cfg) {
    super();
    Object.assign(this, cfg);
    this.project = project;
  }

  get isSolvable() {
    return !!this.bugLocations;
  }

  get debugTag() {
    return `${this.project} (exercise #${this.id})`;
  }

  get runner() {
    return this.manager.runner;
  }

  /**
   * @return {PracticeManager}
   */
  get manager() {
    return this.project.manager;
  }

  get runStatus() {
    if (this.runner.isBugActive(this)) {
      return this.runner.status;
    }
    else {
      return RunStatus.None;
    }
  }

  async openInEditor(loc) {
    // open file (if any)
    let targetFile = this.mainEntryPoint || this.testFilePaths;
    if (Array.isArray(targetFile)) {
      [targetFile] = targetFile;
    }
    if (targetFile) {
      const fpath = pathResolve(this.project.projectPath, targetFile);
      try {
        await this.manager.externals.editor.openFile(fpath, loc);
      }
      catch (err) {
        this.project.logger.error(`Cannot open file for bug ${this.id}:`, err);
        return false;
      }
      return true;
    }
    else {
      return false;
    }
  }

  isCorrectBugLocation(loc) {
    const { projectPath } = this.project;

    if (!this.isSolvable) {
      return null;
    }

    const expandedBugLocations = this.bugLocations.flatMap(bl => {
      if (Array.isArray(bl.line)) {
        // line can be an array
        return bl.line.map(l => ({
          file: bl.file,
          line: l
        }));
      }
      return bl;
    });

    return expandedBugLocations.some(t => {
      return isEqual({
        fileName: pathResolve(projectPath, t.fileName || t.file),
        line: t.line,
      }, loc);
    });
  }

  async clearLog() {
    const indexFilePath = this.manager.getExerciseIndexFilePath(this);
    if (fs.existsSync(indexFilePath)) {
      const index = JSON.parse(fs.readFileSync(indexFilePath, 'utf-8'));
      for (const sessionId of Object.keys(index)) {
        const appIds = index[sessionId].applicationIds;
        for (const appId of appIds) {
          const appLogPath = this.manager.getApplicationFilePath(appId);
          if (fs.existsSync(appLogPath)) {
            fs.rmSync(appLogPath);
          }
        }
        const pathwaysLogPath = this.manager.getPathwaysLogFilePath(sessionId);
        if (fs.existsSync(pathwaysLogPath)) {
          fs.rmSync(pathwaysLogPath);
        }
      }
      fs.rmSync(indexFilePath);
    }
  }
}