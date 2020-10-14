import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <span data-el="label"></span>
      <div data-mount="PathwaysAction">
      </div>
    </div>`);
  }

  update() {
    const {
      id,
      staticCodeChunkId
    } = this.state;
    this.els.label.textContent = `step #${id} (${staticCodeChunkId})`;
  }
}

export default PathwaysStep;