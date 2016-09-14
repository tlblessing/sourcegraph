import * as React from "react";
import { InjectedRouter } from "react-router";

import { createLineFromByteFunc } from "sourcegraph/blob/lineFromByte";
import * as DefActions from "sourcegraph/def/DefActions";
import * as Dispatcher from "sourcegraph/Dispatcher";

import * as debounce from "lodash/debounce";

import { Def } from "sourcegraph/api";
import { urlToDefInfo } from "sourcegraph/def/routes";

import { singleflightFetch } from "sourcegraph/util/singleflightFetch";
import { checkStatus, defaultFetch } from "sourcegraph/util/xhr";

import "sourcegraph/blob/styles/Monaco.css";
import { code_font_face } from "sourcegraph/components/styles/_vars.css";

import * as AnalyticsConstants from "sourcegraph/util/constants/AnalyticsConstants";

import {EventLogger} from "sourcegraph/util/EventLogger";

interface Props {
	contents: string;
	repo: string;
	path: string;
	rev: string;

	startLine?: number;
	endLine?: number;
	startByte?: number;
};

export class Blob extends React.Component<Props, null> {
	static contextTypes: React.ValidationMap<any> = {
		siteConfig: React.PropTypes.object.isRequired,
		router: React.PropTypes.object.isRequired,
	};

	context: {
		siteConfig: { assetsRoot: string };
		router: InjectedRouter
	};

	_hoverProvided: string[];
	_toDispose: monaco.IDisposable[];
	_editor: monaco.editor.IStandaloneCodeEditor;
	_decorationID: string[];
	_mouseDownPosition: monaco.editor.IMouseTarget | null;

	// Finding the line from byte requires UTF-8 encoding the entire buffer,
	// because Sourcegraph uses byte offset and Monaco uses (UTF16) character
	// offset. We cache it here so we don't have to calculate it too many times.
	_lineFromByte: (byteOffset: number) => number;

	constructor(props: Props) {
		super(props);
		this._findInPage = this._findInPage.bind(this);
		this._onResize = debounce(this._onResize.bind(this), 300, { leading: true, trailing: true });
		this._hoverProvided = [];
		this._toDispose = [];
		this._decorationID = [];
		this._onSelectionChange = debounce(this._onSelectionChange.bind(this), 1000);
	}

	componentDidMount(): void {
		if ((global as any).require) {
			this._loaderReady();
			return;
		}

		let script = document.createElement("script");
		script.type = "text/javascript";
		script.src = `${this.context.siteConfig.assetsRoot}/vs/loader.js`;
		script.addEventListener("load", this._loaderReady.bind(this));
		document.body.appendChild(script);

		global.document.addEventListener("resize", this._onResize);
	}

	componentWillUnmount(): void {
		this._toDispose.forEach(disposable => {
			disposable.dispose();
		});
		global.document.removeEventListener("keydown", this._findInPage);
		global.document.removeEventListener("resize", this._onResize);
	}

	componentWillReceiveProps(nextProps: Props): void {
		if (this._editor) {
			// If Monaco hasn't been loaded yet, these props will be applied when it loads.
			if (nextProps.contents !== this.props.contents || nextProps.repo !== this.props.repo || nextProps.rev !== this.props.rev || nextProps.path !== this.props.path || nextProps.startLine !== this.props.startLine || nextProps.endLine !== this.props.endLine || nextProps.startByte !== this.props.startByte) {
				setTimeout(() => this._updateEditor());
			}
		}
	}

	_loaderReady(): void {
		if ((global as any).monaco) {
			this._monacoReady();
			return;
		}

		(global as any).require.config({ paths: { "vs": `${this.context.siteConfig.assetsRoot}/vs` } });
		(global as any).require(["vs/editor/editor.main"], this._monacoReady.bind(this));
	}

	_monacoReady(): void {
		this._editor = monaco.editor.create(this.refs["container"] as HTMLDivElement, {
			automaticLayout: true,
			readOnly: true,
			scrollBeyondLastLine: false,
			wrappingColumn: 0,
			fontFamily: code_font_face,
			fontSize: 13,
		});
		this._toDispose.push(this._editor);

		global.document.addEventListener("keydown", this._findInPage);
		this._addClickListener();
		this._addReferencesAction();
		this._overrideNavigationKeys();
		this._editor.onDidChangeCursorSelection(this._onSelectionChange);

		this._updateEditor();
	}

