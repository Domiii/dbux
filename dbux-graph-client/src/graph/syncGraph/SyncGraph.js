import { compileHtmlElement } from '../../util/domUtil';
import SyncGraphBase from '../SyncGraphBase';

export default class SyncGraph extends SyncGraphBase {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div>
        <h4>Applications:</h4>
        <pre data-el="applications"></pre>
        <div>
          <button data-el="previousModeButton" class="root-graph-mode-button">
            <img data-el="previousModeButtonImg">
          </button>
          <button data-el="nextModeButton" class="root-graph-mode-button">
            <img data-el="nextModeButtonImg">
          </button>
        </div>
        <div data-mount="HiddenBeforeNode"></div>
        <div data-el="nodeChildren" data-mount="ContextNode" class="node-children flex-column"></div>
        <div data-mount="HiddenAfterNode"></div>
      </div>
    `);
  }

  update() {
    const { applications } = this.state;
    if (applications?.length) {
      this.els.applications.textContent = ` ${applications.map(app => app.name).join('\n ')}`;
    }
    else {
      this.els.applications.textContent = '(no applications selected)';
    }
  }
}