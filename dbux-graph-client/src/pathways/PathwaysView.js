import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div data-mount="Toolbar"></div>
      <div data-mount="PathwaysView"></div>
    </div>`);
  }

  update() {
  }
}

export default PathwaysView;