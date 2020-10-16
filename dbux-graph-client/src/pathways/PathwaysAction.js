import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div class="flex-row">
      <pre class="no-margin no-padding" data-el="rawInfo"></pre>&nbsp;
    </div>`);
  }

  update() {
    const entry = this.state;
    const {
      // id,
      // type,
      typeName,
      trace
    } = entry;
    this.els.rawInfo.textContent = `${typeName}${trace && `, trace=${trace?.id}` || ''}`;
    this.els.rawInfo.title = `raw=${JSON.stringify(entry)}`;
  }
}

export default PathwaysAction;