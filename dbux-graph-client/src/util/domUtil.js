import { newLogger } from '@dbux/common/src/log/logger';
import isFunction from 'lodash/isFunction';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-common/domUtil');


// ##################################################################################################################
// Conditional CSS classes
// ##################################################################################################################

export function decorateClasses(el, cfg) {
  for (let clazz in cfg) {
    let val = cfg[clazz];
    if (val) {
      el.classList.add(clazz);
    }
    else {
      el.classList.remove(clazz);
    }
  }
}

export function decorateAttr(el, cfg) {
  for (let attr in cfg) {
    let val = cfg[attr];
    el.setAttribute(attr, val);
  }
}

/**
 * This is a hackfix function, that magically
 * fixes several issues caused by buggy webview
 * behavior.
 */
export function repaintEl(el) {
  // var el = document.querySelector('#root');
  // var el = domElement;
  const p = el.parentNode;
  p.removeChild(el);
  p.appendChild(el);
}

// ###########################################################################
// building elements from strings
// ###########################################################################

/**
 * @example `var td = htmlToElement('<td>foo</td>');`
 * @param {String} HTML representing a single element
 * @return {HTMLElement}
 * @see https://stackoverflow.com/a/35385518
 */
export function compileHtmlElement(html) {
  const template = document.createElement('template');
  html = html.trim(); // leading/trailing whitespace causes unwanted text nodes
  template.innerHTML = html;
  return template.content.firstChild;
}

/**
 * @see https://stackoverflow.com/a/35385518
 */
export function compileHtmlElements(html) {
  const template = document.createElement('template');
  html = html.trim(); // leading/trailing whitespace causes unwanted text nodes
  template.innerHTML = html;
  return template.content.childNodes;
}

/**
 * Allows for multiple comma-separated entries per attribute.
 */
export function collectElementsByDataAttrMulti(containerEl, groupName) {
  return collectElementsByDataAttr(containerEl, groupName, true);
}

export function collectElementsByDataAttr(containerEl, groupName, multi = false) {
  const attrName = `data-${groupName}`;
  const all = containerEl.querySelectorAll(`[${attrName}]`);
  const els = {};
  function regEl(name, el) {
    if (name) {
      if (els[name]) {
        warn(`[collectElementsByDataAttr] element name used more than once: \
${name} in group ${groupName} in element ${containerEl.innerHTML}`);
      }
      els[name] = el;
    }
  }
  all.forEach(el => {
    const nameOrNames = el.getAttribute(attrName);
    if (multi) {
      nameOrNames.split(',').
        map(name => name.trim()).
        forEach(name => regEl(name, el));
    }
    else {
      regEl(nameOrNames, el);
    }
  });
  return els;
}

// ##################################################################################################################
// More rendering (HTML, CSS + color) utilities
// ##################################################################################################################


/**
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // returns #7F7F7F
 * lerpColor('#000000', '#ffffff', 0.5)
 * @returns {String}
 * @see https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 */
export function lerpColor(a, b, amount) {
  const ah = parseInt(a.replace(/#/g, ''), 16),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ''), 16),
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

// more stuff

// select text on click
// see: https://stackoverflow.com/a/20079910
export function selectTextOnClick(el) {
  // select text on Click
  window.getSelection().selectAllChildren(el);

  // old version
  // see: https://stackoverflow.com/questions/4067469/selecting-all-text-in-html-text-input-when-clicked
  // $inputEl[0].onclick = function () { this.setSelectionRange(0, this.value.length) };
}


// ###########################################################################
// Forms
// ###########################################################################

export function formOnEnter(formEl, cb) {
  formEl.addEventListener('keydown', evt => {
    // console.log($(evt.target).closest('form')[0]);
    if (evt.keyCode === 13 && evt.target.closest('form') === formEl) {
      cb(evt);
    }
  });
}


// ###########################################################################
// events
// ###########################################################################

export async function waitForClick($btn) {
  return new Promise(r => $btn.off('click').on('click', r));
}

export async function addInputTypeEvent($input, cb) {
  $input.on('keyup', evt => {
    if (evt.keyCode && !evt.keyCode.toString().match(/^(37|38|39|40|13|16|17|18|224)$/)) {
      cb(evt);
    }
  });
}

// ###########################################################################
// CSS utils
// ###########################################################################

/**
 * 
 * 
 * @see https://stackoverflow.com/a/34490573
 */
export function setElementStyle(styles, element) {
  Object.assign(element.style, styles);
}

// ###########################################################################
// DOM tree traversing
// ###########################################################################

/**
 * Find a parent of given HTMLElement that matching the pattern
 * @param {string} pattern css selector pattern
 * @param {HTMLElement} from start search from this element
 * @param {HTMLElement} [root] stop search for parent after this element
 */
export function getMatchParent(pattern, from, root = document) {
  if (!from) {
    return null;
  }

  if (from.matches(pattern)) {
    return from;
  }
  else if (root !== from) {
    return getMatchParent(pattern, from.parentElement, root);
  }
  else {
    return null;
  }
}

/** ###########################################################################
 * Event
 *  #########################################################################*/

/**
 * @param {HTMLElement} root 
 * @param {string} selector 
 * @param {string} eventType 
 * @param {function} handler 
 */
export function delegate(root, selector, eventType, handler) {
  root.addEventListener(eventType, async (evt) => {
    const matchedEl = getMatchParent(selector, evt.target, root);
    if (matchedEl) {
      await handler(matchedEl, evt);
    }
  });
}

/** ###########################################################################
 * {@link addElementEventListeners}
 * ##########################################################################*/

export function addElementEventListeners(el, cfg, thisArg = null, elName = null) {
  for (const eventName in cfg) {
    const cb = cfg[eventName];
    if (!isFunction(cb)) {
      this.logger.error(`Invalid event handler (on) - is not a function: "${elName || el.innerHTML}.${eventName}"`);
      continue;
    }
    el.addEventListener(eventName, thisArg ? cb.bind(thisArg) : cb);
  }
}

/**
 * @see https://stackoverflow.com/a/66065413
 */
export const BootstrapBtnGroupSeparatorHtml = `<button type="button" class="btn btn-secondary mr-0 ml-0 pr-0 pl-0" disabled></button>`;

export function makeBootstrapBtnGroupSeparatorEl() {
  return compileHtmlElement(BootstrapBtnGroupSeparatorHtml);
}
