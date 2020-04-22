import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class TraceNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="trace">
        <div data-el="name" class="name">

          <span data-el="displayName"></span>
          <button data-el="oCBtn" class="open_close_btn">▽</button>
        </div>
        <div data-mount="ContextNode" class="children">
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
    this.els.oCBtn.style.display = hasChildren ? 'initial' : 'none';
  }
  on = {

    oCBtn: {
      click() {
        if (this.els.children.style.display === 'none') {
          this.els.children.style.display = 'initial';
          this.els.oCBtn.innerHTML = '▽';//﹀ ▽
        } else {
          this.els.children.style.display = 'none';
          this.els.oCBtn.innerHTML = '▷';//〉 ▷  ►
        }
      }
    }
  }
}