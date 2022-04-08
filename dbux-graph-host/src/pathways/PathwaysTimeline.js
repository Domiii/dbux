import last from 'lodash/last';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import StepType from '@dbux/data/src/pathways/StepType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { makeStepBackground } from './renderSettings';

const MIN_STALE_TIME = 60 * 1000;
const makeTagByType = {
  [StepType.None]: () => 's',
  [StepType.Trace]: (step, pdp) => {
    if (step === pdp.indexes.steps.byType.getFirst(step.type)) {
      return 'sn';
    }
    else {
      return 'sr';
    }
  },
  [StepType.CallGraph]: () => 'cg',
  [StepType.Search]: () => 'se',
  [StepType.Other]: () => 'o'
};

class PathwaysTimeline extends HostComponentEndpoint {
  get pdp() {
    return this.context.doc.pdp;
  }

  update() {
    const { themeMode } = this.context;

    if (!this.context.doc.isAnalyzing()) {
      return;
    }

    if (!this.pdp) {
      this.state.steps = EmptyArray;
      this.state.staleIntervals = EmptyArray;
    }

    // make stale data
    const actionGroups = this.pdp.collections.actionGroups.getAllActual();
    const newGroups = this.filterNewGroups(actionGroups);
    let activeTimestamp = newGroups[0]?.createdAt;
    const staleIntervals = [];
    for (const group of newGroups) {
      if (group.createdAt > activeTimestamp) {
        staleIntervals.push({ start: activeTimestamp, end: group.createdAt });
      }
      activeTimestamp = group.createdAt + MIN_STALE_TIME;
    }
    const lastActive = activeTimestamp + MIN_STALE_TIME;
    const endTime = last(actionGroups) ? this.pdp.util.getActionGroupEndTime(last(actionGroups)) : Date.now();
    if (lastActive < endTime) {
      staleIntervals.push({ start: lastActive, end: endTime });
    }

    // make steps
    const steps = this.pdp.collections.steps.getAllActual().map(step => {
      return {
        createdAt: step.createdAt,
        timeSpent: this.pdp.util.getStepTimeSpent(step._id),
        background: makeStepBackground(step, themeMode),
        tag: makeTagByType[step.type](step, this.pdp),
      };
    });

    this.state.steps = steps;
    this.state.staleIntervals = staleIntervals;
  }

  filterNewGroups = (groups) => {
    const addedStaticTraceIds = new Set();
    const addedStaticContextIds = new Set();
    const newGroups = groups.filter((group) => {
      const action = this.pdp.util.getActionGroupAction(group._id);
      const trace = action?.trace;
      if (trace && !addedStaticTraceIds.has(trace.staticTraceId)) {
        addedStaticTraceIds.add(trace.staticTraceId);
        return true;
      }
      const staticContextId = this.pdp.util.getActionStaticContextId(action)?.staticContextId;
      if (staticContextId && !addedStaticContextIds.has(staticContextId)) {
        addedStaticContextIds.add(staticContextId);
        return true;
      }
      return false;
    });
    return newGroups;
  }
}

export default PathwaysTimeline;