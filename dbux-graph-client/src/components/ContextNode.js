import { compileHtmlElement, decorateClasses } from '@/util/domUtil';
import { isMouseEventPlatformModifierKey } from '@/util/keyUtil';
import { getPlatformModifierKeyString } from '@/util/platformUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let choiceElm;
class ContextNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
    <div class="context-node flex-row">
      <div class = "indicator-cont">
        <div data-el="indicator" class='indicator'></div>
      </div>
        <div class="full-width flex-column">
          <div class="content">
            <div class="flex-row">
              <div class="flex-row">
                <button data-el="nodeToggleBtn" class="node-toggle-btn"></button>
                <div data-el="title" class="flex-row">
                  <div data-el="parentLabel" class="ellipsis-20 dbux-link"></div>
                  <div data-el="contextLabel" class="ellipsis-20 dbux-link"></div>
                </div>
                <!--div data-el="selectedTraceIcon" class="darkred">
                  &nbsp;☩
                </div-->
                &nbsp;
                <button class="highlight-btn emoji" data-el="staticContextHighlightBtn"><span>💡</span></button>
                <button data-el="prevContextBtn" class="hidden">⇦</button>
                <button data-el="nextContextBtn" class="hidden">⇨</button>
                <div class="loc-label">
                  <span data-el="locLabel" class="dbux-link"></span>
                  <span data-el="parentLocLabel" class="dbux-link"></span>
                </div>
                <div>
                  <span class="value-label" data-el="valueLabel"></span>
                </div>
              </div>
              <div class="flex-row">
              </div>
            </div>
          </div>
          <div class="full-width flex-row">
            <div class="node-left-padding">
            </div>
            <div data-mount="ContextNode" data-el="nodeChildren" class="node-children"></div>
          </div>
        </div>
      </div>
      `);
  }

  update() {
    const {
      applicationId,
      context: { contextId, staticContextId },
      contextNameLabel,
      contextLocLabel,
      parentTraceNameLabel,
      parentTraceLocLabel,
      valueLabel,
      isSelected,
      traceId
    } = this.state;

    this.el.id = `application_${applicationId}-context_${contextId}`;
    this.el.style.background = `hsl(${this.getBinaryHsl(staticContextId)},50%,95%)`;
    // this.els.title.id = `name_${contextId}`;
    // this.els.nodeChildren.id = `children_${contextId}`;
    this.els.contextLabel.textContent = contextNameLabel;
    this.els.locLabel.textContent = contextLocLabel;
    this.els.parentLabel.textContent = parentTraceNameLabel || '';
    this.els.parentLocLabel.textContent = parentTraceLocLabel || '';
    this.els.valueLabel.textContent = valueLabel;
    decorateClasses(this.els.title, {
      'selected-trace': isSelected
    });

    // set indicator
    this.setIndicator(traceId, this.children.getComponents('ContextNode'), 'callTrace');
    // set popper
    const modKey = getPlatformModifierKeyString();
    this.els.contextLabel.setAttribute('data-tooltip', `${this.els.contextLabel.textContent} (${modKey} + click to select trace)`);
    this.els.parentLabel.setAttribute('data-tooltip', `${this.els.parentLabel.textContent} (${modKey} + click to select trace)`);
    this.els.prevContextBtn.setAttribute('data-tooltip', 'Go to previous function execution');
    this.els.nextContextBtn.setAttribute('data-tooltip', 'Go to next function execution');
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

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  isHiddenBy() {
    return this.hiddenNodeManager.getHiddenNodeHidingThis(this.context.runNode);
  }

  // ########################################
  // handle label on click
  // ########################################

  handleClickOnContext(evt) {
    if (evt.altKey) {
      // panning
      return;
    }
    if (isMouseEventPlatformModifierKey(evt)) {
      // if (evt.shiftKey) {
      // ctrl(meta) + click: select trace
      this.remote.selectFirstTrace();
      document.getSelection().removeAllRanges();
    }
    else {
      // click: show trace
      this.remote.goToFirstTrace();
    }
  }

  handleClickOnParentTrace(evt) {
    if (evt.altKey) {
      // panning
      return;
    }
    if (isMouseEventPlatformModifierKey(evt)) {
      // if (evt.shiftKey) {
      // ctrl(meta) + click: select trace
      this.remote.selectParentTrace();
      document.getSelection().removeAllRanges();
    }
    else {
      // click: show trace
      this.remote.goToParentTrace();
    }
    // }
  }

  setIndicator(traceId, children, traceType) {
    choiceElm?.classList.remove('set-top', 'set-bottom', 'set-calltrace');

    if (children && traceId) {
      // check traceId > or < context children's traceId -del
      let childrenParentId = children.map((x) => x.state.parentTraceId);
      let toggle = childrenParentId.findIndex(x => x > traceId);
      if (toggle !== -1 && traceType === 'callTrace') {
        choiceElm = children[toggle].el.querySelector('.indicator-cont');
        //set middle and display something -del
        choiceElm?.classList?.add('set-calltrace');
      } else if (toggle !== -1) {
        choiceElm = children[toggle].el.querySelector('.indicator-cont');
        choiceElm?.classList?.add('set-top');
      } else {
        choiceElm = children[children.length - 1].el.querySelector('.indicator-cont');
        choiceElm?.classList?.add('set-bottom');
      }
    }
  }

  on = {
    contextLabel: {
      click(evt) {
        this.handleClickOnContext(evt);
      }
    },
    locLabel: {
      click(evt) {
        this.handleClickOnContext(evt);
      }
    },
    parentLabel: {
      click(evt) {
        this.handleClickOnParentTrace(evt);
      }
    },
    parentLocLabel: {
      click(evt) {
        this.handleClickOnParentTrace(evt);
      }
    },
    staticContextHighlightBtn: {
      click(evt) {
        this.remote.toggleStaticContextHighlight();
      }
    },
    prevContextBtn: {
      click(evt) {
        this.remote.selectPreviousContextByStaticContext();
      }
    },
    nextContextBtn: {
      click(evt) {
        this.remote.selectNextContextByStaticContext();
      }
    }
  }
}
export default ContextNode;