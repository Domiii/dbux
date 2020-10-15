import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <div data-mount="PathwayAction"></div>
    </div>`);
  }

  update() {
  }
}

export default PathwaysAction;