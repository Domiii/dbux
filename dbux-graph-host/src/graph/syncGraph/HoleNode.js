import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GroupNode from './GroupNode';

/** @typedef { import("../SyncGraphBase").ContextNodeHole } ContextNodeHole */
/** @typedef { import("../SyncGraphBase").ContextNodeHoleClient } ContextNodeHoleClient */

/**
 * 
 */
export default class HoleNode extends GroupNode {
  init() {
    // TODO: make this a proper "Hole"/"Group" representation → not just a single context!
    super.init();
  }

  setNodeState() {
    const {
      context
    } = this.state;
    const {
      screenshotMode,
      themeMode
    } = this.context;
    const { applicationId, contextId } = context;
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;

    this.state.contextLabel = `(hidden ${this.state.hole.contextCount})`;

    // const hue = 0; // does not matter much
    // let saturation = 5;
    // let lightness = ThemeMode.is.Dark(themeMode) ? 30 : 65;
    // this.state.backgroundStyle = `hsl(${hue},${saturation}%,${lightness}%)`;
    const x = ThemeMode.is.Dark(themeMode) ? '44' : 'BB';
    this.state.backgroundStyle = `#${x}${x}${x}`;
  }

  /**
   * @type {ContextNodeHole}
   */
  get hole() {
    return this.hostOnlyState.hole;
  }

  /**
   * @virtual
   * @return {ExecutionContext[]}
   */
  getAllChildContexts() {
    const { frontier } = this.hole;
    return frontier;
  }
}
