import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div style="border: 1px solid lightblue; border-radius: 8px;">
      <pre class="no-margin" style="padding: 0.4rem;" data-el="rawInfo"></pre>
    </div>`);
  }

  update() {
    const { entry } = this.state;
    const {
      id,
      type,
      typeName,
      trace
    } = entry;
    this.els.rawInfo.textContent = `${id}. ${typeName}${trace && `, trace=${trace?.id}` || ''}`;
  }
}

export default PathwaysAction;