import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathJoin, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import isPlainObject from 'lodash/isPlainObject';
import { DDGRootTimelineId } from '@dbux/data/src/ddg/constants';
import { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import DDGSettings from '@dbux/data/src/ddg/DDGSettings';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { disposeDDGWebviews, getDDGDot, showDDGViewForArgs } from '../webViews/ddgWebView';
import { getCurrentResearch } from './Research';

/** @typedef {import('../chapterListBuilderView/chapterListBuilderViewController').default} ChapterListBuilderViewController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PDGGallery');

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

  getExerciseFolder(exercise, ...frag) {
    const { chapterGroup, chapter, id } = exercise;
    return pathResolve(this.galleryDataRoot, chapterGroup, chapter, id, ...frag);
  }

  async importOrRunDDGApplication(exercise) {
    const { id } = exercise;
    const appZipFilePath = getCurrentResearch().getAppZipFilePath({ experimentId: id });
    let ddgArgs;
    if (fs.existsSync(appZipFilePath)) {
      // cannot find parsed data in exercise.js, try to import application and parse again
      const app = await importApplicationFromFile(appZipFilePath);
      ddgArgs = this.controller.findDDGContextIdInApp(app, exercise);

      // store results
      const config = this.controller.exerciseConfigsByName.get(exercise.name);
      exercise.ddgs = ddgArgs;
      config.ddgs = ddgArgs;
      this.controller.writeExerciseJs();
    }
    else {
      await this.controller.runAndExportDDGApplication(exercise);
      ddgArgs = exercise.ddgs;
    }
    return ddgArgs;
  }

  async getAllExerciseDDGArgs(exercise) {
    allApplications.clear();
    // let ddgArgs;
    // // hackfix: old ddg data does not contain testLoc, algoLoc data
    // // if (exercise.ddgs) {
    // if (exercise.ddgs && exercise.ddgs[0]?.algoLoc && exercise.ddgs[0]?.testLoc) {
    //   // use parsed data
    //   ddgArgs = exercise.ddgs;
    // }
    // else {
    //   ddgArgs = this.importOrRunDDGApplication(exercise);
    // }

    const ddgArgs = await this.importOrRunDDGApplication(exercise);

    // only pick the middle one for now
    return [ddgArgs[Math.floor(ddgArgs.length / 2)]];
    // return ddgs;
  }

  getPDGRenderDataUniqueId(exercise, renderDataId) {
    const { chapterGroup, chapter, id } = exercise;
    return `${chapterGroup}_${chapter}_${id}_${renderDataId}`;
  }

  async buildGalleryForExercises(exercises) {
    await runTaskWithProgressBar(async (progress) => {
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];

        const galleryConfig = exercise.gallery;
        let screenshotConfigs;
        if (galleryConfig === false) {
          continue;
        }
        else if (isPlainObject(galleryConfig)) {
          ({ screenshotConfigs } = galleryConfig);
        }
        else if (!galleryConfig) {
          screenshotConfigs = RootSummaryModes.map((rootSummaryMode) => {
            const settings = new DDGSettings();
            settings.extraVertical = true;
            return {
              rootSummaryMode,
              settings,
            };
          });
        }
        else {
          logError(`Invalid gallery config of exercise "${exercise.id}": ${galleryConfig}`);
        }

        const ddgArgs = await this.getAllExerciseDDGArgs(exercise);

        let renderDataId = 0;
        const PDGRenderData = [];

        for (let j = 0; j < ddgArgs.length; j++) {
          const ddgArg = ddgArgs[j];
          const id = ++renderDataId;
          let lastDot;
          const screenshots = [];
          for (let k = 0; k < screenshotConfigs.length; k++) {
            progress.report({ message: `Exercise: "${exercise.id}" (${i}/${exercises.length}), DDG: (${k}/${screenshotConfigs.length})` });
            const screenshotConfig = screenshotConfigs[k];
            const app = allApplications.getById(ddgArg.applicationUuid);
            const dp = app.dataProvider;
            const ddg = dp.ddgs.getOrCreateDDG(ddgArg);
            ddg.updateSettings(screenshotConfig.settings);
            ddg.setSummaryMode(DDGRootTimelineId, screenshotConfig.rootSummaryMode);
            await showDDGViewForArgs(ddgArg);
            const dot = await getDDGDot(ddg);
            disposeDDGWebviews();
            if (dot === lastDot) {
              screenshots.push({
                sameAs: k - 1
              });
            }
            else {
              lastDot = dot;
              screenshots.push({ dot });
            }
          }
          PDGRenderData.push({
            id,
            uniqueId: this.getPDGRenderDataUniqueId(exercise, id),
            testLoc: ddgArg.testLoc,
            algoLoc: ddgArg.algoLoc,
            screenshots,
          });
        }

        const exerciseFolderPath = this.controller.gallery.getExerciseFolder(exercise);
        const renderDataJsonFilePath = pathJoin(exerciseFolderPath, 'pdgData.json');
        if (!fs.existsSync(exerciseFolderPath)) {
          fs.mkdirSync(exerciseFolderPath, { recursive: true });
        }
        fs.writeFileSync(renderDataJsonFilePath, JSON.stringify(PDGRenderData, null, 2));
      }
    }, { title: `Generating gallery` });
    // log(`gallery.getAllExerciseDDGArgs() = `, args);
  }
}
