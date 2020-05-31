import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="run-node new width-fit">
        <div>
          <div data-el="nodeChildren" data-mount="ContextNode" class="node-children flex-column"></div>
        </div>
      </div>
    `);

    return el;
  }

  setupEl() {
    // this.el.addEventListener('animationend', () => {
    setTimeout(() => {
      // "new" animation has finished -> remove class
      this.el?.classList.remove('new');
    }, 10 * 1000);
  }
  
  update() {
    const { visible, createdAt } = this.state;
    this.el.style.order = createdAt || 0;
    if (visible) {
      this.el.classList.remove('hidden');
    }
    else {
      this.el.classList.add('hidden');
    }
    // this.els.title.textContent = `Run #${runId} (Application #${applicationId})`;
  }
}

export default RunNode;