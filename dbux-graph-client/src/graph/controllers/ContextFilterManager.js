import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { decorateClasses } from '../../util/domUtil';

export default class ContextFilterManager extends ClientComponentEndpoint {
  get doc() {
    return this.parent;
  }

  get toolbar() {
    return this.doc.children.getComponent('Toolbar');
  }

  init() {
    // override init to make sure createEl is not triggered
  }

  update() {
    const { filterActived } = this.state;
    decorateClasses(this.toolbar.els.packageWhitelistBtn, {
      active: filterActived.packageWhitelist
    });
    decorateClasses(this.toolbar.els.packageBlacklistBtn, {
      active: filterActived.packageBlacklist
    });
    decorateClasses(this.toolbar.els.fileBlacklistBtn, {
      active: filterActived.fileBlacklist
    });
    decorateClasses(this.toolbar.els.fileBlacklistBtn, {
      active: filterActived.fileBlacklist
    });
  }
}