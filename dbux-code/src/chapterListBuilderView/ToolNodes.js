import { commands, TreeItemCollapsibleState, window } from 'vscode';
import fs from 'fs';
import { basename, dirname } from 'path';
import open from 'open';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathRelative } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import Process from '@dbux/projects/src/util/Process';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';
import { showTextInNewFile } from '../codeUtil/codeNav';
import { confirm, showInformationMessage } from '../codeUtil/codeModals';
import { getCurrentResearch } from '../research/Research';
import { translate } from '../lang';

/** @typedef {import('./chapterListBuilderViewController').default} ChapterListBuilderViewController */
/** @typedef {import('@dbux/projects/src/projectLib/Project').ProjectsManager} ProjectsManager */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ToolNodes');

const ExportExercises = 4;
const CustomPatchByChapter = {
  hanoiTower: 'hanoiTower0',
};
/**
 * NOTE:
 *  This excludes:
 *    `src/algorithms/sorting/__test__/Sort.test.js`,
 *  and includes:
 *    `src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js`,
 *    `src/algorithms/math/matrix/__tests__/Matrix.test.js`
 */
const ValidFilePattern = /^src\/algorithms\/([^/]*)\/([^/]*)\/(__test__|_test_|__tests__)\/(.*).js$/;

class ToolNode extends BaseTreeViewNode {
  /**
   * @type {ChapterListBuilderViewController}
   */
  get controller() {
    return this.treeNodeProvider.controller;
  }

  /**
   * @type {ProjectsManager}
   */
  get manager() {
    return this.controller.manager;
  }
}

class GenerateListNode extends ToolNode {
  static makeLabel() {
    return 'Generate Lists';
  }

  async handleClick() {
    const { project } = this.controller;

    if (this.controller.exerciseList) {
      const result = await confirm(`This will discard all DDG data in 'javascript-algorithms-all.js', do you want to continue?`);
      if (!result) {
        return;
      }
    }

    await runTaskWithProgressBar(async (progress) => {
      if (!project.doesProjectFolderExist()) {
        progress.report({ message: `Installing project "${project.name}"...` });
        await this.manager.runner.installProject(project);
      }

      await this.manager.externals.initRuntimeServer();

      progress.report({ message: 'Disabling dbux-babel-plugin...' });
      await project.gitResetHard();
      await project.applyPatch('disable_dbux');

      progress.report({ message: 'Parsing tests...' });
      const processOptions = {
        cwd: project.projectPath,
      };
      const testDirectory = 'src/algorithms';
      /**
       * NOTE: set `testNamePattern` to an unused name to skip running all tests
       * @see https://stackoverflow.com/a/69099439/11309695
       */
      const UnusedTestPattern = 'zzzzz';
      const testDataRaw = await Process.execCaptureOut(`npx jest --json --verbose ${testDirectory} -t "${UnusedTestPattern}"`, { processOptions });
      const testData = JSON.parse(testDataRaw);

      const exerciseConfigs = [];
      const addedExerciseNames = new Set();

      for (const testResult of testData.testResults) {
        for (const assertionResult of testResult.assertionResults) {
          const { fullName } = assertionResult;
          /**
           * NOTE: `PolynomialHash` and `SimplePolynomialHash` shares the same fullName in different test files
           */
          const testFilePath = pathRelative(project.projectPath, testResult.name);
          const baseName = basename(testFilePath);
          const name = `${fullName}@${baseName}`;
          if (!addedExerciseNames.has(name)) {
            addedExerciseNames.add(name);
          }
          else {
            continue;
          }
          // const chapter = fullName.substring(0, fullName.indexOf(' '));
          const testFileMatchResult = testFilePath.match(ValidFilePattern);
          if (!testFileMatchResult) {
            continue;
          }
          const [, chapterGroup, chapter] = testFileMatchResult;
          const exerciseConfig = {
            name,
            label: fullName,
            testNamePattern: fullName,
            chapterGroup,
            chapter,
            patch: CustomPatchByChapter[chapter],
            testFilePaths: [testFilePath],
          };
          exerciseConfigs.push(exerciseConfig);
        }
      }
      exerciseConfigs.sort((a, b) => a.name.localeCompare(b.name));

      progress.report({ message: `Generating exercise file...` });
      this.controller.writeExerciseJs(exerciseConfigs);

      progress.report({ message: `Loading exercises...` });
      const exerciseList = this.controller.reloadExerciseList();

      progress.report({ message: `Generating chapter list file...` });
      this.controller.writeChapterListJs(exerciseList);

      progress.report({ message: `Loading chapter list...` });
      const chapters = this.controller.reloadChapterList();

      progress.report({ message: 'Recovering project...' });
      await project.applyPatch('disable_dbux', true);

      showInformationMessage(`List generated, found ${exerciseConfigs.length} exercise(s) in ${chapters.length} chapter(s).`);

      this.treeNodeProvider.refresh();
    }, { title: 'Generating Chapter List' });
  }
}