	_updateEditor(): void {
		const repoSpec = {
			repo: this.props.repo,
			file: this.props.path,
			rev: this.props.rev,
		};
		const uri = RepoSpecToURI(repoSpec);
		this._updateModel(uri);

		this._scroll();
	}

	_updateModel(uri: monaco.Uri): void {
		if (typeof this.props.contents !== "string") {
			return;
		}
		let model = monaco.editor.getModel(uri);
		if (!model) {
			model = monaco.editor.createModel(this.props.contents, "", uri);
			this._toDispose.push(model);
		}
		this._editor.setModel(model);

		const lang = model.getMode().getId();
		if (this._hoverProvided.indexOf(lang) === -1) {
			const token = monaco.languages.registerHoverProvider(lang, HoverProvider);
			this._toDispose.push(token);
			this._hoverProvided.push(lang);
		}
		this._lineFromByte = createLineFromByteFunc(this.props.contents);
	}

	_findInPage(e: KeyboardEvent): void {
		const mac = navigator.userAgent.indexOf("Macintosh") >= 0;
		const ctrl = mac ? e.metaKey : e.ctrlKey;
		const FKey = 70;
		if (e.keyCode === FKey && ctrl) {
			if (this._editor) {
				e.preventDefault();
				(document.getElementsByClassName("inputarea")[0] as any).focus();
				this._editor.trigger("keyboard", "actions.find", {});
			}
		}
	}

	_addReferencesAction(): void {
		const palette = this._editor.getAction("editor.action.quickCommand");
		if (palette) {
			(palette as any)._shouldShowInContextMenu = false;
			palette.dispose();
		}
		const action = {
			id: "viewAllReferences",
			label: "View all references",
			contextMenuGroupId: "1_goto",
			run: (e) => this._viewAllReferences(e),
			enablement: {
				tokensAtPosition: ["identifier"],
			},
		};
		this._editor.addAction(action);
	}

	_viewAllReferences(editor: monaco.editor.ICommonCodeEditor): monaco.Promise<void> {
		const pos = editor.getPosition();
		const model = editor.getModel();

		EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_REFERENCES, AnalyticsConstants.ACTION_CLICK, "ClickedViewReferences", { repo: this.props.repo, path: this.props.path, rev: this.props.rev });

		return new monaco.Promise<void>(() => {
			defAtPosition(model, pos).then((resp) => {
				window.location.href = urlToDefInfo(resp.def);
			});
		});
	}

	_addClickListener(): void {
		this._editor.onMouseDown(({target, event}) => {
			const mac = navigator.userAgent.indexOf("Macintosh") >= 0;
			if (event.rightButton || (event.ctrlKey && mac)) {
				this._mouseDownPosition = null;
				return;
			}
			this._mouseDownPosition = target;
		});

		this._editor.onMouseUp(({target}) => {
			if (!this._mouseDownPosition || !target.position.equals(this._mouseDownPosition.position)) {
				return;
			}
			const saved = this._mouseDownPosition;
			const ident = saved.element.className.indexOf("identifier") > 0;
			if (saved.position && ident) {
				const pos = {
					repo: this.props.repo,
					commit: this.props.rev,
					file: this.props.path,
					line: target.position.lineNumber - 1,
					character: target.position.column - 1,
				};
				Dispatcher.Backends.dispatch(new DefActions.WantJumpDef(pos));
			}
		});
	}

	_scroll(): void {
		let startLine: number;
		let endLine: number;
		if (this.props.startLine) {
			startLine = this.props.startLine;
			endLine = this.props.endLine || startLine;
		} else if (this.props.startByte) {
			startLine = this._lineFromByte(this.props.startByte);
			endLine = startLine;
		} else {
			return;
		}
		const linesInViewPort = this._editor.getDomNode().offsetHeight / 20;
		const middleLine = Math.floor(startLine + (linesInViewPort / 4));
		this._editor.revealLineInCenter(middleLine);
		this._highlightLines(startLine, endLine);
		this._editor.focus();
	}

	_overrideNavigationKeys(): void {
		// Monaco overrides the back and forward history commands, so we
		// implement our own here. AFAICT, there isn't a good way
		// to unbind a default keybinding.
		/* tslint:disable */
		// Disable tslint because it doesn't like bitwise operators.
		this._editor.addCommand(monaco.KeyCode.LeftArrow | monaco.KeyMod.CtrlCmd, () => {
			global.window.history.back();
		}, "");
		this._editor.addCommand(monaco.KeyCode.RightArrow | monaco.KeyMod.CtrlCmd, () => {
			global.window.history.forward();
		}, "");
		/* tslint:enable */
		this._editor.addCommand(monaco.KeyCode.Home, () => {
			this._editor.revealLine(1);
		}, "");
		this._editor.addCommand(monaco.KeyCode.End, () => {
			this._editor.revealLine(
				this._editor.getModel().getLineCount()
			);
		}, "");
	}

	_highlightLines(startLine: number, endLine: number): void {
		const range = new monaco.Range(
			startLine,
			this._editor.getModel().getLineMinColumn(startLine),
			endLine,
			this._editor.getModel().getLineMaxColumn(endLine),
		);
		this._editor.setSelection(range);
	}

	_onResize(e: Event): void {
		if (this._editor) {
			this._editor.layout();
		}
	}

	_onSelectionChange(e: monaco.editor.ICursorSelectionChangedEvent): void {
		const start = e.selection.startLineNumber;
		const end = e.selection.endLineNumber;
		const hash = end === start ? "" : `L${start}-${end}`;
		const path = global.document.location.pathname;
		const pathWithSelection = `${path}#${hash}`;
		this.context.router.replace(pathWithSelection);
	}

	render(): JSX.Element {
		return <div ref="container" style={{ display: "flex", flex: "auto", width: "100%" }} />;
	}
}

