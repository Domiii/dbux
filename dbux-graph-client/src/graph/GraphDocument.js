import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="SearchBar"></div>
      <div data-mount="GraphContainer" class="grid graph-containers"></div>
    </div>`;
    return el;
  }

  setupEl() {
    decorateClasses(this.el, {
      'screenshot-mode': !!this.context.screenshotMode
    });
  }

  update() {
    const { themeMode } = this.state;
    if (ThemeMode.is.Dark(themeMode)) {
      document.body.classList.add('theme-mode-dark');
    }
    else {
      document.body.classList.remove('theme-mode-dark');
    }
  }

  get popperManager() {
    return this.controllers.getComponent('PopperManager');
  }
}

export default GraphDocument;