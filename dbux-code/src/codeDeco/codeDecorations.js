import {
  TextEditorDecorationType,
  window
} from 'vscode';
import pull from 'lodash/pull';


// ###########################################################################
// CodeDecoRegistration
// ###########################################################################

export class CodeDecoRegistration {
  unsubscribe;

  constructor(editorDecorationType) {
    this.editorDecorationType = editorDecorationType;
  }

  unsetDeco() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  setDeco(editor, cfg) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // eslint-disable-next-line no-use-before-define
    this.unsubscribe = codeDecorations.addDeco(editor, this.editorDecorationType, cfg);
  }

  setDecos(editor, cfgs) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // eslint-disable-next-line no-use-before-define
    this.unsubscribe = codeDecorations.setDecos(editor, this.editorDecorationType, cfgs);
  }
}

// ###########################################################################
// EditorDecorations
// ###########################################################################

export class EditorDecorations {
  /**
   * The type defines the style (CSS-like).
   * @see traceDecoConfig.js
   * @see https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
   * @type {TextEditorDecorationType}
   */
  editorDecorationType;
  editor;
  /**
   * Each decoration contains a `loc` property.
   * @see createTraceGroupDecoration
   * @type {EditorDecorations[]}
   */
  decorations = [];

  /**
   * @param {TextEditorDecorationType} editorDecorationType 
   */
  constructor(editor, editorDecorationType) {
    this.editor = editor;
    this.editorDecorationType = editorDecorationType;
  }

  addDeco(cfg) {
    this.decorations.push(cfg);
    this.render();

    return () => {
      this.removeDeco(cfg);
    };
  }

  setDecos(decos) {
    this.decorations = decos;
    this.render();

    return () => {
      this.decorations = [];
      this.render();
    };
  }

  removeDeco(deco) {
    pull(this.decorations, deco);
    this.render();
  }

  render() {
    this.editor.setDecorations(this.editorDecorationType, this.decorations);
  }
}

// ###########################################################################
// CodeDecorations
// ###########################################################################

class CodeDecorations {
  decorations = new Map();

  getOrCreateDecos(editor, editorDecorationType) {
    let ofEditor = this.decorations.get(editor);
    if (!ofEditor) {
      this.decorations.set(editor, ofEditor = new Map());
    }

    let decos = ofEditor.get(editorDecorationType);
    if (!decos) {
      ofEditor.set(editorDecorationType, decos = new EditorDecorations(editor, editorDecorationType));
    }
    return decos;
  }

  /**
   * @param {any} deco 
   * 
   * @returns {Function} Callback that will remove the deco again when executed.
   */
  addDeco(editor, editorDecorationType, deco) {
    const decos = this.getOrCreateDecos(editor, editorDecorationType);
    return decos.addDeco(deco);
  }
  
  /**
   * @param {[]} decos
   * 
   * @returns {Function} Callback that will remove the deco again when executed.
   */
  setDecos(editor, editorDecorationType, newDecos) {
    const decos = this.getOrCreateDecos(editor, editorDecorationType);
    return decos.setDecos(newDecos);
  }

  removeDeco(editor, editorDecorationType, deco) {
    const decos = this.getOrCreateDecos(editor, editorDecorationType);
    decos.removeDeco(deco);
  }

  /**
   * Use this if you only want a single decoration that you want to easily remove/replace or move.
   * This is most useful for highlighting "the currently selected" of something.
   * 
   * @param decoStyle A css-adjacent style object that will be used by `window.createTextEditorDecorationType`
   * @returns {CodeDecoRegistration} 
   */
  registerDeco(decoStyle) {
    const decoType = window.createTextEditorDecorationType(decoStyle);
    return new CodeDecoRegistration(decoType);
  }
}




const codeDecorations = new CodeDecorations();

export default codeDecorations;