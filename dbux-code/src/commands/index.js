import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initDataFlowViewCommands } from './dataFlowViewCommands';
import { initDiagnosticCommands } from './diagnosticCommands';
import { initGlobalAnalysisViewCommands } from './globalAnalysisViewCommands';

export function initCommands(
  context,
  traceDetailsController,
  dataFlowViewController,
  globalAnalysisViewController,
) {
  initUserCommands(context);
  initApplicationsViewCommands(context);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initDataFlowViewCommands(context, dataFlowViewController);
  initDiagnosticCommands(context);
  initGlobalAnalysisViewCommands(context, globalAnalysisViewController);
}