// We have to make a request to the server to find the def at a position because
// the client does not have srclib annotation data. This involves a ton of
// string munging because we can't save the data types in a good way. A monaco
// position is slightly different than a Sourcegraph one.
const fetch = singleflightFetch(defaultFetch);
class HoverProvider {
	static provideHover(model: monaco.editor.IReadOnlyModel, position: monaco.Position): monaco.Thenable<monaco.languages.Hover> {
		return defAtPosition(model, position).then((resp: DefResponse) => {
			const def = resp.def;
			if (!def) {
				throw new Error("def not found");
			}
			const word = model.getWordAtPosition(position);
			let contents: monaco.MarkedString[] = [];
			if (resp.Title) {
				contents.push(resp.Title);
			} else {
				contents.push(`**${def.Name}** ${def.FmtStrings ? def.FmtStrings.Type.Unqualified.trim() : ""}`);
				const serverDoc = def.Docs ? def.Docs[0].Data : "";
				let docs = serverDoc.replace(/\s+/g, " ");
				if (docs.length > 400) {
					docs = docs.substring(0, 380);
					docs = docs + "...";
				}
				if (docs) {
					contents.push(docs);
				}
			}
			contents.push("*Right-click to view all references.*");
			return {
				range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
				contents: contents,
			};
		});
	}
}

interface DefResponse {
	def: Def;
	Title?: string;
}

function defAtPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position): monaco.Thenable<DefResponse> {
	const url = hoverURL(model.uri, position);
	return fetch(url)
		.then(checkStatus)
		.then(response => response.json())
		.then(data => data)
		.catch(error => { console.error(error); });
}

// The hover-info end point returns a full def. We need to ask the server for
// information about the symbol at the point, because we don't have enough info
// on the client.
function hoverURL(uri: monaco.Uri, position: monaco.Position): string {
	const line = position.lineNumber - 1;
	const col = position.column - 1;
	const {repo: repo, file: file, rev: rev} = pathToURI(uri);
	return `/.api/repos/${repo}@${rev}/-/hover-info?file=${file}&line=${line}&character=${col}`;
}

interface RepoSpec {
	repo: string;
	file: string;
	rev: string;
}

function pathToURI(uri: monaco.Uri): RepoSpec {
	const matches = /[\/\\](.*)[\/\\]-[\/\\](.*)[\/\\]-[\/\\](.*)/.exec(uri.fsPath);
	if (!matches || matches.length < 4) { throw new Error(`invalid argument, model URI (${uri.fsPath}) probably set incorrectly`); }
	const repo = matches[1];
	const rev = matches[2];
	const file = matches[3];
	return { repo: repo, rev: rev, file: file };
}

function RepoSpecToURI({repo, file, rev}: RepoSpec): monaco.Uri {
	return monaco.Uri.file(`/${repo}/-/${rev}/-/${file}`);
}
