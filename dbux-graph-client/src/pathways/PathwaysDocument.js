import PathwaysMode from '@dbux/data/src/pathways/PathwaysMode';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysDocument extends ClientComponentEndpoint {
  isAnalyzing = () => {
    return PathwaysMode.is.Analyze(this.state.pathwaysMode);
  }

  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div class="flex-column">
      <div data-mount="Toolbar"></div>
      <div data-mount="PathwaysView"></div>
    </div>`;
    return el;
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
}

export default PathwaysDocument;