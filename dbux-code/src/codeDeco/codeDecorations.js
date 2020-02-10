import {
  TextEditorDecorationType,
  window
} from 'vscode';
import pull from 'lodash/pull';


export class EditorDecorations {
  editorDecorationType: TextEditorDecorationType;
  editor;
  decorations: EditorDecorations[] = [];

  constructor(editor, editorDecorationType: TextEditorDecorationType) {
    this.editor = editor;
    this.editorDecorationType = editorDecorationType;
  }

  addDeco(deco) {
    this.decorations.push(deco);
    this.render();

    return () => {
      this.removeDeco(deco);
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

export class CodeDecoRegistration {
  unsubscribe;

  constructor(editorDecorationType) {
    this.editorDecorationType = editorDecorationType;
  }

  setDeco(editor, deco) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.unsubscribe = codeDecorations.addDeco(editor, this.editorDecorationType, deco);
  }
}


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