import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      group
      <div class="flex-row" data-mount="PathwaysAction"></div>
    </div>`);
  }

  update() {
  }
}

export default PathwaysAction;