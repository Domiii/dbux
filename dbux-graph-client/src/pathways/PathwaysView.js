import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <!-- used in group (Analyze) mode -->
      <div data-mount="PathwaysStepGroup" class="flex-column">

      <!-- used by default -->
      <div data-mount="PathwaysStep" class="flex-column">
      </div>
    </div>`);
  }

  update() {
    
  }
}

export default PathwaysView;