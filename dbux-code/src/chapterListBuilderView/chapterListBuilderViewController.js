import fs from 'fs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import sleep from '@dbux/common/src/util/sleep';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathRelative } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import { deleteCachedLocRange } from '@dbux/data/src/util/misc';
import { getProjectManager } from '../projectViews/projectControl';
import ChapterListBuilderNodeProvider from './ChapterListBuilderNodeProvider';
import { getCurrentResearch } from '../research/Research';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ChapterListBuilderViewController');

let controller;
const ProjectName = 'javascript-algorithms';
const ExerciseListName = 'javascript-algorithms-all';
const ChapterListName = ExerciseListName;
const ExerciseListFileName = `${ExerciseListName}.js`;
const ChapterListFileName = `${ChapterListName}.js`;

export default class ChapterListBuilderViewController {
  constructor() {
    this.treeNodeProvider = new ChapterListBuilderNodeProvider(this);
  }

  get treeView() {
    return this.treeNodeProvider.treeView;
  }

  get manager() {
    return getProjectManager();
  }

  get project() {
    return this.manager.projects.getByName(ProjectName);
  }

  writeExerciseJs(exerciseConfigs = this.exerciseConfigs) {
    const filePath = this.manager.getAssetPath('exercises', ExerciseListFileName);
    const content = `module.exports = ${JSON.stringify(exerciseConfigs, null, 2)}`;
    fs.writeFileSync(filePath, content);
  }

  writeChapterListJs(exerciseList) {
    const exercisesByChapterName = new Map();
    for (const exercise of exerciseList) {
      const { chapter } = exercise;
      if (!exercisesByChapterName.has(chapter)) {
        exercisesByChapterName.set(chapter, []);
      }
      exercisesByChapterName.get(chapter).push(exercise);
    }

    const chapters = Array.from(exercisesByChapterName.entries()).map(([chapterName, exercises], index) => {
      return {
        id: index + 1,
        name: chapterName,
        group: exercises[0].chapterGroup,
        exercises: exercises.map(e => e.id),
      };
    });

    const filePath = this.manager.getAssetPath('chapterLists', ChapterListFileName);
    const content = `module.exports = ${JSON.stringify(chapters, null, 2)} `;
    fs.writeFileSync(filePath, content);
  }

  reloadExerciseList() {
    const exerciseFilePath = this.project.getExercisePath(ExerciseListName);
    if (fs.existsSync(exerciseFilePath)) {
      this.exerciseConfigs = this.project.loadExerciseConfigs(ExerciseListName);
      this.exerciseConfigsByName = new Map();
      this.exerciseConfigs.forEach(config => this.exerciseConfigsByName.set(config.name, config));
      this.exerciseList = this.project.reloadExercises(ExerciseListName);
      return this.exerciseList;
    }
    return null;
  }

  reloadChapterList() {
    if (fs.existsSync(this.project.getAssetPath('chapterLists', ChapterListFileName))) {
      this.chapters = this.manager.reloadChapterList(ChapterListName);
      return this.chapters;
    }
    return null;
  }

  // addExerciseConfig() {
  //   const configs = this.project.loadExerciseConfigs(ExerciseListName);
  //   configs.push()
  // }

  init() {
    this.reloadExerciseList();
    this.reloadChapterList();
    this.treeNodeProvider.refresh();
  }

  initOnActivate(context) {
    // click event listener
    this.treeNodeProvider.initDefaultClickCommand(context);
  }

  /**
   * @param {Exercise} exercise 
   */
  async runAndExportDDGApplication(exercise, progress) {
    progress?.report({ message: `Running exercises...` });
    await this.treeNodeProvider.manager.switchAndTestBug(exercise);

    const app = allApplications.selection.getFirst();

    if (!app) {
      throw new Error(`Run failed. No application found.`);
    }

    while (app.dataProvider.indexes.dataNodes.byAccessId.getAll().length < 1) {
      // hackfix race condition prevention: make sure, data has been stored before exporting
      await sleep(20);
    }

    // future-work: make sure, this is the right application (add some isApplicationOfExercise function)

    progress?.report({ message: `Parsing application` });
    if (allApplications.selection.count !== 1) {
      this.treeNodeProvider.warn(`Ran test, but found more than one application (selecting first).`);
    }
    const ddgs = findDDGContextIdInApp(app, exercise);
    exercise.ddgs = ddgs;

    progress?.report({ message: `Storing results and exporting application...` });
    const config = this.exerciseConfigsByName.get(exercise.name);
    config.ddgs = ddgs;

    // write exercise file
    this.writeExerciseJs();

    // export application
    const fpath = getCurrentResearch().getAppZipFilePath(app);
    await exportApplicationToFile(app, fpath);

    // showInformationMessage(`Found ${ddgs.length} ddg(s).`);
    this.treeNodeProvider.refresh();

    return app;
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
    /**
     * NOTE: Only include files that match `src/algorithms/${chapterGroup}/${chapter}/${fileName}.js`
     */
    const ValidFilePattern = /src\/algorithms\/([^/])*\/([^/])*\/([^/]*).js/;
    return ValidFilePattern.test(filePath);
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
      // fullContextFilePath,
      filePath,
      loc,
      applicationUuid,
    };
  }).filter(x => !!x);
}

// ###########################################################################
// init
// ###########################################################################

export function initChapterListBuilderView(context) {
  controller = new ChapterListBuilderViewController();
  controller.initOnActivate(context);

  // refresh right away
  controller.treeNodeProvider.refresh();

  return controller;
}
