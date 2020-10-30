import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div id="pathways-timeline" class="flex-row"></div>`);
  }

  update() {
    const { steps } = this.state;

    this.el.innerHTML = steps.map(this.toDOMString).join('');
  }

  toDOMString({ step, tag, background }) {
    return `<div style="background: ${background}">${tag}</div>`;
  }
}

export default PathwaysAction;