import { TreeItemCollapsibleState } from 'vscode';
import fs from 'fs';
// import { dirname } from 'path';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import { deleteCachedLocRange } from '@dbux/data/src/util/misc';
import { importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
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
    const { applicationId, contextId, filePath, loc } = this;
    const app = allApplications.getById(applicationId);
    if (!app) {
      const appFilePath = getCurrentResearch().getAppZipFilePath({ experimentId: this.exercise.id });
      if (fs.existsSync(appFilePath)) {
        await importApplicationFromFile(appFilePath);
      }
      else {
        const result = await confirm(`No application file found, do you want to run the exercise?`);
        if (result) {
          await this.treeNodeProvider.manager.switchAndTestBug(this.exercise);
        }
        else {
          return;
        }
      }
    }
    await showDDGViewForArgs({ applicationId, contextId });
    await goToCodeLoc(pathResolve(this.exercise.project.projectPath, filePath), loc);
  }
}

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
      progress.report({ message: `Running exercises...` });
      await this.treeNodeProvider.manager.switchAndTestBug(exercise);

      progress.report({ message: `Parsing application` });
      const app = allApplications.getById(1);
      const ddgs = findDDGContextIdInApp(app, exercise);
      exercise.ddgs = ddgs;

      progress.report({ message: `Storing results...` });
      const config = this.treeNodeProvider.controller.exerciseConfigsByName.get(exercise.name);
      config.ddgs = ddgs;
      this.treeNodeProvider.controller.writeExerciseJs();

      showInformationMessage(`Found ${ddgs.length} ddg(s).`);
      this.treeNodeProvider.refresh();
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

class DDGChapterNode extends ChapterNode {
  get ExerciseNodeClass() {
    return DDGExerciseNode;
  }
}

class DDGChapterGroupNode extends BaseTreeViewNode {
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
    return this.entry.map(chapter => this.treeNodeProvider.buildNode(DDGChapterNode, chapter, this));
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
      .map(([keyword, chapters]) => this.treeNodeProvider.buildNode(DDGChapterGroupNode, chapters, this, { keyword }));
    // const Keywords = ['Sort', 'Search'];
    // const chapters = Object.fromEntries(Keywords.map(keyword => [keyword, []]));
    // const otherChapters = [];
    // for (const chapter of this.chapters) {
    //   let matchedKeyword;
    //   for (const keyword of Keywords) {
    //     if (chapter.name.toLowerCase().includes(keyword.toLowerCase())) {
    //       matchedKeyword = keyword;
    //       break;
    //     }
    //   }
    //   if (matchedKeyword) {
    //     chapters[matchedKeyword].push(chapter);
    //   }
    //   else {
    //     otherChapters.push(chapter);
    //   }
    // }

    // return [
    //   ...Keywords.map(keyword => this.treeNodeProvider.buildNode(DDGChapterGroupNode, chapters[keyword], this, { keyword })),
    //   this.treeNodeProvider.buildNode(DDGChapterGroupNode, otherChapters, this, { keyword: 'Others' }),
    //   // otherChapters.map(chapter => this.treeNodeProvider.buildNode(DDGChapterNode, chapter, this)),
    // ];
  }
}

/** ###########################################################################
 * util
 *  #########################################################################*/

/**
 * @param {CodeApplication} app 
 * @param {Exercise} exercise
 */
function findDDGContextIdInApp(app, exercise) {
  const { project } = exercise;
  const dp = app.dataProvider;
  // const testFilePath = pathResolve(project.projectPath, exercise.testFilePaths[0]);
  const testProgramContexts = dp.collections.staticProgramContexts.getAllActual().filter((staticProgramContext) => {
    const { filePath } = staticProgramContext;
    // const fileDir = dirname(filePath);
    // const readmeFilePath = pathResolve(fileDir, 'README.md');
    // const testFolderPath = pathResolve(fileDir, '__test__');

    // return filePath.includes('src/algorithms') && fs.existsSync(readmeFilePath) && fs.existsSync(testFolderPath);
    const ValidFilePattern = /src\/algorithms\/([^/])*\/([^/])*\/(.*).js/;
    return ValidFilePattern.test(filePath);
  });

  const staticContexts = testProgramContexts.flatMap(({ programId }) => dp.indexes.staticContexts.byFile.get(programId) || EmptyArray);
  const contexts = staticContexts
    .flatMap(({ staticContextId }) => dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray)
    .sort((a, b) => a.contextId - b.contextId);
  const addedContextIds = new Set();
  return contexts.map(context => {
    const { contextId } = context;
    const { applicationId } = app;
    const functionName = makeContextLabel(context, app);
    const callerTrace = dp.util.getOwnCallerTraceOfContext(contextId);
    if (!callerTrace) {
      return null;
    }

    let { parentContextId } = context;
    while (parentContextId) {
      if (addedContextIds.has(parentContextId)) {
        return null;
      }
      ({ parentContextId } = dp.util.getExecutionContext(parentContextId));
    }

    // const callerProgramPath = dp.util.getTraceFilePath(callerTrace.traceId);
    // if (callerProgramPath !== testFilePath) {
    //   return null;
    // }

    const params = dp.util.getCallArgValueStrings(callerTrace.callId);
    const filePath = pathRelative(project.projectPath, dp.util.getContextFilePath(contextId));
    const staticContext = dp.util.getContextStaticContext(contextId);
    const loc = { ...staticContext.loc };
    deleteCachedLocRange(loc);

    addedContextIds.add(contextId);

    return {
      ddgTitle: `${functionName}(${params.join(', ')})`,
      contextId,
      filePath,
      loc,
      applicationId,
    };
  }).filter(x => !!x);
}

