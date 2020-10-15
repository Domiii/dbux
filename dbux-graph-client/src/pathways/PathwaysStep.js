import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <span data-el="label"></span>
      <div style="border: 1px solid lightblue; border-radius: 8px; padding: 0.4rem;"
        data-mount="PathwaysAction">
      </div>
    </div>`);
  }

  update() {
    const {
      id,
      codeChunkId
    } = this.state;
    this.els.label.textContent = `step #${id} (${codeChunkId})`;
  }
}

export default PathwaysStep;