import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class TraceNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="trace">
        <div data-el="name" class="name">
          <div style="display:flex; height:auto; align-item:flex-end;">
            <span data-el="displayName"></span>
            <button data-el="nodeToggleBtn" class="open_close_btn">▽</button>
          </div>
        </div>
        <div data-mount="ContextNode" class="node-children">
          <div class="childHead">&nbsp;</div>
        </div>
      </div>
    `);
  }

  update() {
    const {
      displayName,
      trace: {
        traceId
      },
      hasChildren
    } = this.state;

    this.el.id = `trace_${traceId}`;
    this.els.displayName.textContent = `${displayName}`;
    this.els.nodeToggleBtn.style.display = hasChildren ? 'initial' : 'none';
  }
  on = {

    nodeToggleBtn: {
      click() {
        if (this.els.children.style.display === 'none') {
          this.els.children.style.display = 'initial';
          this.els.nodeToggleBtn.innerHTML = '▽';//﹀ ▽
        } else {
          this.els.children.style.display = 'none';
          this.els.nodeToggleBtn.innerHTML = '▷';//〉 ▷  ►
        }
      }
    },
    displayName: {
      click(evt) {
        if (evt.shiftKey) {
          const { traceId, applicationId } = this.state.trace;
          this.remote.showTrace(applicationId, traceId);
        }
      }
    }
  }
}