import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

export default class HiddenBeforeNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="run-node hidden-run-node width-fit graph-node">
        <div>
          <div data-el="label" class="node-children flex-column"></div>
        </div>
      </div>
    `);

    return el;
  }

  setupEl() {
    this.el.classList.add('hidden');
    this.el.classList.add('cursor-pointer');
    this.el.setAttribute('data-tooltip', 'Click to unhide');
  }

  update() {
    if (this.state.count) {
      this.el.classList.remove('hidden');
      this.els.label.textContent = `Hiding ${this.state.count} nodes`;
    }
    else {
      this.el.classList.add('hidden');
    }
  }
  
  on = {
    label: {
      click() {
        this.remote.hideBefore(false);
      }
    }
  }
}