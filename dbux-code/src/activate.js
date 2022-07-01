import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { initCodeDeco } from './codeDeco';

import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';

import { initCodeApplications } from './codeUtil/CodeApplication';
import { initTraceDetailsView } from './traceDetailsView/traceDetailsController';
import { initTraceSelection } from './codeUtil/codeSelection';
import { initApplicationsView } from './applicationsView/applicationsViewController';
import { createProjectManager } from './projectViews/projectControl';
import { initProjectView } from './projectViews/projectViewsController';
import { initGraphView } from './webViews/graphWebView';
import { initPathwaysView } from './webViews/pathwaysWebView';
import { initWebviewWrapper } from './codeUtil/WebviewWrapper';
import { installDbuxDependencies } from './codeUtil/installUtil';
import { initDataFlowView } from './dataFlowView/dataFlowViewController';
import { initGlobalAnalysisView } from './globalAnalysisView/GlobalAnalysisViewController';
import { initDialogController } from './dialogs/dialogController';
import DialogNodeKind from './dialogs/DialogNodeKind';
import { showInformationMessage } from './codeUtil/codeModals';
import { translate } from './lang';
import { initChapterListBuilderView } from './dbuxPdgView/chapterListBuilderViewController';
// import { initPlugins } from './PluginMgr';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

/**
 * @param {import('vscode').ExtensionContext} context
 */
export default async function activate(context) {
  const dbuxRoot = process.env.DBUX_ROOT ? `, DBUX_ROOT=${process.env.DBUX_ROOT}` : '';
  log(`Starting Dbux v${process.env.DBUX_VERSION} (mode=${process.env.NODE_ENV}${dbuxRoot})...`);

  // make sure, projectManager is available
  createProjectManager(context);

  // install dependencies (and show progress bar) right away
  await installDbuxDependencies();

  // initRuntimeServer(context);
  initCodeApplications(context);
  initCodeDeco(context);
  initToolBar(context);
  initTraceSelection(context);
  // initPlayback();

  initWebviewWrapper(context);

  initApplicationsView(context);
  const chapterListBuilderViewController = initChapterListBuilderView(context);
  const globalAnalysisViewController = initGlobalAnalysisView(context);
  const traceDetailsController = initTraceDetailsView(context);
  const dataFlowController = initDataFlowView(context);
  const projectViewController = initProjectView(context);


  initCommands(
    context,
    traceDetailsController,
    dataFlowController,
    globalAnalysisViewController,
  );

  // init the webviews
  await initGraphView();
  await initPathwaysView();

  await projectViewController.doInitWork();
  chapterListBuilderViewController.init();

  const dialogController = initDialogController();
  maybeStartTutorial(dialogController, context);
  maybeStartSurvey1(dialogController, context);

  // await initPlugins();
}

// ###########################################################################
// Maybe start dialog on pre-activate
// ###########################################################################

/**
 * @param {DialogController} dialogController 
 */
async function maybeStartTutorial(dialogController) {
  const tutorialDialog = dialogController.getDialog('tutorial');
  try {
    const firstNode = tutorialDialog.getCurrentNode();

    if (!tutorialDialog.started) {
      await showInformationMessage(translate('newOnDbux.message'), {
        async [translate('newOnDbux.yes')]() {
          await tutorialDialog.start();
        },
        async [translate('newOnDbux.no')]() {
          await tutorialDialog.setState('end');
        }
      });
    }
    else if (!firstNode.end) {
      // dialog unfinished
      if (firstNode.kind === DialogNodeKind.Modal) {
        const confirmResult = await tutorialDialog.askToContinue();
        if (confirmResult === false) {
          await tutorialDialog.setState('cancel');
        }
        else if (confirmResult) {
          await tutorialDialog.start();
        }
      }
      else {
        await tutorialDialog.start();
      }
    }
    else {
      // dialog finished, do nothing
    }
  }
  catch (err) {
    tutorialDialog.logger.error(new NestedError('Dialog error.', err));
  }
}

/**
 * @param {DialogController} dialogController 
 */
async function maybeStartSurvey1(dialogController) {
  const surveyDialog = dialogController.getDialog('survey1');

  try {
    if (surveyDialog.started) {
      const firstNode = surveyDialog.getCurrentNode();
      if (!firstNode.end) {
        const confirmResult = await surveyDialog.askToContinue();
        if (confirmResult === false) {
          await surveyDialog.setState('cancel');
        }
        else if (confirmResult) {
          await surveyDialog.start();
        }
      }
    }
    else {
      await surveyDialog.start('waitToStart');
    }
  }
  catch (err) {
    surveyDialog.logger.error(new NestedError('Dialog error.', err));
  }
}