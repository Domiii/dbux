import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <pre data-el="rawInfo"></pre>
    </div>`);
  }

  update() {
    const { entry } = this.state;
    this.els.rawInfo.textContent = JSON.stringify(entry);
  }
}

export default PathwaysAction;