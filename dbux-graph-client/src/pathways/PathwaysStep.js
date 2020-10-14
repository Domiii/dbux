import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      step
      <div data-mount="PathwaysAction">
      </div>
    </div>`);
  }

  update() {

  }
}

export default PathwaysStep;