import fs from 'fs';
import { dirname } from 'path';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import ChapterNode from '../projectViews/practiceView/ChapterNode';
import ExerciseNode from '../projectViews/practiceView/ExerciseNode';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { showInformationMessage } from '../codeUtil/codeModals';
import { showDDGViewForArgs } from '../webViews/ddgWebView';

/** @typedef {import('../codeUtil/CodeApplication').CodeApplication} CodeApplication */

class DDGNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProp) {
    return moreProp.ddgTitle;
  }

  async handleClick() {
    const { applicationId, contextId } = this;
    await showDDGViewForArgs({ applicationId, contextId });
  }
}

class DDGExerciseNode extends ExerciseNode {
  get contextValue() {
    return 'dbuxChapterListBuilderView.DDGExerciseNode';
  }

  canHaveChildren() {
    return true;
  }

  async runDDG() {
    const { exercise } = this;
    allApplications.clear();

    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: `Running exercises...` });
      await this.manager.switchAndTestBug(exercise);

      progress.report({ message: `Parsing application` });
      const app = allApplications.getById(1);
      const ddgs = findDDGContextIdInApp(app);
      exercise.ddgs = ddgs;

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

export default class ChapterListNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Chapters';
  }

  buildChildren() {
    return this.entry.map(chapter => this.treeNodeProvider.buildNode(DDGChapterNode, chapter, this));
  }
}

/** ###########################################################################
 * util
 *  #########################################################################*/

/**
 * @param {CodeApplication} app 
 */
function findDDGContextIdInApp(app) {
  const dp = app.dataProvider;
  const testProgramContexts = dp.collections.staticProgramContexts.getAllActual().filter((staticProgramContext) => {
    const { filePath } = staticProgramContext;
    const fileDir = dirname(filePath);
    const readmeFilePath = pathResolve(fileDir, 'README.md');
    const testFolderPath = pathResolve(fileDir, '__test__');
    return fs.existsSync(readmeFilePath) && fs.existsSync(testFolderPath);
  });

  const staticContexts = testProgramContexts.flatMap(({ programId }) => dp.indexes.staticContexts.byFile.get(programId) || EmptyArray);
  const contexts = staticContexts.flatMap(({ staticContextId }) => dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray);
  return contexts.map(context => {
    const { contextId } = context;
    const { applicationId } = app;
    const functionName = makeContextLabel(context, app);
    const callerTrace = dp.util.getCallerTraceOfContext(contextId);
    if (!callerTrace) {
      return null;
    }

    const params = dp.util.getCallArgValueStrings(callerTrace.callId);

    return {
      ddgTitle: `${functionName}(${params.join(', ')})`,
      contextId,
      applicationId,
    };
  }).filter(x => !!x);
}

