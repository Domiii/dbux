import { formatTime } from '@dbux/common-node/src/util/timeUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeStaticContextLocLabel } from '@dbux/data/src/helpers/makeLabels';
import StepType from '@dbux/data/src/pathways/StepType';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { getIconByStep, makeStepBackground } from './renderSettings';

class PathwaysStep extends HostComponentEndpoint {
  get pdp() {
    return this.context.doc.pdp;
  }

  /**
   * NOTE: Step is a portion of state.
   */
  get step() {
    return this.state;
  }

  get firstTrace() {
    const { applicationId, firstTraceId } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider.util.getTrace(firstTraceId);
  }

  init() {
    const {
      _id: stepId,
      applicationId,
      staticContextId,
      type: stepType
    } = this.state;

    const { themeMode } = this.context;

    let label;
    let locLabel;
    switch (stepType) {
      case StepType.Trace:
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          label = staticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        else {
          label = '(other)';
        }
        break;
      case StepType.CallGraph:
        label = '(Call Graph Investigation)';
        break;
      case StepType.Search:
        label = '(Search)';
        break;
      case StepType.Other:
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          label = staticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        else {
          label = '(other)';
        }
        break;
      case StepType.None:
      default:
        label = '(Start)';
        break;
    }
    this.state.label = label;
    this.state.locLabel = locLabel;

    /**
     * hackfix: currently we have not recorded the trace data, so we temporarily set it to `StepType.Other`
     */
    let icon;
    if (StepType.is.Trace(stepType) && !staticContextId) {
      icon = getIconByStep(StepType.Other);
    }
    else {
      icon = getIconByStep(stepType);
    }
    this.state.iconUri = this.context.doc.getIconUri(icon);

    this.state.timeSpent = formatTime(this.pdp.util.getStepTimeSpent(stepId));
    this.state.background = makeStepBackground(this.step, themeMode);
    this.state.hasTrace = StepType.is.Trace(stepType);
  }

  update() {
    // get timeSpent + staticContext info for step (label, loc)
  }

  public = {
    selectFirstTrace() {
      return traceSelection.selectTrace(this.firstTrace);
    },
  };
}

export default PathwaysStep;