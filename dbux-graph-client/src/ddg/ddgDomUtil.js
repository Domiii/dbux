import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGSummaryMode, { } from '@dbux/data/src/ddg/DDGSummaryMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { addElementEventListeners, compileHtmlElement, decorateClasses } from '../util/domUtil';

/** @typedef { import("./DDGTimelineView").default } DDGTimelineView */
/** @typedef { import("./DDGDocument").default } DDGDocument */

const defaultIconSize = '12px';

export const DefaultToolbarBtnClass = 'toolbar-btn btn btn-info';


/** ###########################################################################
 * Summary Mode
 * ##########################################################################*/

const summaryBtnLabelHtml = {
  [DDGSummaryMode.Hide]: '⛒',
  [DDGSummaryMode.HideChildren]: '⛒',
  [DDGSummaryMode.ExpandSelf1]: '1️⃣',
  [DDGSummaryMode.ExpandSelf2]: '2️⃣',
  [DDGSummaryMode.ExpandSelf3]: '3️⃣',
  [DDGSummaryMode.ExpandSelf4]: '4️⃣',
  // [DDGSummaryMode.CollapseSummary]: '💢'
};


export function makeSummaryLabelEl(docState, mode) {
  return compileHtmlElement(makeSummaryLabel(docState, mode));
}


export function makeSummaryLabel(docState, mode) {
  const { summaryIconUris } = docState;
  if (!summaryIconUris[mode]) {
    return summaryBtnLabelHtml[mode]; // hackfix
  }
  return /*html*/`<img width="${defaultIconSize}" src="${summaryIconUris[mode]}" />`;
}

export function makeSummaryLabelSvgCompiled(docState, mode, x, y) {
  const { summaryIconUris } = docState;
  if (!summaryIconUris[mode]) {
    return compileHtmlElement(`<text>${summaryBtnLabelHtml[mode]}</text>`);
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
  const disabled = !ddgQueries.canApplySummaryMode(ddg, node, btnMode);
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
 * @param {DDGDocument} doc
 */
function addSummaryModeListener(btnEl, doc, timelineId, mode) {
  addDefaultBtnListeners(btnEl, () => {
    /**
     * @type {DDGTimelineView}
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
 * @param {DDGDocument} doc
 */
function addSettingsModeListener(doc, btnEl, setting) {
  addDefaultBtnListeners(btnEl, () => {
    // future-work: for now, we can only render bools
    //   → toggle bool
    const timeline = getTimelineOfDoc(doc);
    const newVal = !timeline.ddg.settings[setting];
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
export function decorateSettingButton(ddg, btnEl, setting) {
  const val = getDDGSetting(ddg, setting);
  decorateClasses(btnEl, {
    active: !!val
  });
}

/**
 * @param {DDGDocument} doc
 */
export function makeSettingsButtons(doc) {
  const btnClass = DefaultToolbarBtnClass + ' settings-button';

  const ddg = getDDGOfDoc(doc);
  const allSettingNames = Object.keys(ddg.settings);

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
        decorateSettingButton(ddg, btnEl, setting);
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
 * @return {DDGTimelineView}
 */
function getTimelineOfDoc(doc) {
  const { timeline } = doc;
  return timeline;
}

/**
 * @return {RenderState}
 */
function getDDGOfDoc(doc) {
  // return doc.timeline.ddg;
  return doc.state;
}

function getDDGSetting(ddg, setting) {
  return ddg.settings[setting];
}

/**
 * @param {DDGDocument} doc
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
