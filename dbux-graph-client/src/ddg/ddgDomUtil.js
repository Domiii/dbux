import pdgQueries, { RenderState } from '@dbux/data/src/pdg/pdgQueries';
import PDGSummaryMode, { } from '@dbux/data/src/pdg/PDGSummaryMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { addElementEventListeners, compileHtmlElement, decorateClasses } from '../util/domUtil';

/** @typedef { import("./PDGTimelineView").default } PDGTimelineView */
/** @typedef { import("./PDGDocument").default } PDGDocument */

const defaultIconSize = '12px';

export const DefaultToolbarBtnClass = 'toolbar-btn btn btn-info';


/** ###########################################################################
 * Summary Mode
 * ##########################################################################*/

const summaryBtnLabelText = {
  [PDGSummaryMode.Hide]: '⛒',
  [PDGSummaryMode.HideChildren]: '⛒',
  [PDGSummaryMode.ExpandSelf]: '☰',
  [PDGSummaryMode.ExpandSelf1]: '1️⃣',
  [PDGSummaryMode.ExpandSelf2]: '2️⃣',
  [PDGSummaryMode.ExpandSelf3]: '3️⃣',
  [PDGSummaryMode.ExpandSelf4]: '4️⃣',
  // [PDGSummaryMode.CollapseSummary]: '💢'
};


export function makeSummaryLabelEl(docState, mode) {
  return compileHtmlElement(makeSummaryLabel(docState, mode));
}


export function makeSummaryLabel(docState, mode) {
  const { summaryIconUris } = docState;
  if (!summaryIconUris[mode]) {
    return summaryBtnLabelText[mode]; // hackfix
  }
  return /*html*/`<img width="${defaultIconSize}" src="${summaryIconUris[mode]}" />`;
}

export function makeSummaryLabelSvgCompiled(docState, mode, x, y) {
  const { summaryIconUris } = docState;

  let el;
  if (!summaryIconUris[mode]) {
    // return compileHtmlElement(`<text>${summaryBtnLabelHtml[mode]}</text>`);
    el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttributeNS(null, 'fill', 'white');
    el.textContent = summaryBtnLabelText[mode] || '';
  }
  else {
    /**
     * @see https://stackoverflow.com/a/10859332
     */
    el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', summaryIconUris[mode]);
    el.setAttributeNS(null, 'height', defaultIconSize);
    el.setAttributeNS(null, 'width', defaultIconSize);
    y -= 10; // hackfix the right position
  }
  el.setAttributeNS(null, 'x', x);
  el.setAttributeNS(null, 'y', y);
  el.setAttributeNS(null, 'visibility', 'visible');
  return el;
}

/**
 * @param {PDGDocument} doc
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
    const modeName = PDGSummaryMode.nameFrom(mode);
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
export function decorateSummaryButton(btnEl, btnMode, pdg, timelineId) {
  const node = pdg.timelineNodes[timelineId];
  const actualMode = pdg.summaryModes[timelineId];
  const disabled = !pdgQueries.canApplySummaryMode(pdg, node, btnMode);
  btnEl.disabled = disabled;
  decorateClasses(btnEl, {
    disabled,
    active: btnMode === actualMode
  });
}

export function updateElDecorations(els) {
  // hackfix: just call updateDeco on those that it can be called on
  els.forEach(el => el?._updateDeco?.());
}

/** ########################################
 * {@link addSummaryModeListener}
 * #######################################*/

/**
 * @param {PDGDocument} doc
 */
function addSummaryModeListener(btnEl, doc, timelineId, mode) {
  addDefaultBtnListeners(btnEl, () => {
    /**
     * @type {PDGTimelineView}
     */
    // eslint-disable-next-line prefer-destructuring
    const timeline = doc.timeline;
    timeline.startRenderTimer();
    timeline.setSummaryMode(timelineId, mode);
  });
}

/** ###########################################################################
 * Graph settings
 * ##########################################################################*/

// const settingsRenderers = {
//   connectedOnly(toolbar, settings, value) {
//     return ;
//   }
// };
const settingBtnLabelHtml = {
  connectedOnly: '🔗',
  extraVertical: '↕',
  params: 'param'
};

const settingBtnTitles = {
  connectedOnly: 'Whether to show only connected nodes',
  params: 'Whether to show parameter nodes'
};

/**
 * @param {PDGDocument} doc
 */
function addSettingsModeListener(doc, btnEl, setting) {
  addDefaultBtnListeners(btnEl, () => {
    // future-work: for now, we can only render bools
    //   → toggle bool
    const timeline = getTimelineOfDoc(doc);
    const newVal = !timeline.pdg.settings[setting];
    timeline.startRenderTimer();
    timeline.setGraphSetting(setting, newVal);
  });
}

export function makeSettingBtnLabel(docState, setting) {
  const { settingIconUris } = docState;
  if (!settingIconUris[setting]) {
    return settingBtnLabelHtml[setting] || setting; // hackfix
  }
  return /*html*/`<img width="${defaultIconSize}" src="${settingIconUris[setting]}" />`;
}

/**
 * 
 */
export function decorateSettingButton(pdg, btnEl, setting) {
  const val = getPDGSetting(pdg, setting);
  decorateClasses(btnEl, {
    active: !!val
  });
}

/**
 * @param {PDGDocument} doc
 */
export function makeSettingsButtons(doc) {
  const btnClass = DefaultToolbarBtnClass + ' settings-button';

  const pdg = getPDGOfDoc(doc);
  const allSettingNames = Object.keys(pdg.settings);

  const frag = document.createDocumentFragment();
  const els = allSettingNames.map(setting => {
    const label = makeSettingBtnLabel(doc.state, setting);
    const btnEl = compileHtmlElement(
    /*html*/`<button title="${settingBtnTitles[setting] || setting}" class="${btnClass}">
        ${label}
    </button>`);
    addSettingsModeListener(doc, btnEl, setting);

    // hackfix
    btnEl._updateDeco = () => {
      if (doc.state.summaryModes) {
        decorateSettingButton(pdg, btnEl, setting);
      }
    };
    btnEl._updateDeco();
    frag.appendChild(btnEl);
    return btnEl;
  });

  return {
    el: frag,
    els
  };
}


/** ###########################################################################
 * shared util
 * ##########################################################################*/


/**
 * @return {PDGTimelineView}
 */
function getTimelineOfDoc(doc) {
  const { timeline } = doc;
  return timeline;
}

/**
 * @return {RenderState}
 */
function getPDGOfDoc(doc) {
  // return doc.timeline.pdg;
  return doc.state;
}

function getPDGSetting(pdg, setting) {
  return pdg.settings[setting];
}

/**
 * @param {PDGDocument} doc
 */
export function addDefaultBtnListeners(btnEl, cb) {
  const eventCfg = {
    async click(evt) {
      evt.stopPropagation();

      cb(evt);
    },

    focus(evt) { evt.target.blur(); }
  };

  addElementEventListeners(btnEl, eventCfg);
}
