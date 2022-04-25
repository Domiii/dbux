import { newLogger } from '@dbux/common/src/log/logger';
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
// import { initPlugins } from './PluginMgr';
// import { maybeStartSurvey1ForTheFirstTime } from './dialogs/dialogController';

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

  // Survey disabled for now
  // await maybeStartSurvey1ForTheFirstTime();

  // await initPlugins();
}
