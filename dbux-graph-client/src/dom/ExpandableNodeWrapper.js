import { decorateClasses } from 'dbux-graph-client/src/util/domUtil.js';

/**
 * Takes a button and a list element, and connects them s.t.
 * when clicking the button, the list is toggled.
 */
export default class ExpandableNodeWrapper {
  constructor(btnEl, listEl, expandedInitially = undefined) {
    this.btnEl = btnEl;
    this.listEl = listEl;

    // hide button if list is empty
    const observerOptions = {
      childList: true
    }
    const observer = this.observer = new MutationObserver(this.handleChildrenChanged);
    observer.observe(listEl, observerOptions);

    btnEl.addEventListener('click', evt => this.toggle());

    // initialize
    this.toggle(expandedInitially);

    this._renderButton();
  }

  isExpanded() {
    return !this.listEl.classList.contains('hidden');
  }

  handleChildrenChanged = () => {
    this._renderButton();
  }

  _renderButton() {
    const hidden = !this.listEl.children.length;

    // toggle button
    decorateClasses(this.btnEl, {
      hidden
    });
  }

  toggle = (expanded = undefined) => {
    const { listEl, btnEl } = this;

    expanded = expanded !== undefined ? 
      expanded : !this.isExpanded();
    
    if (expanded) {
      listEl.classList.remove('hidden');
      btnEl.innerHTML = '▽';//﹀ ▽
    } else {
      listEl.classList.add('hidden');
      btnEl.innerHTML = '▷';//〉 ▷  ►
    }
  }
}