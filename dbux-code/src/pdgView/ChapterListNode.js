import { TreeItemCollapsibleState } from 'vscode';
import fs from 'fs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import ChapterNode from '../projectViews/practiceView/ChapterNode';
import ExerciseNode from '../projectViews/practiceView/ExerciseNode';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { confirm } from '../codeUtil/codeModals';
import { goToCodeLoc } from '../codeUtil/codeNav';
import { showPDGViewForArgs } from '../webViews/pdgWebView';
import { getApplicationDataPath } from '../codeUtil/codePath';
import { getProjectViewController } from '../projectViews/projectViewsController';

/** @typedef {import('@dbux/projects/src/projectLib/Chapter').default} Chapter */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */
/** @typedef {import('../codeUtil/CodeApplication').CodeApplication} CodeApplication */
/** @typedef {import('./PDGViewController').default} PDGViewController */


/** ###########################################################################
 * {@link PDGNode}
 *  #########################################################################*/

class PDGNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProp) {
    return moreProp.pdgTitle;
  }

  /**
   * @type {Exercise}
   */
  get exercise() {
    return this.parent.exercise;
  }

  /**
   * @type {PDGViewController}
   */
  get controller() {
    return this.treeNodeProvider.controller;
  }

  makeIconPath() {
    return '';
  }

  async handleClick() {
    let { 
      applicationUuid, contextId, algoLoc: { filePath, loc },
      exercise, exercise: { project }
    } = this;
    let application = allApplications.getById(applicationUuid);
    const fullContextFilePath = pathResolve(this.exercise.project.projectPath, filePath);
    if (!application) {
      // pathSafeSegment
      const appFilePath = getApplicationDataPath(this.exercise.id);
      if (fs.existsSync(appFilePath)) {
        application = await importApplicationFromFile(appFilePath);
      }
      if (!application) {
        const result = await confirm(`No application file found. Do you want to run the exercise?`);
        if (result) {
          // hackfix: we should not depend on `ProjectViewController` here
          if (!await getProjectViewController().maybeAskForOpenProjectWorkspace(project, exercise)) {
            return;
          }

          // run → then get new application
          application = await this.controller.runAndExportPDGApplication(this.exercise);

          if (!application) {
            throw new Error(`Running application failed`);
          }

          const newFilePath = application.dataProvider.util.getContextFilePath(contextId);
          if (newFilePath !== fullContextFilePath) {
            this.treeNodeProvider.logger.error(`Ran test, but code is not in original file anymore. Test data probably outdated.`);
          }
        }
        else {
          return;
        }
      }
      ({ applicationUuid } = application);
    }
    await showPDGViewForArgs({ applicationUuid, contextId });
    await goToCodeLoc(fullContextFilePath, loc);
  }
}


/** ###########################################################################
 * {@link PDGExerciseNode}
 *  #########################################################################*/

class PDGExerciseNode extends ExerciseNode {
  get contextValue() {
    return 'dbuxPdgView.PDGExerciseNode';
  }

  makeIconPath() {
    return '';
  }

  canHaveChildren() {
    return true;
  }

  async runPDG() {
    const { exercise } = this;
    allApplications.clear();

    await runTaskWithProgressBar(async (progress) => {
      return await this.treeNodeProvider.controller.runAndExportPDGApplication(exercise, progress);
    }, { title: `Run PDG` });
  }

  buildChildren() {
    if (this.exercise.pdgs) {
      return this.exercise.pdgs.map((pdgData) => {
        return this.treeNodeProvider.buildNode(PDGNode, null, this, pdgData);
      });
    }
    return EmptyArray;
  }
}

/** ###########################################################################
 * {@link ExerciseChapterNode}
 *  #########################################################################*/

class ExerciseChapterNode extends ChapterNode {
  get ExerciseNodeClass() {
    return PDGExerciseNode;
  }
}

/** ###########################################################################
 * {@link ExerciseChapterGroupNode}
 *  #########################################################################*/

class ExerciseChapterGroupNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProp) {
    return moreProp.keyword;
  }

  canHaveChildren() {
    return true;
  }

  init() {
    this.description = `(${this.entry.length})`;
  }

  buildChildren() {
    return this.entry.map(chapter => this.treeNodeProvider.buildNode(ExerciseChapterNode, chapter, this));
  }
}

export default class ChapterListNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'javascript-algorithms';
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  /**
   * @type {Chapter[]}
   */
  get chapters() {
    return this.entry;
  }

  buildChildren() {
    const chaptersByGroup = new Map();
    for (const chapter of this.chapters) {
      const { group } = chapter;
      if (!chaptersByGroup.has(group)) {
        chaptersByGroup.set(group, []);
      }
      chaptersByGroup.get(group).push(chapter);
    }

    return Array.from(chaptersByGroup.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([keyword, chapters]) => this.treeNodeProvider.buildNode(ExerciseChapterGroupNode, chapters, this, { keyword }));
  }
}
