import fs from 'fs';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import { getCurrentResearch } from './Research';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';

/** @typedef {import('../chapterListBuilderView/chapterListBuilderViewController').default} ChapterListBuilderViewController */

export default class PDGGallery {
  /**
   * @type {ChapterListBuilderViewController} 
   */
  controller;

  constructor(controller) {
    this.controller = controller;
    if (!process.env.DBUX_ROOT) {
      throw new Error(`Cannot find "process.env.DBUX_ROOT" for PDGGallery.galleryDataRoot`);
    }
    this.galleryDataRoot = pathResolve(process.env.DBUX_ROOT, 'docs_site/src/data/gallery/pdg');
  }

  getExerciseScreenshotFolder(exercise) {
    const { chapterGroup, chapter, id } = exercise;
    return pathResolve(this.galleryDataRoot, chapterGroup, chapter, id);
  }

  async getAllExerciseDDGArgs(exercises) {
    const allDDGArgs = [];
    await runTaskWithProgressBar(async (progress) => {
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];

        progress.report({ message: `Parsing DDG args of "${exercise.id}" (${i}/${exercises.length})` });
        allApplications.clear();
        const { exerciseId } = exercise;
        const appZipFilePath = getCurrentResearch().getAppZipFilePath({ experimentId: exerciseId });
        let ddgs;
        if (exercise.ddgs) {
          // use parsed data
          ddgs = exercise.ddgs;
        }
        else if (fs.existsSync(appZipFilePath)) {
          // cannot find parsed data in exercise.js, try to import application and parse again
          const app = await importApplicationFromFile(appZipFilePath);
          ddgs = this.controller.findDDGContextIdInApp(app, exercise);
        }
        else {
          await this.controller.runAndExportDDGApplication(exercise);
          ddgs = exercise.ddgs;
        }

        allDDGArgs.push(ddgs[Math.floor(ddgs.length / 2)]);
      }
    });

    return allDDGArgs;
  }
}
