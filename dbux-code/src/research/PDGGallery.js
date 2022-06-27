import fs from 'fs';
import path, { basename } from 'path';
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
import { showTextInNewFile } from '../codeUtil/codeNav';
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
    // return [ddgArgs[Math.floor(ddgArgs.length / 2)]];
    return ddgArgs;
  }

  getPDGRenderDataUniqueId(exercise, renderDataId) {
    const { chapterGroup, chapter, id } = exercise;
    return `${chapterGroup}_${chapter}_${id}_${renderDataId}`;
  }

  getPDGScreenshotData(dp, exercise, ddgArg) {
    // generate screenshot configs
    const galleryConfig = exercise.gallery;
    let screenshotConfigs;
    if (galleryConfig === false) {
      return null;
    }
    else if (galleryConfig?.screenshotConfigs) {
      ({ screenshotConfigs } = galleryConfig);
    }
    else {
      screenshotConfigs = RootSummaryModes.map((rootSummaryMode) => {
        const settings = new DDGSettings();
        settings.extraVertical = true;
        return {
          rootSummaryMode,
          settings,
        };
      });
    }
    // else {
    //   throw new Error(`Invalid gallery config of exercise "${exercise.id}": ${galleryConfig}`);
    // }

    let lastDot;
    const screenshots = [];

    for (let k = 0; k < screenshotConfigs.length; k++) {
      const screenshotConfig = screenshotConfigs[k];
      const { settings, rootSummaryMode } = screenshotConfig;
      try {
        const ddg = dp.ddgs.getOrCreateDDG(ddgArg);
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
      catch (err) {
        screenshots.push({
          crash: true,
          failedReason: err.message,
          error: err.stack,
          settings,
          rootSummaryMode,
        });
      }
    }
    return screenshots;
  }

  getPDGRenderData(exercise, ddgArgs) {
    let renderDataId = 0;
    const PDGRenderData = [];

    for (let j = 0; j < ddgArgs.length; j++) {
      const ddgArg = ddgArgs[j];
      const { ddgTitle } = ddgArg;
      const id = ++renderDataId;
      const app = allApplications.getById(ddgArg.applicationUuid);
      const dp = app.dataProvider;

      // check if we can build ddg
      const failedReason = dp.ddgs.getCreateDDGFailureReason(ddgArg);
      if (failedReason) {
        PDGRenderData.push({
          success: false,
          failedReason,
          ddgTitle,
        });
      }
      else {
        const screenshots = this.getPDGScreenshotData(dp, exercise, ddgArg);
        PDGRenderData.push({
          id,
          ddgTitle,
          uniqueId: this.getPDGRenderDataUniqueId(exercise, id),
          testLoc: ddgArg.testLoc,
          algoLoc: ddgArg.algoLoc,
          screenshots,
        });
      }
    }
    return PDGRenderData;
  }

  /**
   * @param {Exercise[]} exercises
   */
  async buildGalleryForExercises(exercises, force = false) {
    await runTaskWithProgressBar(async (progress) => {
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (exercise.ignore) {
          continue;
        }
        if (exercise.gallery === false) {
          continue;
        }

        const exerciseFolderPath = this.getExerciseFolder(exercise);
        const renderDataJsonFilePath = pathJoin(exerciseFolderPath, PDGFileName);
        if (!force && fs.existsSync(renderDataJsonFilePath)) {
          log(`pdgData.json exists for exercise ${exercise.id}, skipped.`);
          continue;
        }
        if (!fs.existsSync(exerciseFolderPath)) {
          fs.mkdirSync(exerciseFolderPath, { recursive: true });
        }

        try {
          const ddgArgs = await this.getAllExerciseDDGArgs(exercise);

          progress.report({ message: `Exercise: "${exercise.label}" (${i}/${exercises.length})` });
          const PDGRenderData = this.getPDGRenderData(exercise, ddgArgs);
          fs.writeFileSync(renderDataJsonFilePath, JSON.stringify(PDGRenderData, null, 2));
        }
        catch (err) {
          // failed to execute application
          fs.writeFileSync(renderDataJsonFilePath, JSON.stringify({
            runFailed: true,
            failedReason: err.message,
            error: err.stack
          }, null, 2));
        }
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

          const { label, name } = this.controller.exerciseList.getById(exerciseId);
          const pdgFileImportPath = './' + pathRelative(this.galleryDataRoot, pdgFilePath);
          const globalExerciseId = ++lastExerciseId;
          const importVariableName = `pdg${globalExerciseId}`;
          const exercise = {
            id: exerciseId,
            label,
            name,
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

  getAllJSAFiles() {
    const jsaRoot = pathJoin(this.controller.project.projectPath, 'src');
    const fpaths = getFilesRecursive(jsaRoot);
    log(`${fpaths.length} files found (in "${jsaRoot}"):\n  ${fpaths.map(f => f.replaceAll(jsaRoot + '/', '')).join('\n  ')}`);
    return fpaths;
  }

  /**
   * @deprecated
   */
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

  generatePDGTable() {
    const chapterGroupsByName = new Map();

    // collect chapter data, add to respective `chapterGroup`
    for (const chapter of this.controller.chapters) {
      const { group, name, ignore } = chapter;
      if (!chapterGroupsByName.get(group)) {
        chapterGroupsByName.set(group, { chapterGroup: name, chapters: [] });
      }

      const chapterGroup = chapterGroupsByName.get(group);
      const chatperData = {
        algoName: name,
        ignore,
      };
      if (!ignore) {
        // read pdgData.json
        if (!chapter.ddgSamples) {
          logError(`chapter "${name}" has not configure ddgSamples yet`);
          continue;
        }
        else {
          for (const { exerciseName, ddgTitle } of chapter.ddgSamples) {
            const exercise = this.controller.exerciseList.getByName(exerciseName);
            const renderDataFilePath = this.getExerciseFolder(exercise, 'pdgData.json');
            const pdgData = JSON.parse(fs.readFileSync(renderDataFilePath));
            // TODO: use these data to generate table
          }
        }
      }

      chapterGroup.chapters.push(chatperData);
    }
  }

  generateEmptyPDGTable() {
    // TODO

    // TODO: `subAlgos` (bits)
    const result = [];
    for (const chapter of this.controller.chapters) {
      result.push({
        group: chapter.group,
        name: chapter.name,
        runFailed: true,
        crash: true,
        success: false,
        failedReason: 'TODO',
        gallery: {
          ddgSamples: [
            {
              exerciseName: 'TODO',
              ddgTitle: 'TODO'
            },
            {
              exerciseName: 'TODO',
              ddgTitle: 'TODO'
            },
          ]
        },
        TODO: true,
      });
    }

    // count stats in chapterGroups
    showTextInNewFile('pdgStatsTable.tex', JSON.stringify(result));
  }
}

/**
 * @see https://stackoverflow.com/a/16684530
 */
function getFilesRecursive(dir) {
  let results = [];
  let list = fs.readdirSync(dir);
  list.forEach(function (fname) {
    const file = pathJoin(dir, fname);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (fname.match(/(node_modules|\.dist)/)) {
        return;
      }
      /* Recurse into a subdirectory */
      results = results.concat(getFilesRecursive(file));
    } else {
      if (!fname.match(/\.js$/)) {
        return;
      }
      /* Is a file */
      results.push(file);
    }
  });
  return results;
}
