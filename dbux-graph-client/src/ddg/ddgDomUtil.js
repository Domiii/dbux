import ddgQueries from '@dbux/data/src/ddg/ddgQueries';
import DDGSummaryMode, { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { addElementEventListeners, compileHtmlElement, decorateClasses } from '../util/domUtil';

/** @typedef { import("./DDGTimelineView").default } DDGTimelineView */
/** @typedef { import("./DDGDocument").default } DDGDocument */

const defaultIconSize = '12px';

const summaryIconHtml = {
  [DDGSummaryMode.Hide]: '⛒',
  [DDGSummaryMode.HideChildren]: '⛒',
  // [DDGSummaryMode.CollapseSummary]: '💢'
};

/** ###########################################################################
 * Summary Mode
 * ##########################################################################*/

export function makeSummaryLabel(docState, mode) {
  const { summaryIconUris } = docState;
  if (!summaryIconUris[mode]) {
    return summaryIconHtml[mode]; // hackfix
  }
  return /*html*/`<img width="${defaultIconSize}" src="${summaryIconUris[mode]}" />`;
}

export function makeSummaryLabelSvgCompiled(docState, mode, x, y) {
  const { summaryIconUris } = docState;
  if (!summaryIconUris[mode]) {
    return compileHtmlElement(`<text>summaryIconHtml[mode]</text>`);
  }

  /**
   * @see https://stackoverflow.com/a/10859332
   */
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttributeNS(null, 'height', defaultIconSize);
  img.setAttributeNS(null, 'width', defaultIconSize);
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', summaryIconUris[mode]);
  img.setAttributeNS(null, 'x', x);
  img.setAttributeNS(null, 'y', y);
  img.setAttributeNS(null, 'visibility', 'visible');
  return img;
}

/**
 * @param {DDGDocument} doc
 * @param {*} timelineId 
 * @param {*} modes 
 * 
 * @return {{ el: DocumentFragment, els: Array.<Element>}}
 */
export function makeSummaryButtons(doc, timelineId, btnClass, modes, needsToDecorate = false) {
  btnClass = btnClass + ' summary-button';
  const frag = document.createDocumentFragment();
  const els = modes.map(mode => {
    const label = makeSummaryLabel(doc.state, mode);
    const modeName = DDGSummaryMode.nameFrom(mode);
    const btnEl = compileHtmlElement(
    /*html*/`<button title="${modeName}" class="${btnClass}">
        ${label}
    </button>`);
    addSummaryModeListener(btnEl, doc, timelineId, mode);
    if (needsToDecorate) {
      // hackfix
      btnEl._updateDeco = () => {
        if (doc.state.summaryModes) {
          decorateSummaryButton(btnEl, mode, doc.state, timelineId);
        }
      };
      btnEl._updateDeco();
    }
    frag.appendChild(btnEl);
    return btnEl;
  });

  return {
    el: frag,
    els
  };
}

/**
 * Apply decorations to `btnEl` that represents given `btnMode` for node of given `timelineId`
 */
export function decorateSummaryButton(btnEl, btnMode, ddg, timelineId) {
  const node = ddg.timelineNodes[timelineId];
  const actualMode = ddg.summaryModes[timelineId];
  const disabled = !ddgQueries.canApplySummaryMode(node, btnMode);
  btnEl.disabled = disabled;
  decorateClasses(btnEl, {
    disabled,
    active: btnMode === actualMode
  });
}

export function decorateSummaryModeButtons(btns) {
  btns.forEach(btn => btn._updateDeco());
}

/** ########################################
 * {@link addSummaryModeListener}
 * #######################################*/

/**
 * @param {DDGDocument} doc
 */
function addSummaryModeListener(btnEl, doc, timelineId, mode) {
  const eventCfg = {
    async click(evt) {
      evt.stopPropagation();

      /**
       * @type {DDGTimelineView}
       */
      // eslint-disable-next-line prefer-destructuring
      const timeline = doc.timeline;
      timeline.setSummaryMode(timelineId, mode);
    },

    focus(evt) { evt.target.blur(); }
  };

  addElementEventListeners(btnEl, eventCfg);
}
