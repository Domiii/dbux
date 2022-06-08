import { TreeItemCollapsibleState } from 'vscode';
import fs from 'fs';
import { dirname } from 'path';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import { deleteCachedLocRange } from '@dbux/data/src/util/misc';
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
    let { applicationUuid, contextId, fullContextFilePath, loc } = this;
    const app = allApplications.getById(applicationUuid);
    if (!app) {
      const appFilePath = getCurrentResearch().getAppZipFilePath({ experimentId: this.exercise.id });
      if (fs.existsSync(appFilePath)) {
        await importApplicationFromFile(appFilePath);
      }
      else {
        const result = await confirm(`No application file found. Do you want to run the exercise?`);
        if (result) {
          await this.treeNodeProvider.manager.switchAndTestBug(this.exercise);

          // hackfix: stupid sanity checks, then update applicationUuid
          // TODO: better, more reliable checks
          if (allApplications.getAllActiveCount() !== 1) {
            throw new Error(`Ran test, but found more than one application`);
          }
          const newFilePath = app.dataProvider.util.getContextFilePath(contextId);
          if (newFilePath !== fullContextFilePath) {
            throw new Error(`Ran test, but context is not in original file anymore. Test data probably outdated.`);
          }
          applicationUuid = this.applicationUuid = allApplications.selection.getFirst().applicationUuid;
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
      const app = allApplications.selection.getFirst();
      const ddgs = findDDGContextIdInApp(app, exercise);
      exercise.ddgs = ddgs;

      progress.report({ message: `Storing results and exporting application...` });
      const config = this.treeNodeProvider.controller.exerciseConfigsByName.get(exercise.name);
      config.ddgs = ddgs;

      // write exercise file
      this.treeNodeProvider.controller.writeExerciseJs();

      // export application
      await exportApplicationToFile(app, getCurrentResearch().getAppZipFilePath(app));

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
      ...Keywords.map(keyword => this.treeNodeProvider.buildNode(DDGChapterGroupNode, chapters[keyword], this, { keyword })),
      this.treeNodeProvider.buildNode(DDGChapterGroupNode, otherChapters, this, { keyword: 'Others' }),
      // otherChapters.map(chapter => this.treeNodeProvider.buildNode(DDGChapterNode, chapter, this)),
    ];
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
    const fileDir = dirname(filePath);
    const readmeFilePath = pathResolve(fileDir, 'README.md');
    const testFolderPath = pathResolve(fileDir, '__test__');
    return filePath.includes('src/algorithms') && fs.existsSync(readmeFilePath) && fs.existsSync(testFolderPath);
  });

  const staticContexts = testProgramContexts.flatMap(({ programId }) => dp.indexes.staticContexts.byFile.get(programId) || EmptyArray);
  const contexts = staticContexts
    .flatMap(({ staticContextId }) => dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray)
    .sort((a, b) => a.contextId - b.contextId);
  const addedContextIds = new Set();
  return contexts.map(context => {
    const { contextId } = context;
    const { applicationUuid } = app;
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
    const fullContextFilePath = dp.util.getContextFilePath(contextId);
    const filePath = pathRelative(project.projectPath, fullContextFilePath);
    const staticContext = dp.util.getContextStaticContext(contextId);
    const loc = { ...staticContext.loc };
    deleteCachedLocRange(loc);

    addedContextIds.add(contextId);

    return {
      ddgTitle: `${functionName}(${params.join(', ')})`,
      contextId,
      fullContextFilePath,
      filePath,
      loc,
      applicationUuid,
    };
  }).filter(x => !!x);
}

