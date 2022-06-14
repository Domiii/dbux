import { TreeItemCollapsibleState } from 'vscode';
import fs from 'fs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { exportApplicationToFile, importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import ChapterNode from '../projectViews/practiceView/ChapterNode';
import ExerciseNode from '../projectViews/practiceView/ExerciseNode';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { confirm, showInformationMessage } from '../codeUtil/codeModals';
import { goToCodeLoc } from '../codeUtil/codeNav';
import { showDDGViewForArgs } from '../webViews/ddgWebView';
import { getCurrentResearch } from '../research/Research';

/** @typedef {import('@dbux/projects/src/projectLib/Chapter').default} Chapter */
/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */
/** @typedef {import('../codeUtil/CodeApplication').CodeApplication} CodeApplication */


/** ###########################################################################
 * {@link DDGNode}
 *  #########################################################################*/

class DDGNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProp) {
    return moreProp.ddgTitle;
  }

  /**
   * @type {Exercise}
   */
  get exercise() {
    return this.parent.exercise;
  }

  makeIconPath() {
    return '';
  }

  async handleClick() {
    let { applicationUuid, contextId, filePath, loc } = this;
    let application = allApplications.getById(applicationUuid);
    const fullContextFilePath = pathResolve(this.exercise.project.projectPath, filePath);
    if (!application) {
      const appFilePath = getCurrentResearch().getAppZipFilePath({ experimentId: this.exercise.id });
      if (fs.existsSync(appFilePath)) {
        await importApplicationFromFile(appFilePath);
      }
      else {
        const result = await confirm(`No application file found. Do you want to run the exercise?`);
        if (result) {
          // get new application
          application = await this.treeNodeProvider.controller.runAndExportDDGApplication(this.exercise);

          const newFilePath = application.dataProvider.util.getContextFilePath(contextId);
          if (newFilePath !== fullContextFilePath) {
            this.treeNodeProvider.logger.error(`Ran test, but context is not in original file anymore. Test data probably outdated.`);
          }
          ({ applicationUuid } = application);
        }
        else {
          return;
        }
      }
    }
    await showDDGViewForArgs({ applicationUuid, contextId });
    await goToCodeLoc(fullContextFilePath, loc);
  }
}


/** ###########################################################################
 * {@link DDGExerciseNode}
 *  #########################################################################*/

class DDGExerciseNode extends ExerciseNode {
  get contextValue() {
    return 'dbuxChapterListBuilderView.DDGExerciseNode';
  }

  makeIconPath() {
    return '';
  }

  canHaveChildren() {
    return true;
  }

  async runDDG() {
    const { exercise } = this;
    allApplications.clear();

    await runTaskWithProgressBar(async (progress) => {
      await this.treeNodeProvider.controller.runAndExportDDGApplication(exercise, progress);
    }, { title: `Run DDG` });
  }

  buildChildren() {
    if (this.exercise.ddgs) {
      return this.exercise.ddgs.map((ddgData) => {
        return this.treeNodeProvider.buildNode(DDGNode, null, this, ddgData);
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
    return DDGExerciseNode;
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
    return 'Chapters';
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
    const Keywords = ['Sort', 'Search'];
    const chapters = Object.fromEntries(Keywords.map(keyword => [keyword, []]));
    const otherChapters = [];
    for (const chapter of this.chapters) {
      let matchedKeyword;
      for (const keyword of Keywords) {
        if (chapter.name.toLowerCase().includes(keyword.toLowerCase())) {
          matchedKeyword = keyword;
          break;
        }
      }
      if (matchedKeyword) {
        chapters[matchedKeyword].push(chapter);
      }
      else {
        otherChapters.push(chapter);
      }
    }

    return [
      ...Keywords.map(keyword => this.treeNodeProvider.buildNode(ExerciseChapterGroupNode, chapters[keyword], this, { keyword })),
      this.treeNodeProvider.buildNode(ExerciseChapterGroupNode, otherChapters, this, { keyword: 'Others' }),
      // otherChapters.map(chapter => this.treeNodeProvider.buildNode(DDGChapterNode, chapter, this)),
    ];
  }
}
