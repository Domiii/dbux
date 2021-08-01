import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import { compileHtmlElement, decorateClasses } from '../util/domUtil';
// import { isMouseEventPlatformModifierKey } from '../util/keyUtil';
import { getPlatformModifierKeyString } from '../util/platformUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let choicingIndicator;
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
                <div class="mode-btn-wrapper flex-row">
                  <button data-el="previousModeButton" class="btn graph-mode-button">
                    <img data-el="previousModeButtonImg">
                  </button>
                  <button data-el="nextModeButton" class="btn graph-mode-button">
                    <img data-el="nextModeButtonImg">
                  </button>
                </div>
                <div data-el="parentLabel" class="ellipsis-20 dbux-link"></div>
                <div data-el="title" class="flex-row cross-axis-align-center">
                  <div data-el="contextLabel" class="ellipsis-20 dbux-link"></div>
                </div>
                <!--div data-el="selectedTraceIcon" class="darkred">
                  &nbsp;☩
                </div-->
                &nbsp;&nbsp;
                <!--button class="highlight-btn emoji" data-el="staticContextHighlightBtn"><span>💡</span></button-->
                <button data-el="prevContextBtn" class="hidden">⇦</button>
                <button data-el="nextContextBtn" class="hidden">⇨</button>
                <div class="loc-label">
                  <span data-el="locLabel"></span>
                  <!--span data-el="parentLocLabel" class="dbux-link"></span-->
                </div>
                <div>
                  <span class="value-label" data-el="valueLabel"></span>
                </div>
                <div data-el="stats" class="context-stats"></div>
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
      // parentTraceLocLabel,
      valueLabel,
      isSelected,
      traceId,
      isSelectedTraceCallRelated,
      contextIdOfSelectedCallTrace,
      statsEnabled,
      moduleName
    } = this.state;

    const {
      themeMode,
    } = this.context;

    const moduleLabel = moduleName ? `${moduleName} | ` : '';

    this.el.id = `application_${applicationId}-context_${contextId}`;
    this.el.style.background = getStaticContextColor(themeMode, staticContextId, !!moduleName);
    this.els.contextLabel.textContent = contextNameLabel;
    this.els.locLabel.textContent = contextLocLabel && ` @ ${moduleLabel}${contextLocLabel}` || '';
    this.els.parentLabel.textContent = parentTraceNameLabel || '';
    // this.els.parentLocLabel.textContent = parentTraceLocLabel || '';
    this.els.valueLabel.textContent = valueLabel;

    if (statsEnabled) {
      const {
        nTreeContexts,
        nTreeStaticContexts,
        nTreeFileCalled
      } = this.state;
      this.els.stats.textContent = `${nTreeContexts} / ${nTreeStaticContexts} / ${nTreeFileCalled}`;
    }
    else {
      this.els.stats.textContent = '';
    }

    // if (ThemeMode.is.Dark(themeMode)) {
    //   decorateClasses(this.els.title, {
    //     'selected-trace': isSelected
    //   });
    // }
    // else {
    decorateClasses(this.els.title, {
      'selected-trace': isSelected
    });

    // set indicator
    this.setIndicator(traceId, this.children.getComponents('ContextNode'), isSelectedTraceCallRelated, contextIdOfSelectedCallTrace, isSelected);

    // set popper
    const modKey = getPlatformModifierKeyString();
    this.els.contextLabel.setAttribute('data-tooltip', `${this.els.contextLabel.textContent} (${modKey} + click to select trace)`);
    this.els.parentLabel.setAttribute('data-tooltip', `${this.els.parentLabel.textContent} (${modKey} + click to select trace)`);
    this.els.prevContextBtn.setAttribute('data-tooltip', 'Go to previous function execution');
    this.els.nextContextBtn.setAttribute('data-tooltip', 'Go to next function execution');
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
    // if (isMouseEventPlatformModifierKey(evt)) 
    // ctrl(meta) + click: select trace
    this.remote.selectFirstTrace();
    document.getSelection().removeAllRanges();
    // else {
    //   // click: show trace
    //   this.remote.goToFirstTrace();
    // }
  }

  handleClickOnParentTrace(evt) {
    if (evt.altKey) {
      // panning
      return;
    }
    // if (isMouseEventPlatformModifierKey(evt)) {
    // if (evt.shiftKey) {
    // ctrl(meta) + click: select trace
    this.remote.selectParentTrace();
    document.getSelection().removeAllRanges();
    // }
    // else {
    //   // click: show trace
    //   this.remote.goToParentTrace();
    // }
    // }
  }

  setIndicator(traceId, children, isSelectedTraceCallRelated, contextIdOfSelectedCallTrace, isSelected) {
    // check isSelected... if isSelected is false, this update is deselect old from focusControler -del
    if (!children || !traceId || !isSelected) {
      return;
    }

    //check indicator position -del
    let selectChild = children.map((x) => [x.state.context.parentTraceId, x.state.context.contextId]);
    let toggle = selectChild.findIndex(x => x[0] >= traceId);

    // check trace is selectedTraceCallRelated -del
    if (toggle !== -1 && isSelectedTraceCallRelated && contextIdOfSelectedCallTrace !== undefined) {
      toggle = selectChild.findIndex(x => x[1] === contextIdOfSelectedCallTrace);

      let newIndicator = children[toggle]?.el.querySelector('.indicator-cont');
      this.checkNewIndicator(newIndicator, 'set-calltrace');
    }
    else if (toggle !== -1) {
      let newIndicator = children[toggle]?.el.querySelector('.indicator-cont');
      this.checkNewIndicator(newIndicator, 'set-top');
    }
    else {
      let newIndicator = children[toggle]?.el.querySelector('.indicator-cont');
      this.checkNewIndicator(newIndicator, 'set-bottom');
    }
  }

  checkNewIndicator(newIndicator, newClass) {
    if (choicingIndicator !== newIndicator) {
      choicingIndicator?.classList.remove('set-top', 'set-bottom', 'set-calltrace');
      choicingIndicator = newIndicator;
      choicingIndicator?.classList?.add(newClass);
    }
  }

  on = {
    contextLabel: {
      click(evt) {
        this.handleClickOnContext(evt);
      }
    },
    // locLabel: {
    //   click(evt) {
    //     this.handleClickOnContext(evt);
    //   }
    // },
    parentLabel: {
      click(evt) {
        this.handleClickOnParentTrace(evt);
      }
    },
    // parentLocLabel: {
    //   click(evt) {
    //     this.handleClickOnParentTrace(evt);
    //   }
    // },
    // staticContextHighlightBtn: {
    //   click(/* evt */) {
    //     this.remote.toggleStaticContextHighlight();
    //   }
    // },
    prevContextBtn: {
      async click(/* evt */) {
        await this.remote.selectPreviousContextByStaticContext();
      }
    },
    nextContextBtn: {
      async click(/* evt */) {
        await this.remote.selectNextContextByStaticContext();
      }
    }
  }
}
export default ContextNode;