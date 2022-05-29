import DDGSummaryMode, { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { addElementEventListeners, compileHtmlElement, decorateClasses } from '../util/domUtil';

/** @typedef { import("./DDGTimelineView").default } DDGTimelineView */

const defaultIconSize = '12px';

/** ###########################################################################
 * Summary Mode
 * ##########################################################################*/

/**
 * @param {ClientComponentEndpoint} comp 
 * @param {*} timelineId 
 * @param {*} modes 
 * 
 * @return {DocumentFragment}
 */
export function makeSummaryButtons(comp, timelineId, btnClass, modes) {
  const { summaryIconUris } = comp.context.doc.state;
  const frag = document.createDocumentFragment();
  modes.forEach(mode => {
    const label = summaryIconUris[mode] ?
      /*html*/`<img width="${defaultIconSize}" src="${summaryIconUris[mode]}" />` :
      '👁';
    const modeName = DDGSummaryMode.nameFrom(mode);
    const btnEl = compileHtmlElement(
    /*html*/`<button title="${modeName}" class="${btnClass}">
        ${label}
    </button>`);
    addSummaryModeListener(btnEl, comp, timelineId, mode);
    frag.appendChild(btnEl);
  });

  return frag;
}

// ###########################################################################
// event listeners
// ###########################################################################

/**
 * @param {ClientComponentEndpoint} comp 
 * @param {*} timelineId 
 * @param {*} mode 
 */
function addSummaryModeListener(btnEl, comp, timelineId, mode) {
  const eventCfg = {
    async click(evt) {
      evt.preventDefault();

      /**
       * @type {DDGTimelineView}
       */
      // eslint-disable-next-line prefer-destructuring
      const timeline = comp.context.doc.timeline;
      timeline.setSummaryMode(timelineId, mode);
    },

    focus(evt) { evt.target.blur(); }
  };

  addElementEventListeners(btnEl, eventCfg);
}
