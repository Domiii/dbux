import {
	Disposable,
	workspace,
	window,
	OverviewRulerLane,
	DecorationOptions,
	Range,
	TextEditor
} from 'vscode';

import { DataProvider, getDefaultDataProvider } from 'dbux-data/src/DataProvider';
import { makeDebounce } from 'dbux-common/src/util/scheduling'

let dataProvider: DataProvider;
let activeEditor: TextEditor;


const renderDecorations = makeDebounce(function updateDecorations() {
	if (!activeEditor) {
		return;
	}
	
	while (match = regEx.exec(text)) {
		if (match[0].length < 3) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			largeNumbers.push(decoration);
		}
	}
	activeEditor.setDecorations(traceDecorations, traceDecorations);
});

/**
 * Relevant VSCode API (https://code.visualstudio.com/api/references/vscode-api):
 *  DecorationRenderOptions
 *  DocumentHighlight
 *  DocumentLinkProvider
 *  DocumentRangeFormattingEditProvider
 * 
 */
export function initCodeDeco(context) {
	// dataProvider = getDefaultDataProvider();
	// dataProvider.onData('traces', renderDecorations);

	// // create a decorator type that we use to decorate small numbers
	// const traceDecorationType = window.createTextEditorDecorationType({
	// 	before: {
	// 		textContent: '|',
	// 		light: {
	// 			color: 'darkred'
	// 		},
	// 		dark: {
	// 			color: 'lightred'
	// 		}
	// 	},
	// 	cursor: 'crosshair',
	// 	// borderWidth: '1px',
	// 	// borderStyle: 'solid',
	// 	overviewRulerColor: 'blue',
	// 	overviewRulerLane: OverviewRulerLane.Right,
	// 	// light: {
	// 	// 	// this color will be used in light color themes
	// 	// 	borderColor: 'darkblue'
	// 	// },
	// 	// dark: {
	// 	// 	// this color will be used in dark color themes
	// 	// 	borderColor: 'lightblue'
	// 	// }
	// });

	// if (activeEditor) {
	// 	renderDecorations();
	// }

	// window.onDidChangeActiveTextEditor(editor => {
	// 	activeEditor = editor;
	// 	if (editor) {
	// 		renderDecorations();
	// 	}
	// }, null, context.subscriptions);

	// workspace.onDidChangeTextDocument(event => {
	// 	if (activeEditor && event.document === activeEditor.document) {
	// 		renderDecorations();
	// 	}
	// }, null, context.subscriptions);
}




// function buildDecorations() {

// }


// function renderDecorations() {
//   const editor = window.activeTextEditor;

//   if (!editor || !editor.document) {
//     return;
//   }
//   const { document } = editor;
//   const currentLanguage = document.languageId;

//   const isLanguageEnabled = !!this.metricsUtil.selector.find(s => s.language === currentLanguage);

// }