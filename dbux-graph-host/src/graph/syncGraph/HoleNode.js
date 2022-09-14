// import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GroupNode from './GroupNode';

/** @typedef { import("../SyncGraphBase").ContextNodeHole } ContextNodeHole */
/** @typedef { import("../SyncGraphBase").ContextNodeHoleClient } ContextNodeHoleClient */

/**
 * 
 */
export default class HoleNode extends GroupNode {
  aliases = ['HoleNode', 'GroupNode', 'ContextNode'];

  init() {
    super.init();
  }

  update() {
    super.update();
    this.state.contextLabel = `(hidden: ${this.state.group.contextCount})`;
  }

  setNodeState() {
    // const {
    //   context
    // } = this.state;
    const {
      // screenshotMode,
      themeMode
    } = this.context;
    // const { applicationId, contextId } = context;
    // const app = allApplications.getById(applicationId);
    // const dp = app.dataProvider;

    // const hue = 0; // does not matter much
    // let saturation = 5;
    // let lightness = ThemeMode.is.Dark(themeMode) ? 30 : 65;
    // this.state.backgroundStyle = `hsl(${hue},${saturation}%,${lightness}%)`;
    const gray = ThemeMode.is.Dark(themeMode) ? '75' : 'CC';
    this.state.backgroundStyle = `#${gray}${gray}${gray}`;
  }

  /**
   * @virtual
   * @return {ExecutionContext[]}
   */
  getAllChildContexts() {
    const { frontier } = this.group;
    return frontier;
  }
}
