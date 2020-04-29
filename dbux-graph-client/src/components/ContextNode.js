import popperManeger from '../popperManeger';
import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  get popperEl() {
    return window._popperEl;
  }

  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="context">
        <div>
          <button data-el="oCBtn" class="open_close_btn" style="display:none">▽</button>
        </div>
        <div class="body">
          <div data-el="title" class="title">
            <div style="display:flex; height:auto; align-item:flex-end;">
              <span data-el="displayName" class="displayname" aria-dsecribedby="tooltip"></span>
              <div data-el="toolTip" class="tooltip_cls" role="tooltip">
              <div id="arrow" data-popper-arrow></div>
              </div>
            </div>
            <div data-mount="TraceNode"></div>
          </div>
          <div data-mount="ContextNode" data-el="children" class="children">
          </div>
        </div>
      </div>
      `);
  }

  update() {
    const {
      displayName,
      context: { contextId, staticContextId },
      hasChildren,
    } = this.state;


    this.el.id = `context_${contextId}`;
    this.el.style.background = `hsl(${this.getBinaryHsl(staticContextId)},50%,75%)`;
    this.els.title.id = `name_${contextId}`;
    //this.els.title.textContent = `${displayName}#${contextId}`;
    this.els.displayName.textContent = `${displayName}`;
    this.els.oCBtn.style.display = hasChildren ? 'initial' : 'none';
    this.els.children.id = `children_${contextId}`;
  }

  getBinaryHsl(i) {
    let color = 0;
    let base = 180;
    while (i !== 0) {
      color += (i % 2) * base;
      i = Math.floor(i / 2);
      base /= 2;
    }
    return color;
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
    },
    displayName: {
      mouseenter() {
        this.popperEl.firstChild.textContent = `${this.state.displayName}`;
        popperManeger.show(this.els.displayName, this.popperEl);
      },
      focus() {
        this.popperEl.firstChlild.textContent = `${this.state.displayName}`;
        popperManeger.show(this.els.displayName, this.popperEl);
      },
      mouseleave() {
        popperManeger.hide(this.popperEl);
      },
      blur() {
        popperManeger.hide(this.popperEl);
      },
      click(evt) {
        if (evt.shiftKey) {
          const { context, applicationId } = this.state;
          this.remote.showContext(applicationId, context.contextId);
        }
      }
    }
  }
}
export default ContextNode;