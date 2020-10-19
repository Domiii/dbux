import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <span data-el="title">
        <span data-el="label"></span><span style="color: #BBB" class="loc-label" data-el="locLabel"></span>
      </span>
      <div class="flex-row"
        style="border: 1px solid lightblue; border-radius: 8px; padding: 0.4rem;"
        data-mount="PathwaysActionGroup">
      </div>
    </div>`);
  }

  update() {
    const {
      // id,
      staticContextId,
      label,
      locLabel
    } = this.state;
    
    const { themeMode } = this.context;

    this.els.label.textContent = `${label}`;
    // `id=${id}, staticContextId=${staticContextId}`
    this.els.locLabel.textContent = locLabel;

    if (this.state.staticContextId) {
      this.els.title.classList.add('dbux-link');
    }
    this.el.style.background = staticContextId && getStaticContextColor(themeMode, staticContextId) || 'default';
  }

  on = {
    title: {
      click(evt) {
        if (this.state.staticContextId) {
          this.remote.selectFirstTrace();
          document.getSelection().removeAllRanges();
        }
      }
    }
  };
}

export default PathwaysStep;