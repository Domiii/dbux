import DDGSummaryMode, { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { addElementEventListeners, compileHtmlElement, decorateClasses } from '../util/domUtil';

/** @typedef { import("./DDGTimelineView").default } DDGTimelineView */
/** @typedef { import("./DDGDocument").default } DDGDocument */

const defaultIconSize = '12px';

/** ###########################################################################
 * Summary Mode
 * ##########################################################################*/

/**
 * @param {DDGDocument} doc
 * @param {*} timelineId 
 * @param {*} modes 
 * 
 * @return {{ el: DocumentFragment, els: Array.<Element>}}
 */
export function makeSummaryButtons(doc, timelineId, btnClass, modes, needsToDecorate = false) {
  const { summaryIconUris } = doc.state;
  const frag = document.createDocumentFragment();
  const els = modes.map(mode => {
    const label = summaryIconUris[mode] ?
      /*html*/`<img width="${defaultIconSize}" src="${summaryIconUris[mode]}" />` :
      '⛒'; // hackfix
    const modeName = DDGSummaryMode.nameFrom(mode);
    const btnEl = compileHtmlElement(
    /*html*/`<button title="${modeName}" class="${btnClass}">
        ${label}
    </button>`);
    addSummaryModeListener(btnEl, doc, timelineId, mode);
    if (needsToDecorate) {
      // hackfix
      btnEl._updateDeco = () => {
        decorateSummaryButton(btnEl, mode, doc.state.summaryModes[timelineId]);
      };
    }
    frag.appendChild(btnEl);
    return btnEl;
  });

  return {
    el: frag,
    els
  };
}

export function decorateSummaryButton(btnEl, ownMode, actualMode) {
  decorateClasses(btnEl, {
    active: ownMode === actualMode
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
