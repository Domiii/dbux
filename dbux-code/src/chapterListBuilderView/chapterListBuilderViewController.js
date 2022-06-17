import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import { getProjectManager } from '../projectViews/projectControl';
import ChapterListBuilderNodeProvider from './ChapterListBuilderNodeProvider';

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

  init() {
    this.reloadExerciseList();
    this.reloadChapterList();
    this.treeNodeProvider.refresh();
  }

  initOnActivate(context) {
    // click event listener
    this.treeNodeProvider.initDefaultClickCommand(context);
  }
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
