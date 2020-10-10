import GraphThemeMode from '@dbux/graph-common/src/shared/GraphThemeMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="GraphRoot"></div>
    </div>`;
    return el;
  }
  update() {
    const { themeMode } = this.state; 
    if (GraphThemeMode.is.Dark(themeMode)) {
      document.body.classList.add('theme-mode-dark');
    }
    else {
      document.body.classList.remove('theme-mode-dark');
    }
  }
}

export default GraphDocument;