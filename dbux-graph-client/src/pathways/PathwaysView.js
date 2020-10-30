import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <!-- only display on group (Analyze) mode -->
      <div data-mount="PathwaysTimeline"></div>

      <!-- used in group (Analyze) mode -->
      <div data-mount="PathwaysStepGroup" class="flex-column"></div>

      <!-- used by default -->
      <div data-mount="PathwaysStep" class="flex-column"></div>
    </div>`);
  }
}

export default PathwaysView;