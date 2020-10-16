import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <span data-el="label"></span>
      <div class="flex-row"
        style="border: 1px solid lightblue; border-radius: 8px; padding: 0.4rem;"
        data-mount="PathwaysActionGroup">
      </div>
    </div>`);
  }

  update() {
    const {
      id,
      staticContextId
    } = this.state;
    
    const { themeMode } = this.context;

    this.els.label.textContent = `step #${id} (${staticContextId})`;
    this.el.style.background = getStaticContextColor(themeMode, staticContextId);
  }
}

export default PathwaysStep;