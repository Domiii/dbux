import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-row cross-axis-align-center">
        <div class="run-node width-fit">
          <div>
            <div data-el="nodeChildren" data-mount="ContextNode" class="node-children flex-column"></div>
          </div>
        </div>
        <div data-el="childrenAmount"></div>
      </div>
    `);

    return el;
  }

  setupEl() {
    const totalAnimTime = 10 * 1000;
    const remainingAnimTime = totalAnimTime + this.state.createdAt - Date.now();
    if (remainingAnimTime > 0) {
      this.el.classList.add('new');
      setTimeout(() => {
        // "new" animation has finished -> remove class
        if (!this.isDisposed) {
          this.el.classList.remove('new');
        }
      }, remainingAnimTime);
    }
  }

  update() {
    const { visible, createdAt, childrenAmount, uniqueChildrenAmount } = this.state;
    // deduct by a constant to avoid overflow
    this.el.style.order = createdAt - 1592380000000 || 0;
    if (visible) {
      this.el.classList.remove('hidden');
    }
    else {
      this.el.classList.add('hidden');
    }
    this.els.childrenAmount.textContent = `${childrenAmount} / ${uniqueChildrenAmount}`;
    // this.els.title.textContent = `Run #${runId} (Application #${applicationId})`;
  }
}

export default RunNode;