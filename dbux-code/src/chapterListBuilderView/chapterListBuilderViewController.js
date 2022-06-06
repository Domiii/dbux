import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import { getProjectManager } from '../projectViews/projectControl';
import ChapterListBuilderNodeProvider from './ChapterListBuilderNodeProvider';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ChapterListBuilderViewController');

let controller;
const ProjectName = 'javascript-algorithms';
const ChapterListName = 'javascript-algorithms-all';

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

  reloadExerciseList() {
    if (fs.existsSync(this.project.getExercisePath(ChapterListName))) {
      const exerciseList = this.project.reloadExercises(ChapterListName);
      this.treeNodeProvider.controller.exerciseList = exerciseList;
      return exerciseList;
    }
    return null;
  }

  reloadChapterList() {
    if (fs.existsSync(this.project.getAssetPath('chapterLists', `${ChapterListName}.js`))) {
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
