import fs from 'fs';
import path from 'path';
import open from 'open';
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { pathJoin, pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { buildDot } from '@dbux/data/src/ddg/DotBuilder';
import { importApplicationFromFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import isPlainObject from 'lodash/isPlainObject';
import { DDGRootTimelineId } from '@dbux/data/src/ddg/constants';
import { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import DDGSettings from '@dbux/data/src/ddg/DDGSettings';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import { showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { getCurrentResearch } from './Research';

/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default}Exercise*/
/** @typedef {import('../chapterListBuilderView/chapterListBuilderViewController').default} ChapterListBuilderViewController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PDGGallery');

const PDGFileName = 'pdgData.json';

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

  /**
   * @param {Exercise[]} exercises
   */
  async buildGalleryForExercises(exercises, force = false) {
    await runTaskWithProgressBar(async (progress) => {
      const failedExerciseIds = [];
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        const exerciseFolderPath = this.getExerciseFolder(exercise);
        const renderDataJsonFilePath = pathJoin(exerciseFolderPath, PDGFileName);
        try {
          if (!force && fs.existsSync(renderDataJsonFilePath)) {
            log(`pdgData.json exists for exercise ${exercise.id}, skipped.`);
            continue;
          }
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

          if (!fs.existsSync(exerciseFolderPath)) {
            fs.mkdirSync(exerciseFolderPath, { recursive: true });
          }

          const ddgArgs = await this.getAllExerciseDDGArgs(exercise);

          let renderDataId = 0;
          const PDGRenderData = [];

          for (let j = 0; j < ddgArgs.length; j++) {
            const ddgArg = ddgArgs[j];
            const { ddgTitle } = ddgArg;
            try {
              const id = ++renderDataId;
              let lastDot;
              const screenshots = [];
              const app = allApplications.getById(ddgArg.applicationUuid);
              const dp = app.dataProvider;
              const ddg = dp.ddgs.getOrCreateDDG(ddgArg);

              // check if ddg build failed
              const failedReason = dp.ddgs.getCreateDDGFailureReason(ddgArg);
              if (failedReason) {
                PDGRenderData.push({
                  success: false,
                  failedReason,
                  ddgTitle,
                });
                continue;
              }

              // check if there are missing data traces
              const missingDataTraces = dp.util.getAllMissingDataStaticTraces();
              if (missingDataTraces.length) {
                const traceLocations = missingDataTraces.map(staticTrace => {
                  const filePath = dp.util.getStaticTraceProgramPath(staticTrace.staticTraceId);
                  const relativeFilePath = pathRelative(exercise.project.projectPath, filePath);
                  const { line } = staticTrace.loc.start;
                  return `${relativeFilePath}#${line}`;
                });

                PDGRenderData.push({
                  success: false,
                  failedReason: 'missing data traces',
                  ddgTitle,
                  traceLocations,
                });
                continue;
              }

              // passed, generate screenshots
              for (let k = 0; k < screenshotConfigs.length; k++) {
                progress.report({ message: `Exercise: "${exercise.id}" (${i}/${exercises.length}), DDG: (${k}/${screenshotConfigs.length})` });
                const screenshotConfig = screenshotConfigs[k];
                const { settings, rootSummaryMode } = screenshotConfig;
                ddg.updateSettings(settings);
                ddg.setSummaryMode(DDGRootTimelineId, rootSummaryMode);

                const dot = buildDot(ddg);

                if (dot === lastDot) {
                  screenshots.push({
                    sameAs: k - 1,
                    settings,
                    rootSummaryMode
                  });
                }
                else {
                  lastDot = dot;
                  screenshots.push({ dot, settings, rootSummaryMode });
                }
              }
              PDGRenderData.push({
                id,
                ddgTitle,
                uniqueId: this.getPDGRenderDataUniqueId(exercise, id),
                testLoc: ddgArg.testLoc,
                algoLoc: ddgArg.algoLoc,
                screenshots,
              });
            }
            catch (err) {
              // failed to parse renderData
              failedExerciseIds.push(exercise.id);
              logError(new NestedError(`Cannot generate pdg render data for exercise: ${exercise.id}`, err));
              const errData = {
                success: false,
                failedReason: 'error',
                ddgTitle,
                error: err.stack,
              };
              PDGRenderData.push(errData);
            }
          }
          fs.writeFileSync(renderDataJsonFilePath, JSON.stringify(PDGRenderData, null, 2));
        }
        catch (err) {
          // failed to execute application
          fs.writeFileSync(renderDataJsonFilePath, JSON.stringify({
            succses: false,
            failedReason: 'error',
            error: err.stack
          }, null, 2));
        }
      }
      if (failedExerciseIds.length) {
        logError(`Failed to generate render data for ${failedExerciseIds.length} exercise(s), id: ${failedExerciseIds}`);
      }
    }, { title: `Generating gallery` });
    // log(`gallery.getAllExerciseDDGArgs() = `, args);
  }

  generateGraphsJS() {
    let lastExerciseId = 0;
    const importData = [];
    const exportData = {
      chapterGroups: [],
    };

    const chapterGroups = fs.readdirSync(this.galleryDataRoot);
    for (const chapterGroupName of chapterGroups) {
      const chapterGroup = {
        name: chapterGroupName,
        chapters: [],
      };
      const chapterGroupFolderPath = pathJoin(this.galleryDataRoot, chapterGroupName);
      if (!fs.lstatSync(chapterGroupFolderPath).isDirectory()) {
        continue;
      }

      const chapters = fs.readdirSync(chapterGroupFolderPath);
      for (const chapterName of chapters) {
        const chapter = {
          name: chapterName,
          exercises: [],
        };
        const chapterFolderPath = pathJoin(chapterGroupFolderPath, chapterName);
        for (const exerciseId of fs.readdirSync(chapterFolderPath)) {
          const exerciseFolderPath = pathJoin(chapterFolderPath, exerciseId);
          const pdgFilePath = pathJoin(exerciseFolderPath, PDGFileName);
          if (!fs.existsSync(pdgFilePath)) {
            continue;
          }

          const pdgFileImportPath = './' + pathRelative(this.galleryDataRoot, pdgFilePath);
          const globalExerciseId = ++lastExerciseId;
          const importVariableName = `pdg${globalExerciseId}`;
          const exercise = {
            id: exerciseId,
            ddgs: importVariableName
          };
          chapter.exercises.push(exercise);
          importData.push({ importVariableName, importFilePath: pdgFileImportPath });
        }
        chapterGroup.chapters.push(chapter);
      }

      exportData.chapterGroups.push(chapterGroup);
    }

    let output = '';
    importData.forEach(({ importVariableName, importFilePath }) => output += `import ${importVariableName} from '${importFilePath}';\n`);
    output += '\n';
    output += 'export default ';
    const exportString = JSON.stringify(exportData, null, 2).replaceAll(/"ddgs": "(pdg\d*)"/g, '"ddgs": $1');
    output += exportString;

    const graphJSPath = pathJoin(this.galleryDataRoot, 'graphs.js');
    fs.writeFileSync(graphJSPath, output);

    const msg = translate('savedSuccessfully', { fileName: graphJSPath });
    showInformationMessage(msg, {
      async 'Show File'() {
        await open(path.dirname(graphJSPath));
      }
    });
  }

  getAllPDGFiles() {
    const allFiles = [];
    const chapterGroups = fs.readdirSync(this.galleryDataRoot);
    for (const chapterGroup of chapterGroups) {
      const chapterGroupFolderPath = pathJoin(this.galleryDataRoot, chapterGroup);
      if (!fs.lstatSync(chapterGroupFolderPath).isDirectory()) {
        continue;
      }
      const chapters = fs.readdirSync(chapterGroupFolderPath);
      for (const chapter of chapters) {
        const chapterFolderPath = pathJoin(chapterGroupFolderPath, chapter);
        for (const exerciseId of fs.readdirSync(chapterFolderPath)) {
          const exerciseFolderPath = pathJoin(chapterFolderPath, exerciseId);
          const pdgFilePath = pathJoin(exerciseFolderPath, PDGFileName);
          if (!fs.existsSync(pdgFilePath)) {
            continue;
          }
          allFiles.push({ chapterGroup, chapter, exerciseId, filePath: pdgFilePath });
        }
      }
    }
    return allFiles;
  }
}
