import { formatTime } from '@dbux/common-node/src/util/timeUtil';
import ActionGroupType from '@dbux/data/src/pathways/ActionGroupType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { getIconByActionGroup, makeStepBackground } from './renderSettings';

/** @typedef {import('@dbux/projects/src/dataLib/PathwaysDataProvider').default} PathwaysDataProvider */

class PathwaysActionGroup extends HostComponentEndpoint {
  /**
   * @type {PathwaysDataProvider}
   */
  get pdp() {
    return this.context.doc.pdp;
  }

  init() {
    const {
      _id: groupId,
      stepId,
      type
    } = this.state;

    const { themeMode } = this.context;
    const action = this.pdp.util.getActionGroupAction(groupId);

    this.state.typeName = ActionGroupType.getName(type);
    this.state.iconUri = this.context.doc.getIconUri(getIconByActionGroup(type));
    this.state.timeSpent = formatTime(this.pdp.util.getActionGroupTimeSpent(groupId));
    this.state.hasTrace = !!this.pdp.util.getActionTrace(action);

    const step = this.pdp.collections.steps.getById(stepId);
    this.state.background = makeStepBackground(step, themeMode);
    this.state.needsDivider = this.context.doc.isAnalyzing() &&
      this.pdp.util.isLastVisibleGroup(groupId) &&
      !this.pdp.util.isLastStepOfStepGroup(stepId);
  }
}

export default PathwaysActionGroup;