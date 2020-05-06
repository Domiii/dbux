import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';
import { decorateClasses } from '@/util/domUtil';

export default class Highlighter extends ClientComponentEndpoint {
  init() {
    const {
      highlighter
    } = this.owner.els;

    this.highlighterEl = highlighter;
  }


  update() {
    const { state: { enabled } } = this;

    decorateClasses(this.highlighterEl, {
      highlighted: enabled
    });
  }
}