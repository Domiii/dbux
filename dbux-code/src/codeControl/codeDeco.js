import {
	Disposable,
	workspace,
	window,
	OverviewRulerLane,
	DecorationOptions,
	Range,
	TextEditor
} from 'vscode';

import DataProvider from 'dbux-data/src/DataProvider';
import { getDefaultDataProvider } from 'dbux-data/src/dataProviderImpl';
import { makeDebounce } from 'dbux-common/src/util/scheduling'
import { newLogger } from 'dbux-common/src/log/logger';
import { getCodeRangeFromLoc } from '../util/codeUtil';

const { log, debug, warn, error: logError } = newLogger('DBUX CodeDeco');

let dataProvider: DataProvider;
let activeEditor: TextEditor;
let TraceDecorationType;

const renderDecorations = makeDebounce(function renderDecorations() {
	if (!activeEditor) {
		return;
	}

	const fpath = activeEditor.document.uri.fsPath;
	const programId = dataProvider.queries.programIdByFilePath(fpath);
	if (!programId) {
		debug('Program not executed', fpath);
		return;
	}
	const traces = dataProvider.indexes.traces.byFile.get(programId);
	if (!traces) {
		debug('No traces in file', fpath);
		return;
	}

	const decorations = [];

	for (const trace of traces) {
		const {
			staticTraceId,
			contextId,
			value
		} = trace;
		const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
		const {
			displayName,
			loc
		} = staticTrace;

		// const context = dataProvider.collections.executionContexts.getById(contextId);
		// const childContexts = dataProvider.indexes.executionContexts.children.get(contextId);

		const decoration = {
			range: getCodeRangeFromLoc(loc),
			hoverMessage: `Trace **${displayName}** (${value})`
		};
		decorations.push(decoration);
	}

	activeEditor.setDecorations(TraceDecorationType, decorations);
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
	dataProvider = getDefaultDataProvider();

	// create a decorator type that we use to decorate small numbers
	TraceDecorationType = window.createTextEditorDecorationType({
		before: {
			contentText: '|',
			color: 'red',
			// light: {
			// 	color: 'darkred'
			// },
			// dark: {
			// 	color: 'lightred'
			// }
		},
		cursor: 'crosshair',
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: OverviewRulerLane.Right,
		// light: {
		// 	// this color will be used in light color themes
		// 	borderColor: 'darkblue'
		// },
		// dark: {
		// 	// this color will be used in dark color themes
		// 	borderColor: 'lightblue'
		// }
	});

	// hook up all events

	activeEditor = window.activeTextEditor;
	if (activeEditor) {
		// initial render
		renderDecorations();
	}

	// data changed
	dataProvider.onData('traces', renderDecorations);

	// active window changed
	window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			renderDecorations();
		}
	}, null, context.subscriptions);

	// text content changed?
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