class ExportApplicationsForceNode extends ToolNode {
  static makeLabel() {
    return `Export all exercise applications`;
  }

  async handleClick() {
    const { exerciseList } = this.controller;
    if (!exerciseList) {
      showInformationMessage(`Please generate chapter list before exports`);
      return;
    }

    allApplications.clear();

    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: `Start exporting exercises...` });
      for (let i = 1; i <= ExportExercises; i++) {
        const exercise = exerciseList.getAt(i);

        if (exercise) {
          await this.manager.switchAndTestBug(exercise);
          const app = allApplications.getById(1);
          exportApplicationToFile(app, getCurrentResearch().getAppZipFilePath(app));
          allApplications.clear();
        }

        progress.report({ message: `(${i}/${ExportExercises}) finished...`, increment: Math.floor(100 / ExportExercises) });
      }
    }, { title: `Export applications` });
  }
}


class DeleteExportedApplicationNode extends ToolNode {
  static makeLabel() {
    return `Delete all exported applications`;
  }

  async handleClick() {
    const { exerciseList } = this.controller;
    if (!exerciseList) {
      showInformationMessage(`Please generate chapter list before delete`);
      return;
    }

    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: `Listing exported files...` });
      const existingFiles = [];
      for (const exercise of exerciseList.getAll()) {
        const filePath = getCurrentResearch().getAppZipFilePath({ experimentId: exercise.id });
        if (fs.existsSync(filePath)) {
          existingFiles.push(filePath);
        }
      }

      if (existingFiles.length) {
        const result = await confirm(`Do you want to delete ${existingFiles.length} exported application file(s)?`);
        if (result) {
          for (const filePath of existingFiles) {
            fs.rmSync(filePath);
          }
          showInformationMessage(`${existingFiles.length} file(s) deleted successfully.`);
        }
      }
      else {
        showInformationMessage(`No exported file found`);
      }
    }, { title: `Delete exported applications` });
  }
}

class GeneratePatchNode extends ToolNode {
  static makeLabel() {
    return `Generate Patch`;
  }

  async handleClick() {
    const { project } = this.controller;
    const patchString = await project.getPatchString();
    const editor = await showTextInNewFile('diff.diff', patchString);
    const result = await confirm(`Do you want to save the patch?`, false);

    if (window.activeTextEditor === editor) {
      await commands.executeCommand('workbench.action.closeActiveEditor');
    }

    if (!result) {
      return;
    }

    const name = await window.showInputBox({
      placeHolder: 'unnamed',
      prompt: 'Patch file name'
    });

    if (!name) {
      return;
    }

    const filePath = project.getPatchFile(name);
    fs.writeFileSync(filePath, patchString);

    // TODO: add exercise config depends on active application
    // this.controller.addExerciseConfig({ name, patch: basename(filePath, '.patch') });

    const msg = translate('savedSuccessfully', { fileName: filePath });
    await showInformationMessage(msg, {
      async 'Show File'() {
        await open(dirname(filePath));
      }
    });
  }
}

class ExportAllDDGScreenshotNode extends ToolNode {
  static makeLabel() {
    return `Export DDG screenshots(test)`;
  }

  async handleClick() {
    // TODO
    const exercises = this.controller.exerciseList.getAll().slice(10, 12);
    const args = await this.controller.gallery.getAllExerciseDDGArgs(exercises);
    log(`gallery.getAllExerciseDDGArgs() = `, args);
  }
}

export default class ToolRootNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Tools';
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  childClasses = [
    GenerateListNode,
    ExportApplicationsForceNode,
    DeleteExportedApplicationNode,
    GeneratePatchNode,
    ExportAllDDGScreenshotNode,
  ]
}
