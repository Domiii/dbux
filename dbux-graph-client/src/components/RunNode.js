import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="red">
        <div style="display:flex; flex-direction:row;">
          <h6 data-el="title"></h6>
          <button data-el="nodeToggleBtn" class="open_close_btn">▽</button>
        </div>
        <div data-mount="ContextNode" data-el="childrenContext"></div>
      </div>
    `);

    return el;
  }
  
  update() {
    const { applicationId, runId } = this.state;
    this.els.title.textContent = `Run #${runId} (Application #${applicationId})`;
  }
  on = {
    nodeToggleBtn: {
      click() {
        if (this.els.childrenContext.style.display === 'none') {
          this.els.childrenContext.style.display = 'initial';
          this.els.nodeToggleBtn.innerHTML = '▽';//﹀ ▽
        } else {
          this.els.childrenContext.style.display = 'none';
          this.els.nodeToggleBtn.innerHTML = '▷';//〉 ▷
        }         
      }
    }
  }
}

export default RunNode;