import { createPopper } from '@popperjs/core';
import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  createEl() {
    this.popperInstance = null;
    return compileHtmlElement(/*html*/`
      <div class="context">
        <div>
          <button data-el="nodeToggleBtn" class="open_close_btn">▽</button>
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
          <div data-mount="ContextNode" data-el="nodeChildren" class="children">
          </div>
        </div>
      </div>
      `);
  }

  setupEl() {
  }

  update() {
    const {
      displayName,
      context: { contextId, staticContextId }
    } = this.state;


    this.el.id = `context_${contextId}`;
    this.el.style.background = `hsl(${this.getBinaryHsl(staticContextId)},50%,75%)`;
    this.els.title.id = `name_${contextId}`;
    //this.els.title.textContent = `${displayName}#${contextId}`;
    this.els.displayName.textContent = `${displayName}`;
    this.els.toolTip.textContent = `${displayName}`;
    this.els.nodeChildren.id = `children_${contextId}`;

    createPopper(this.els.displayName, this.els.toolTip, {
      placement: "bottom-start",
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
  }

  destroy = () => {
    let { popperInstance } = this;
    if (popperInstance) {
      popperInstance.destroy();
      popperInstance = null;
    }
  }

  show = () => {
    const { displayName, toolTip } = this.els;
    toolTip.setAttribute('data-show', '');
    this.popperInstance = createPopper(displayName, toolTip, {
      placement: "bottom-start",
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
  }

  hide = () => {
    this.els.toolTip.removeAttribute('data-show');
    this.destroy();
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
    displayName: {
      mouseenter() {
        this.show();
      },
      focus() {
        this.show();
      },
      mouseleave() {
        this.hide();
      },
      blur() {
        this.hide();
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