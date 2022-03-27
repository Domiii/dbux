import { html, css, property, customElement } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { styleMap } from 'lit-html/directives/style-map';
import EmptyObject from '@scholar-scrape/common/src/util/EmptyObject';
import { articleToString, makeArticleCiteRef } from '@scholar-scrape/common/src/util/articleUtil';
import ArticleStatus from '@scholar-scrape/common/src/data/ArticleStatus';
import { allArticleFields } from '@scholar-scrape/common/src/data/articles';
// import NotLoaded from '../../common/stores/NotLoaded';
import articleStore from '../../common/stores/articleStore';
import Component from '../../common/components/Component';
import appRenderState from '../state/appRenderState';

import './TextEditor';
import sleep from '../../scrape/sleep';

const fieldConfig = {
  year: {
    clazz: ' ',
  },
  citedBy: {
    readonly: true,
    style: 'max-width: 30px'
  },
  title: {
    clazz: ' ',
    style: 'max-width: 400px; text-align: left;'
  },
  tags: {
    style: 'max-width: 100px;'
  },
  links: {
    readonly: true
  }
};

/**
 * @see https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
 */
function mapRange(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

@customElement('article-row'/* , { extends: 'tr' } */)
class ArticleRow extends Component {
  @property({ attribute: 'id' })
  id = null;

  @property()
  tableState;

  connect = [
    articleStore,
    appRenderState
  ];

  // ###########################################################################
  // styles
  // ###########################################################################
  static get styles() {
    return css`x`;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  isSelected() {
    return this.id && this.tableState.get.selectedRow === this.id;
  }

  getArticle() {
    const { id } = this;
    return articleStore.getById(id);
  }

  // ###########################################################################
  // actions
  // ###########################################################################


  selectThis = () => {
    this.tableState.setState({
      selectedRow: this.isSelected() ? null : this.id
    });
  }

  async _updateCurrentArticle(upd) {
    await articleStore.updateArticle(this.id, upd);
  }

  _makeUpdater = (field) => {
    return async (evt, value) => {
      evt.preventDefault();

      // store in DB
      await this._updateCurrentArticle({ [field]: value }, field);
      if (this.state.editing === field) {
        // stop editing
        this.setState({ editing: null });
      }
    };
  }

  updateRelevance = async () => {
    const relevance = window.prompt('Relevance?', this.getArticle().relevance || 0);
    if (relevance === null) {
      return null;
    }
    return this._updateCurrentArticle({
      relevance: relevance
    });
  }

  refetchScholarData = async () => {
    // if (!window.confirm(`Are you sure you want to delete this article?\n\n${articleToString(article)}`)) {
    //   return;
    // }
    window.alert('NIY');
    // return this._update({ gsCId: null });
  }

  delete = async () => {
    try {
      const article = this.getArticle();
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Are you sure you want to set this article's status to Rejected?\n\n${articleToString(article)}`)) {
        return;
      }
      await this._updateCurrentArticle({ status: ArticleStatus.Rejected });
    }
    catch (err) {
      const msg = `deleteArticle FAILED\n\n${err.stack}`;
      console.error(msg);
      // eslint-disable-next-line no-alert
      window.alert(msg);
    }
  }

  // ###########################################################################
  // editing
  // ###########################################################################

  edit = Object.fromEntries(allArticleFields.map(field => [field,
    {
      isEditing: () => this.state.editing === field,
      setEditing: () => this.setState({
        editing: field
      }),
      updater: this._makeUpdater(field),
      renderCellOrEditor: this._renderEditableCell.bind(this, field)
    }
  ]));

  cancelEdit = (evt) => {
    evt.preventDefault();
    this.setState({
      editing: null
    });
  }

  newCurrentArticleCitation = async () => {
    const {
      id,
      bibtexCitation
    } = this.getArticle();
    // eslint-disable-next-line no-alert
    const openGs = window.confirm(`Update citation...\nCurrent citation for article #${id}: "${bibtexCitation}"\nDo you want to open GS?`);

    if (openGs) {
      window.open(this.getCurrentArticleGSUrl(), '_blank');
    }

    // wait until tab is active again (else, prompt will be ignored)
    do {
      console.debug(document.hidden);
      await sleep(30);
    }
    while (document.hidden);

    // eslint-disable-next-line no-alert
    const newCitation = prompt(`New citation...`);
    if (newCitation) {
      await this._updateCurrentArticle({
        bibtexCitation: newCitation
      });
    }
  }

  copyCitation = async evt => {
    const result = await navigator.permissions.query({ name: "clipboard-write" });
    if (result.state === "granted" || result.state === "prompt") {
      let {
        bibtexCitation
      } = this.getArticle();
      if (!bibtexCitation?.trim().startsWith('@')) {
        bibtexCitation = await this.newCurrentArticleCitation();
      }

      if (bibtexCitation?.trim().startsWith('@')) {
        const ref = makeArticleCiteRef(this.getArticle());
        navigator.clipboard.writeText(ref);
      }
    }
    else {
      // eslint-disable-next-line no-alert
      alert('cannot copy to clipboard: ' + result.state);
    }
  }

  // ###########################################################################
  // children
  // ###########################################################################

  selectButton() {
    const {
      id
    } = this.getArticle();
    return html`<span style="padding: 0; background-color: none; font-size: 9px;">
      ${id}
    </span>`;
  }

  relevance() {
    const {
      relevance
    } = this.getArticle();

    const h = mapRange(relevance, 0, 10, 80, 0);
    const s = 100;
    const l = 80;
    // const l = mapRange(relevance, 0, 10, 50);

    const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    const style = {
      backgroundColor
    };

    return html`<span style=${styleMap(style)}>
      ${relevance || 0}
    </span>`;
  }

  label() {
    const article = this.getArticle();
    const {
      title,
      url
    } = article;

    if (!url) {
      return html`${title}`;
    }
    return html`<a href=${url}>${title}</a>`;
  }

  authors() {
    const {
      authors,
      authorsStub
    } = this.getArticle();
    // return html`${authors || authorsStub}`;
    return authors || authorsStub || '';
  }

  links() {
    return html`
      ${this.pdfLink()}
      ${this.shLink()}
      ${html`<a @click=${this.copyCitation} @dblclick=${this.newCurrentArticleCitation}>ref</a>`}
    `;
  }

  pdfLink() {
    const {
      pdfUrl
    } = this.getArticle();

    return pdfUrl && html`<a href=${pdfUrl}>Pdf</a>` || '';
  }

  shLink() {
    const {
      doi
    } = this.getArticle();

    // const href = doi && `https://scihub.wikicn.top/${doi}`;
    const href = doi && `https://sci-hub.se/${doi}`;

    return href && html`<a target="_blank" href=${href}>sh</a>` || '';
  }

  getCurrentArticleGSUrl() {
    let {
      authors,
      firstAuthorSurname,
      year,
      title
    } = this.getArticle();
    authors = authors || firstAuthorSurname;

    // NOTE: same as ScholarSearchTask
    const q = `${authors && (authors + ' ') || ''}${year && (year + ' ') || ''}"${title}"`;
    // const searchData = {
    //   searchTerm
    // };
    // result = await articleStore.searchArticle(searchData);
    // renderSearchResults(result);

    return `https://scholar.google.com/scholar?hl=en&q=${q}&btnG=`;
  }

  selectedDecorations() {
    if (!this.isSelected()) {
      return '';
    }

    return html`
      <!--button style="" @click=${this.refetchScholarData}>🔄</button-->
      <a href=${this.getCurrentArticleGSUrl()} target="_blank">gs</a>
      <button style="color: red;" @click=${this.delete}>x</button>
    `;
  }

  // ###########################################################################
  // 
  // ###########################################################################

  firstUpdated() {
    // event listeners
    this.addEventListener('mouseover', () => {
      this.style.backgroundColor = 'lightyellow';
    });
    this.addEventListener('mouseout', () => {
      this.style.backgroundColor = '';
    });

    // subscribe to tableState
    this.subscribeTo(this.tableState);
  }

  highlight() {
    // highlight recently updated rows
    const highlightTime = 60;
    const timeAlive = (new Date() - this.getArticle()?.updatedAt) / 1000; // seconds
    // console.debug('timeAlive', this.getArticle().title, timeAlive);
    if (timeAlive < highlightTime) {
      this.setAttribute('updated', 1);
      setTimeout(() => {
        this.removeAttribute('updated');
      }, (highlightTime - timeAlive) * 1000);
    }
  }

  // ###########################################################################
  // render
  // ###########################################################################

  fieldGetter = {
    links: () => this.links(),
    authors: () => this.authors(),
    description: article => article.description || article.descriptionStub
  };

  fieldRender = {
    title: (field, value, article) => {
      // just render actual value
      const rendered = value !== null && value !== undefined ?
        value :
        html`<span style="color:gray;">-</span>`;

      return html`<a target="_blank" .href=${article.url || ''}>
      ${rendered}
    </a>`;
    }
  };

  _fieldRenderDefault = (field, value, article) => {
    // just render actual value
    const rendered = value !== null && value !== undefined ?
      value :
      html`<span style="color:gray;">-</span>`;

    return html`<span>
      ${rendered}
    </span>`;
  }

  renderField(field, article) {
    const fieldGetter = this.fieldGetter[field];
    const value = fieldGetter ? fieldGetter(article) : article[field];
    return this.td(field, value, article);
  }


  td = (field, value, article) => {
    const cfg = fieldConfig[field] || EmptyObject;
    let {
      readonly,
      clazz = '',
      style = ''
    } = cfg;

    const edit = this.edit[field];
    const editing = edit.isEditing();
    const startEdit = (!editing && !readonly) ?
      edit.setEditing :
      null;

    if (!(clazz in cfg)) {
      // default class
      clazz = 'center';
      if (!editing) {
        clazz += ' dynamic';
      }
    }
    if (editing) {
      clazz += ' editing';
    }
    return html`
      <td @click=${startEdit} style=${style} class=${clazz}>
        ${edit.renderCellOrEditor(value, article)}
      </td>
    `;
  }

  _renderEditableCell(field, value, article) {
    const editing = this.edit[field].isEditing();
    if (editing) {
      // render editor
      return editing && html`<text-editor 
        .obj=${article} 
        .field=${field} 
        .value=${value}
        .save=${this.edit[field].updater} 
        .cancel=${this.cancelEdit}
      ></text-editor>`;
    }

    // render default
    const renderer = this.fieldRender[field] || this._fieldRenderDefault;
    return renderer(field, value, article);
  }

  render() {
    this.highlight();
    const article = this.getArticle();
    if (!article) {
      return html`invalid article id: ${this.id}`;
    }

    const fields = appRenderState.get.fields;

    // <tr style=${styleMap({ backgroundColor: this.isSelected() ? 'yellow' : '' })}>
    return html`
        <td @click=${this.selectThis}>${this.selectButton()} ${this.selectedDecorations()}</td>
        <td @click=${this.updateRelevance}>${this.relevance()}</td>
        
        ${repeat(fields, field => field, field => this.renderField(field, article))}
    `;
    // </tr>
  }
}

export default ArticleRow;